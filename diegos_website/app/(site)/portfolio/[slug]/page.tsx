import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryMasonry } from "@/components/GalleryMasonry";
import { Lightbox } from "@/components/Lightbox";
import { getGallery } from "@/lib/content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return { title: "Gallery" };
  return {
    title: shouldHideGalleryTitle(gallery.slug) ? "Portfolio" : gallery.title,
    description: gallery.description,
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) notFound();

  const images = gallery.images;

  return (
    <div className="wrap pt-20 md:pt-28 pb-24">
      <header className="mb-12 md:mb-20 grid md:grid-cols-12 gap-6">
        <div className="md:col-span-2">
          <Link href="/" className="eyebrow hover:opacity-60 transition-opacity">
            ← Portfolio
          </Link>
        </div>
        <div className="md:col-span-8">
          {!shouldHideGalleryTitle(gallery.slug) ? (
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              {gallery.title}
            </h1>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 eyebrow">
            {gallery.location ? <span>{gallery.location}</span> : null}
            {gallery.year ? <span>{gallery.year}</span> : null}
            <span>
              {images.length} {images.length === 1 ? "image" : "images"}
            </span>
          </div>
          {gallery.description ? (
            <p className="mt-8 max-w-2xl text-base md:text-lg text-ink/70 leading-relaxed">
              {gallery.description}
            </p>
          ) : null}
        </div>
      </header>

      {images.length > 0 ? (
        <Lightbox images={images}>
          <GalleryMasonry images={images} />
        </Lightbox>
      ) : (
        <p className="text-stone-subtle">No images in this gallery yet.</p>
      )}
    </div>
  );
}

function shouldHideGalleryTitle(slug: string) {
  return slug === "mexico";
}
