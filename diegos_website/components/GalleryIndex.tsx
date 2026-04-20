import Link from "next/link";
import { LocalPicture } from "./LocalPicture";
import type { LocalGallery } from "@/lib/content";

/**
 * Editorial grid of galleries. Alternating column spans give the page a
 * rhythm closer to a photographer's contact sheet than a uniform grid.
 */
export function GalleryIndex({ galleries }: { galleries: LocalGallery[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-16 md:gap-y-24">
      {galleries.map((g, i) => {
        const span = SPANS[i % SPANS.length];
        return (
          <Link
            key={g.slug}
            href={`/portfolio/${g.slug}`}
            className={`group block reveal ${span.col} ${span.offset}`}
          >
            <div className="relative overflow-hidden bg-paper-warm aspect-[4/5]">
              <LocalPicture
                image={g.cover}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-out-quart group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-6">
              <div>
                <h3 className="font-display text-2xl md:text-3xl leading-tight">
                  {g.title}
                </h3>
                {g.location ? (
                  <p className="mt-1 eyebrow">{g.location}</p>
                ) : null}
              </div>
              {g.year ? (
                <span className="eyebrow shrink-0">{g.year}</span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const SPANS = [
  { col: "md:col-span-4", offset: "" },
  { col: "md:col-span-3", offset: "md:col-start-4" },
  { col: "md:col-span-3", offset: "" },
  { col: "md:col-span-4", offset: "md:col-start-3" },
  { col: "md:col-span-3", offset: "" },
  { col: "md:col-span-3", offset: "md:col-start-4" },
];
