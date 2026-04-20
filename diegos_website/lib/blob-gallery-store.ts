import { del, get, put } from "@vercel/blob";
import type { LocalGallery } from "@/lib/content";

export const BLOB_GALLERIES_MANIFEST_PATH = "site/galleries.json";

type BlobGalleryManifest = {
  generatedAt?: string;
  galleries?: LocalGallery[];
};

export function isBlobGalleryStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobUrl(value: string) {
  return value.includes(".blob.vercel-storage.com/");
}

export async function loadBlobGalleryManifest(): Promise<BlobGalleryManifest | null> {
  if (!isBlobGalleryStoreConfigured()) {
    return null;
  }

  try {
    const result = await get(BLOB_GALLERIES_MANIFEST_PATH, {
      access: "public",
    });

    if (!result || result.statusCode !== 200) {
      return null;
    }

    return JSON.parse(
      await new Response(result.stream).text()
    ) as BlobGalleryManifest;
  } catch (error) {
    console.error("Failed to load gallery manifest from Vercel Blob:", error);
    return null;
  }
}

export async function saveBlobGalleryManifest(galleries: LocalGallery[]) {
  if (!isBlobGalleryStoreConfigured()) {
    throw new Error("Vercel Blob is not configured");
  }

  await put(
    BLOB_GALLERIES_MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        galleries,
      },
      null,
      2
    ),
    {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    }
  );
}

export async function uploadGalleryBlob(pathname: string, body: Buffer) {
  if (!isBlobGalleryStoreConfigured()) {
    throw new Error("Vercel Blob is not configured");
  }

  return put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/jpeg",
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });
}

export async function deleteGalleryBlob(urlOrPathname: string) {
  if (!isBlobGalleryStoreConfigured()) {
    return;
  }

  await del(urlOrPathname);
}
