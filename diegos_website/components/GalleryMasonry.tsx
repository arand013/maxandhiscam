import { LocalPicture } from "./LocalPicture";
import type { LocalImage } from "@/lib/content";

/**
 * CSS-columns masonry. Each image is a lightbox trigger via
 * `data-lightbox-index`. Heights come from intrinsic dimensions so the
 * layout settles without jank.
 */
export function GalleryMasonry({ images }: { images: LocalImage[] }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance]">
      {images.map((img, i) => (
        <button
          key={img.src}
          type="button"
          data-lightbox-index={i}
          aria-label={`Open image ${i + 1}${img.alt ? `: ${img.alt}` : ""}`}
          className="group mb-4 md:mb-6 block w-full break-inside-avoid overflow-hidden bg-paper-warm reveal"
        >
          <LocalPicture
            image={img}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="w-full h-auto transition-transform duration-700 ease-out-quart group-hover:scale-[1.02]"
          />
        </button>
      ))}
    </div>
  );
}
