"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { getStoredGalleries } from "@/lib/content";
import {
  deleteGalleryBlob,
  isBlobGalleryStoreConfigured,
  isBlobUrl,
  saveBlobGalleryManifest,
  uploadGalleryBlob,
} from "@/lib/blob-gallery-store";
import {
  ensureDir,
  gallerySourceDir,
  listSourceGalleries,
  nextImageOrder,
  readGalleryMeta,
  runPhotoPipeline,
  sanitizeFilename,
  slugify,
  syncImageOrderMeta,
  titleFromSlug,
  writeGalleryMeta,
} from "@/lib/photo-pipeline";
import {
  isAdminPasswordConfigured,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
} from "@/lib/admin-auth";

const ACCEPTED_IMAGE_EXT = /\.(tiff?|jpe?g|png|webp|heic|heif)$/i;

export async function loginAction(formData: FormData) {
  if (!isAdminPasswordConfigured()) {
    redirect("/admin?error=Admin+password+is+not+configured");
  }

  const password = String(formData.get("password") ?? "");
  const ok = await loginAdmin(password);

  if (!ok) {
    redirect("/admin?error=Invalid+password");
  }

  redirect("/admin?message=Signed+in");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin?message=Signed+out");
}

export async function uploadPhotosAction(formData: FormData) {
  await requireAdmin();

  const slugInput = String(formData.get("gallerySlug") ?? "");
  const slug = slugify(slugInput);
  const uploads = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!slug) {
    redirect("/admin?error=Enter+a+gallery+slug");
  }

  if (uploads.length === 0) {
    redirect("/admin?error=Select+at+least+one+photo");
  }

  if (isBlobGalleryStoreConfigured()) {
    const savedCount = await uploadPhotosToBlob(slug, uploads);
    refreshSite(slug);
    redirect(`/admin?message=Uploaded+${savedCount}+photo${savedCount === 1 ? "" : "s"}`);
  }

  const dir = gallerySourceDir(slug);
  ensureDir(dir);

  const meta = readGalleryMeta(dir);
  const nextImages = { ...(meta.images ?? {}) };
  let order = nextImageOrder();
  let savedCount = 0;

  for (const upload of uploads) {
    const sourceFile = await persistUpload(dir, upload);
    if (!sourceFile) continue;

    const existing = nextImages[sourceFile] ?? {};
    nextImages[sourceFile] = {
      ...existing,
      order,
    };
    order += 1;
    savedCount += 1;
  }

  if (savedCount === 0) {
    redirect("/admin?error=No+supported+photos+were+uploaded");
  }

  writeGalleryMeta(dir, {
    ...meta,
    title: meta.title ?? titleFromSlug(slug),
    images: nextImages,
  });

  syncImageOrderMeta();
  await runPhotoPipeline();
  refreshSite(slug);
  redirect(`/admin?message=Uploaded+${savedCount}+photo${savedCount === 1 ? "" : "s"}`);
}

export async function savePhotoOrderAction(
  photos: Array<{ slug: string; sourceFile: string }>
) {
  await requireAdmin();

  if (isBlobGalleryStoreConfigured()) {
    const galleries = await getStoredGalleries();
    const ordered = sortManifestImages(galleries);
    const expected = new Set(
      ordered.map((photo) => `${photo.slug}:${photo.sourceFile}`)
    );

    const keys = photos.map((photo) => {
      const slug = String(photo.slug ?? "");
      const sourceFile = sanitizeSourceFile(String(photo.sourceFile ?? ""));
      return `${slug}:${sourceFile}`;
    });

    if (
      keys.length !== ordered.length ||
      new Set(keys).size !== keys.length ||
      keys.some((key) => !expected.has(key))
    ) {
      return {
        ok: false,
        message: "Could not save order. Refresh the page and try again.",
      };
    }

    const nextBySlug = new Map(
      galleries.map((gallery) => [
        gallery.slug,
        {
          ...gallery,
          images: gallery.images.map((image) => ({ ...image })),
        },
      ])
    );

    keys.forEach((key, index) => {
      const [slug, sourceFile] = key.split(":");
      const gallery = nextBySlug.get(slug);
      const image = gallery?.images.find(
        (item) => (item.sourceFile ?? path.basename(item.src)) === sourceFile
      );

      if (image) {
        image.order = index;
      }
    });

    await saveBlobGalleryManifest(Array.from(nextBySlug.values()));
    refreshSite();

    return {
      ok: true,
      message: "Photo order saved.",
    };
  }

  const ordered = getOrderedPhotos();
  const expected = new Set(
    ordered.map((photo) => `${photo.slug}:${photo.file}`)
  );

  const keys = photos.map((photo) => {
    const slug = String(photo.slug ?? "");
    const sourceFile = sanitizeSourceFile(String(photo.sourceFile ?? ""));
    return `${slug}:${sourceFile}`;
  });

  if (
    keys.length !== ordered.length ||
    new Set(keys).size !== keys.length ||
    keys.some((key) => !expected.has(key))
  ) {
    return {
      ok: false,
      message: "Could not save order. Refresh the page and try again.",
    };
  }

  const byKey = new Map<string, (typeof ordered)[number]>(
    ordered.map((photo) => [`${photo.slug}:${photo.file}`, photo])
  );
  const reordered = keys
    .map((key) => byKey.get(key))
    .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));

  writeOrderedMeta(reordered);
  await runPhotoPipeline();
  refreshSite();

  return {
    ok: true,
    message: "Photo order saved.",
  };
}

export async function deletePhotoAction(formData: FormData) {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "");
  const sourceFile = sanitizeSourceFile(String(formData.get("sourceFile") ?? ""));

  if (isBlobGalleryStoreConfigured()) {
    const galleries = await getStoredGalleries();
    const gallery = galleries.find((item) => item.slug === slug);
    const image = gallery?.images.find(
      (item) => (item.sourceFile ?? path.basename(item.src)) === sourceFile
    );

    if (!gallery || !image) {
      redirect("/admin?error=Photo+not+found");
    }

    const remainingImages = gallery.images.filter(
      (item) => (item.sourceFile ?? path.basename(item.src)) !== sourceFile
    );

    if (isBlobUrl(image.src)) {
      await deleteGalleryBlob(image.src);
    }

    const nextGalleries = galleries
      .map((item) => {
        if (item.slug !== slug) {
          return item;
        }

        if (remainingImages.length === 0) {
          return null;
        }

        const existingCoverSource =
          item.cover.sourceFile ?? path.basename(item.cover.src);
        const nextCover =
          existingCoverSource === sourceFile
            ? remainingImages[0]
            : remainingImages.find(
                (candidate) =>
                  (candidate.sourceFile ?? path.basename(candidate.src)) ===
                  existingCoverSource
              ) ?? remainingImages[0];

        return {
          ...item,
          cover: nextCover,
          images: remainingImages,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    await saveBlobGalleryManifest(nextGalleries);
    refreshSite(slug);
    redirect("/admin?message=Photo+removed");
  }

  const dir = gallerySourceDir(slug);
  const filePath = path.join(dir, sourceFile);

  if (!fs.existsSync(filePath)) {
    redirect("/admin?error=Photo+not+found");
  }

  fs.unlinkSync(filePath);

  const meta = readGalleryMeta(dir);
  const nextImages = { ...(meta.images ?? {}) };
  delete nextImages[sourceFile];
  delete nextImages[`${sourceFile.replace(/\.[^.]+$/, "")}.jpg`];

  writeGalleryMeta(dir, {
    ...meta,
    cover:
      meta.cover === sourceFile ||
      meta.cover === sourceFile.replace(/\.[^.]+$/, "")
        ? undefined
        : meta.cover,
    images: nextImages,
  });

  syncImageOrderMeta();
  await runPhotoPipeline();
  refreshSite(slug);
  redirect("/admin?message=Photo+removed");
}

async function persistUpload(dir: string, upload: File) {
  const originalName = upload.name || "photo.jpg";
  if (!ACCEPTED_IMAGE_EXT.test(originalName)) return null;

  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const base =
    sanitizeFilename(path.basename(originalName, ext)) ||
    `photo-${Date.now()}`;

  let candidate = `${base}${ext}`;
  let counter = 1;

  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${counter}${ext}`;
    counter += 1;
  }

  const bytes = Buffer.from(await upload.arrayBuffer());
  fs.writeFileSync(path.join(dir, candidate), bytes);
  return candidate;
}

function getOrderedPhotos() {
  const galleries = listSourceGalleries();

  return galleries
    .flatMap((gallery) =>
      gallery.files.map((file) => {
        const outFile = `${file.replace(/\.[^.]+$/, "")}.jpg`;
        const override =
          gallery.meta.images?.[file] ?? gallery.meta.images?.[outFile] ?? {};

        return {
          slug: gallery.slug,
          dir: gallery.dir,
          galleryMeta: gallery.meta,
          file,
          order:
            typeof override.order === "number"
              ? override.order
              : Number.POSITIVE_INFINITY,
          galleryOrder: gallery.order,
          galleryIndex: gallery.index,
        };
      })
    )
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.galleryOrder - b.galleryOrder ||
        a.galleryIndex - b.galleryIndex ||
        a.slug.localeCompare(b.slug, undefined, {
          numeric: true,
          sensitivity: "base",
        }) ||
        a.file.localeCompare(b.file, undefined, {
          numeric: true,
          sensitivity: "base",
        })
    );
}

function writeOrderedMeta(
  ordered: Array<{
    slug: string;
    dir: string;
    galleryMeta: ReturnType<typeof readGalleryMeta>;
    file: string;
  }>
) {
  const bySlug = new Map<
    string,
    {
      dir: string;
      meta: ReturnType<typeof readGalleryMeta>;
      files: Array<{ file: string; order: number }>;
    }
  >();

  ordered.forEach((photo, index) => {
    const existing = bySlug.get(photo.slug);
    if (existing) {
      existing.files.push({ file: photo.file, order: index });
      return;
    }

    bySlug.set(photo.slug, {
      dir: photo.dir,
      meta: photo.galleryMeta,
      files: [{ file: photo.file, order: index }],
    });
  });

  for (const { dir, meta, files } of bySlug.values()) {
    const nextImages = Object.fromEntries(
      files.map(({ file, order }) => {
        const outFile = `${file.replace(/\.[^.]+$/, "")}.jpg`;
        const current = meta.images?.[file] ?? meta.images?.[outFile] ?? {};
        return [
          file,
          {
            ...(current.alt ? { alt: current.alt } : {}),
            ...(current.caption ? { caption: current.caption } : {}),
            order,
          },
        ];
      })
    );

    writeGalleryMeta(dir, {
      ...meta,
      images: nextImages,
    });
  }
}

function sanitizeSourceFile(file: string) {
  const clean = path.basename(file);
  if (!clean || clean !== file) {
    redirect("/admin?error=Invalid+photo+reference");
  }
  return clean;
}

function refreshSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/portfolio");
  if (slug) {
    revalidatePath(`/portfolio/${slug}`);
  }
}

async function uploadPhotosToBlob(slug: string, uploads: File[]) {
  const galleries = await getStoredGalleries();
  const existingGallery = galleries.find((gallery) => gallery.slug === slug);
  const nextGalleryOrder =
    galleries.reduce((max, gallery) => Math.max(max, gallery.order), -1) + 1;
  let nextOrder =
    galleries
      .flatMap((gallery) => gallery.images)
      .reduce((max, image) => Math.max(max, image.order ?? -1), -1) + 1;
  const usedFiles = new Set(
    (existingGallery?.images ?? []).map(
      (image) => image.sourceFile ?? path.basename(image.src)
    )
  );
  const nextImages = [...(existingGallery?.images ?? [])];
  let savedCount = 0;

  for (const upload of uploads) {
    const image = await uploadPhotoToBlob(slug, upload, usedFiles, nextOrder);
    if (!image) continue;

    nextImages.push(image);
    usedFiles.add(image.sourceFile ?? path.basename(image.src));
    nextOrder += 1;
    savedCount += 1;
  }

  if (savedCount === 0) {
    redirect("/admin?error=No+supported+photos+were+uploaded");
  }

  const nextGallery = {
    slug,
    title: existingGallery?.title ?? titleFromSlug(slug),
    location: existingGallery?.location,
    year: existingGallery?.year,
    description: existingGallery?.description,
    order: existingGallery?.order ?? nextGalleryOrder,
    visible: existingGallery?.visible ?? true,
    cover: existingGallery?.cover ?? nextImages[0],
    images: nextImages,
  };

  await saveBlobGalleryManifest([
    ...galleries.filter((gallery) => gallery.slug !== slug),
    nextGallery,
  ]);

  return savedCount;
}

async function uploadPhotoToBlob(
  slug: string,
  upload: File,
  usedFiles: Set<string>,
  order: number
) {
  const originalName = upload.name || "photo.jpg";
  if (!ACCEPTED_IMAGE_EXT.test(originalName)) return null;

  const baseName =
    sanitizeFilename(path.basename(originalName, path.extname(originalName))) ||
    `photo-${Date.now()}`;
  const candidate = uniqueJpegName(baseName, usedFiles);
  const sourceBuffer = Buffer.from(await upload.arrayBuffer());
  const { data, info } = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize(2400, 2400, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const blob = await uploadGalleryBlob(`photos/${slug}/${candidate}`, data);

  return {
    name: candidate.replace(/\.jpg$/i, ""),
    src: blob.url,
    width: info.width,
    height: info.height,
    blurDataURL: await makeBlurDataUrl(data),
    alt: baseName.replace(/[-_]/g, " "),
    sourceFile: candidate,
    order,
  };
}

async function makeBlurDataUrl(buffer: Buffer) {
  const { data } = await sharp(buffer)
    .resize(24, 24, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer({ resolveWithObject: true });

  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

function uniqueJpegName(base: string, usedFiles: Set<string>) {
  let candidate = `${base}.jpg`;
  let counter = 1;

  while (usedFiles.has(candidate)) {
    candidate = `${base}-${counter}.jpg`;
    counter += 1;
  }

  return candidate;
}

function sortManifestImages(
  galleries: Awaited<ReturnType<typeof getStoredGalleries>>
) {
  return galleries
    .flatMap((gallery) =>
      gallery.images.map((image) => ({
        slug: gallery.slug,
        sourceFile: image.sourceFile ?? path.basename(image.src),
        order:
          typeof image.order === "number"
            ? image.order
            : Number.POSITIVE_INFINITY,
        galleryOrder: gallery.order,
        source: image.src,
      }))
    )
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.galleryOrder - b.galleryOrder ||
        a.slug.localeCompare(b.slug, undefined, {
          numeric: true,
          sensitivity: "base",
        }) ||
        a.sourceFile.localeCompare(b.sourceFile, undefined, {
          numeric: true,
          sensitivity: "base",
        }) ||
        a.source.localeCompare(b.source, undefined, {
          numeric: true,
          sensitivity: "base",
        })
    );
}
