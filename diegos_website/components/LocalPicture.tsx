import Image from "next/image";
import type { LocalImage } from "@/lib/content";

type Props = {
  image: LocalImage;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fill?: boolean;
  aspect?: number;
};

/**
 * Thin wrapper around next/image for locally-stored photos. Uses the blur
 * data URL baked by scripts/photos.ts.
 */
export function LocalPicture({
  image,
  priority,
  sizes = "100vw",
  className,
  fill,
  aspect,
}: Props) {
  const protectedClassName = ["select-none pointer-events-none", className]
    .filter(Boolean)
    .join(" ");
  const unoptimized = image.src.startsWith("http");

  if (fill) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        unoptimized={unoptimized}
        className={protectedClassName}
        draggable={false}
      />
    );
  }

  const width = image.width;
  const height = aspect ? Math.round(width / aspect) : image.height;

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={image.blurDataURL}
      unoptimized={unoptimized}
      className={protectedClassName}
      draggable={false}
    />
  );
}
