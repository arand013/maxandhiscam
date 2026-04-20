import { GalleryMasonry } from "@/components/GalleryMasonry";
import { Lightbox } from "@/components/Lightbox";
import { getOrderedPortfolioImages, getSite } from "@/lib/content";

export const dynamic = "force-dynamic";

export default function Page() {
  const site = getSite();
  const images = getOrderedPortfolioImages();

  return (
    <div className="wrap pt-10 md:pt-16 pb-20">
      <header className="mb-12 md:mb-20 grid md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-8">
          <p className="eyebrow">Portfolio</p>
          <h1 className="mt-4 font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
            {site.home.heroHeadline ?? site.name}
          </h1>
          {site.tagline ? (
            <p className="mt-6 max-w-xl text-ink/70 text-base md:text-lg leading-relaxed">
              {site.tagline}
            </p>
          ) : null}
        </div>
      </header>

      {images.length === 0 ? (
        <EmptyState />
      ) : (
        <Lightbox images={images}>
          <GalleryMasonry images={images} />
        </Lightbox>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 max-w-xl">
      <p className="text-stone-subtle leading-relaxed">
        No photographs yet. Drop images into{" "}
        <code className="font-mono bg-paper-warm px-1.5 py-0.5">
          photos/&lt;gallery&gt;/
        </code>{" "}
        and run{" "}
        <code className="font-mono bg-paper-warm px-1.5 py-0.5">
          npm run photos
        </code>
        . See <code className="font-mono bg-paper-warm px-1.5 py-0.5">ADMIN.md</code>.
      </p>
    </div>
  );
}
