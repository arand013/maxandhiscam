import fs from "node:fs";
import path from "node:path";
import { loadBlobGalleryManifest } from "@/lib/blob-gallery-store";

const ROOT = process.cwd();

export type LocalImage = {
  name: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
  caption?: string;
  sourceFile?: string;
  order?: number;
  gallerySlug?: string;
};

export type LocalGallery = {
  slug: string;
  title: string;
  location?: string;
  year?: string;
  description?: string;
  order: number;
  visible: boolean;
  cover: LocalImage;
  images: LocalImage[];
};

export type SiteContent = {
  name: string;
  navTitle?: string;
  tagline?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  youtubeHandle?: string;
  youtubeUrl?: string;
  email?: string;
  footerNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  home: {
    heroImage?: string;
    heroHeadline?: string;
    heroSubhead?: string;
    aboutPreview?: string;
    featured?: string[];
  };
  contact: {
    headline?: string;
    body?: string;
    email?: string;
    location?: string;
    availability?: string;
  };
};

const DEFAULT_SITE: SiteContent = {
  name: "Diego Ortega",
  navTitle: "Diego Ortega",
  home: { featured: [] },
  contact: {},
};

function safeRead<T>(relPath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getSite(): SiteContent {
  const site = safeRead<Partial<SiteContent>>("content/site.json", {});
  return {
    ...DEFAULT_SITE,
    ...site,
    home: { ...DEFAULT_SITE.home, ...(site.home ?? {}) },
    contact: { ...DEFAULT_SITE.contact, ...(site.contact ?? {}) },
  };
}

function getLocalGalleryData() {
  return safeRead<{ galleries?: LocalGallery[] }>("content/galleries.json", {
    galleries: [],
  });
}

export async function getStoredGalleries(): Promise<LocalGallery[]> {
  const remote = await loadBlobGalleryManifest();
  if (remote) {
    return remote.galleries ?? [];
  }

  return getLocalGalleryData().galleries ?? [];
}

export async function getGalleries(): Promise<LocalGallery[]> {
  return (await getStoredGalleries())
    .filter((g) => g.visible !== false)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export async function getGallery(slug: string): Promise<LocalGallery | null> {
  return (await getGalleries()).find((g) => g.slug === slug) ?? null;
}

export async function getOrderedPortfolioImages(): Promise<LocalImage[]> {
  return (await getGalleries())
    .flatMap((gallery) =>
      gallery.images.map((image) => ({
        ...image,
        gallerySlug: gallery.slug,
      }))
    )
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.src.localeCompare(b.src, undefined, {
          numeric: true,
          sensitivity: "base",
        })
    );
}

export async function getFeatured(): Promise<LocalGallery[]> {
  const site = getSite();
  const galleries = await getGalleries();
  const wanted = site.home.featured ?? [];
  if (wanted.length === 0) return galleries.slice(0, 3);
  const bySlug = new Map(galleries.map((g) => [g.slug, g]));
  return wanted
    .map((s) => bySlug.get(s))
    .filter((g): g is LocalGallery => !!g);
}
