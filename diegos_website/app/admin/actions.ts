"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
