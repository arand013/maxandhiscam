import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export type ImageMetaOverride = {
  alt?: string;
  caption?: string;
  order?: number;
};

export type GalleryMeta = {
  title?: string;
  location?: string;
  year?: string;
  description?: string;
  order?: number;
  visible?: boolean;
  cover?: string;
  images?: Record<string, ImageMetaOverride>;
};

export type ManifestImage = {
  name: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
  caption?: string;
  sourceFile: string;
  order: number;
};

export type ManifestGallery = {
  slug: string;
  title: string;
  location?: string;
  year?: string;
  description?: string;
  order: number;
  visible: boolean;
  cover: ManifestImage;
  images: ManifestImage[];
};

type SourceGallery = {
  folder: string;
  slug: string;
  dir: string;
  meta: GalleryMeta;
  order: number;
  index: number;
  files: string[];
};

type SourceImageRecord = {
  slug: string;
  dir: string;
  file: string;
  galleryOrder: number;
  galleryIndex: number;
  override: ImageMetaOverride;
};

export const ROOT = process.cwd();
export const SRC_DIR = path.join(ROOT, "photos");
export const OUT_DIR = path.join(ROOT, "public", "photos");
export const MANIFEST = path.join(ROOT, "content", "galleries.json");

const MAX_LONG_EDGE = 2400;
const QUALITY = 85;
const IMAGE_EXT = /\.(tiff?|jpe?g|png|webp|heic|heif)$/i;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function gallerySourceDir(slug: string) {
  return path.join(SRC_DIR, slug);
}

export function galleryPublicDir(slug: string) {
  return path.join(OUT_DIR, slug);
}

export function sanitizeFilename(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readGalleryMeta(dir: string): GalleryMeta {
  const metaPath = path.join(dir, "meta.json");
  if (!fs.existsSync(metaPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as GalleryMeta;
  } catch (error) {
    console.warn(`bad meta.json in ${dir}: ${(error as Error).message}`);
    return {};
  }
}

export function writeGalleryMeta(dir: string, meta: GalleryMeta) {
  ensureDir(dir);
  const metaPath = path.join(dir, "meta.json");
  const cleaned = cleanGalleryMeta(meta);
  fs.writeFileSync(metaPath, `${JSON.stringify(cleaned, null, 2)}\n`);
}

export function listSourceGalleries(): SourceGallery[] {
  if (!fs.existsSync(SRC_DIR)) return [];

  return fs
    .readdirSync(SRC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => compareText(a.name, b.name))
    .map((entry, index) => {
      const dir = path.join(SRC_DIR, entry.name);
      const meta = readGalleryMeta(dir);

      return {
        folder: entry.name,
        slug: slugify(entry.name),
        dir,
        meta,
        order: meta.order ?? index,
        index,
        files: fs
          .readdirSync(dir)
          .filter((file) => IMAGE_EXT.test(file))
          .sort(compareText),
      };
    });
}

export function listSourceImageRecords(galleries = listSourceGalleries()) {
  return galleries.flatMap((gallery) =>
    gallery.files.map((file) => ({
      slug: gallery.slug,
      dir: gallery.dir,
      file,
      galleryOrder: gallery.order,
      galleryIndex: gallery.index,
      override: getImageOverride(gallery.meta, file),
    }))
  );
}

export function buildImageOrderMap(records = listSourceImageRecords()) {
  const sorted = [...records].sort(compareSourceImages);
  return new Map(sorted.map((record, index) => [imageKey(record.slug, record.file), index]));
}

export function syncImageOrderMeta() {
  const galleries = listSourceGalleries();
  const orderMap = buildImageOrderMap(listSourceImageRecords(galleries));

  for (const gallery of galleries) {
    const nextImages = Object.fromEntries(
      gallery.files.map((file) => {
        const current = getImageOverride(gallery.meta, file);
        return [
          file,
          compactImageMeta({
            alt: current.alt,
            caption: current.caption,
            order: orderMap.get(imageKey(gallery.slug, file)) ?? 0,
          }),
        ];
      })
    );

    writeGalleryMeta(gallery.dir, {
      ...gallery.meta,
      images: nextImages,
    });
  }
}

export function nextImageOrder() {
  const orderMap = buildImageOrderMap();
  return orderMap.size;
}

export async function runPhotoPipeline() {
  ensureDir(SRC_DIR);
  ensureDir(OUT_DIR);

  const sourceGalleries = listSourceGalleries();
  const orderMap = buildImageOrderMap(listSourceImageRecords(sourceGalleries));
  const galleries: ManifestGallery[] = [];

  for (const gallery of sourceGalleries) {
    const outGalleryDir = galleryPublicDir(gallery.slug);
    ensureDir(outGalleryDir);

    if (gallery.files.length === 0) {
      cleanStaleOutputs(outGalleryDir, new Set());
      continue;
    }

    const orderedFiles = [...gallery.files].sort((a, b) => {
      return (
        (orderMap.get(imageKey(gallery.slug, a)) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(imageKey(gallery.slug, b)) ?? Number.MAX_SAFE_INTEGER) ||
        compareText(a, b)
      );
    });

    const images: ManifestImage[] = [];

    for (const file of orderedFiles) {
      const base = file.replace(/\.[^.]+$/, "");
      const outFile = `${base}.jpg`;
      const srcPath = path.join(gallery.dir, file);
      const outPath = path.join(outGalleryDir, outFile);
      const override = getImageOverride(gallery.meta, file);

      try {
        const { width, height, blurDataURL } = await processImage(srcPath, outPath);
        images.push({
          name: base,
          src: `/photos/${gallery.slug}/${outFile}`,
          width,
          height,
          blurDataURL,
          alt: override.alt ?? base.replace(/[-_]/g, " "),
          caption: override.caption,
          sourceFile: file,
          order: orderMap.get(imageKey(gallery.slug, file)) ?? 0,
        });
      } catch (error) {
        console.error(`failed to process ${srcPath}: ${(error as Error).message}`);
      }
    }

    cleanStaleOutputs(
      outGalleryDir,
      new Set(images.map((image) => path.basename(image.src)))
    );

    if (images.length === 0) continue;

    const coverName = gallery.meta.cover?.replace(/\.[^.]+$/, "");
    const cover =
      images.find(
        (image) =>
          image.name === coverName ||
          image.sourceFile === gallery.meta.cover
      ) ?? images[0];

    galleries.push({
      slug: gallery.slug,
      title: gallery.meta.title ?? titleFromSlug(gallery.slug),
      location: gallery.meta.location,
      year: gallery.meta.year,
      description: gallery.meta.description,
      order: gallery.order,
      visible: gallery.meta.visible !== false,
      cover,
      images,
    });
  }

  ensureDir(path.dirname(MANIFEST));
  fs.writeFileSync(
    MANIFEST,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        galleries,
      },
      null,
      2
    )}\n`
  );

  return galleries;
}

async function processImage(
  srcPath: string,
  outPath: string
): Promise<{ width: number; height: number; blurDataURL: string }> {
  const srcStat = fs.statSync(srcPath);
  const outExists = fs.existsSync(outPath);
  const outStat = outExists ? fs.statSync(outPath) : null;

  if (outStat && outStat.mtimeMs >= srcStat.mtimeMs) {
    const meta = await sharp(outPath).metadata();
    return {
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      blurDataURL: await makeBlur(outPath),
    };
  }

  const info = await sharp(srcPath, { failOn: "none" })
    .rotate()
    .resize(MAX_LONG_EDGE, MAX_LONG_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(outPath);

  return {
    width: info.width,
    height: info.height,
    blurDataURL: await makeBlur(outPath),
  };
}

async function makeBlur(filePath: string) {
  const { data } = await sharp(filePath)
    .resize(24, 24, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer({ resolveWithObject: true });

  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

function getImageOverride(meta: GalleryMeta, file: string): ImageMetaOverride {
  const outFile = `${file.replace(/\.[^.]+$/, "")}.jpg`;
  return meta.images?.[file] ?? meta.images?.[outFile] ?? {};
}

function cleanStaleOutputs(dir: string, keep: Set<string>) {
  if (!fs.existsSync(dir)) return;

  for (const existing of fs.readdirSync(dir)) {
    if (!keep.has(existing)) {
      fs.unlinkSync(path.join(dir, existing));
    }
  }
}

function cleanGalleryMeta(meta: GalleryMeta): GalleryMeta {
  const nextImages = Object.fromEntries(
    Object.entries(meta.images ?? {})
      .map(([file, value]) => [file, compactImageMeta(value)])
      .filter(([, value]) => Object.keys(value).length > 0)
  );

  return {
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.location ? { location: meta.location } : {}),
    ...(meta.year ? { year: meta.year } : {}),
    ...(meta.description ? { description: meta.description } : {}),
    ...(typeof meta.order === "number" ? { order: meta.order } : {}),
    ...(meta.visible === false ? { visible: false } : {}),
    ...(meta.cover ? { cover: meta.cover } : {}),
    ...(Object.keys(nextImages).length > 0 ? { images: nextImages } : {}),
  };
}

function compactImageMeta(meta: ImageMetaOverride): ImageMetaOverride {
  return {
    ...(meta.alt ? { alt: meta.alt } : {}),
    ...(meta.caption ? { caption: meta.caption } : {}),
    ...(typeof meta.order === "number" ? { order: meta.order } : {}),
  };
}

function compareSourceImages(a: SourceImageRecord, b: SourceImageRecord) {
  const aOrder =
    typeof a.override.order === "number" ? a.override.order : Number.POSITIVE_INFINITY;
  const bOrder =
    typeof b.override.order === "number" ? b.override.order : Number.POSITIVE_INFINITY;

  return (
    aOrder - bOrder ||
    a.galleryOrder - b.galleryOrder ||
    a.galleryIndex - b.galleryIndex ||
    compareText(a.slug, b.slug) ||
    compareText(a.file, b.file)
  );
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function imageKey(slug: string, file: string) {
  return `${slug}:${file}`;
}
