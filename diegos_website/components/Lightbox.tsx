"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocalPicture } from "./LocalPicture";
import type { LocalImage } from "@/lib/content";

type Props = {
  images: LocalImage[];
  /** Trigger nodes rendered by the parent. Each click opens the matching index. */
  children: React.ReactNode;
};

/**
 * Wraps gallery thumbnails. Any descendant with `data-lightbox-index` triggers
 * the overlay for that index. Supports keyboard nav, swipe, and focus return.
 */
export function Lightbox({ images, children }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const blockImageActions = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
  }, []);

  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  );
  const prev = useCallback(
    () =>
      setIndex((i) =>
        i === null ? i : (i - 1 + images.length) % images.length
      ),
    [images.length]
  );

  // Open from data-lightbox-index clicks
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-lightbox-index]"
      );
      if (!target) return;
      e.preventDefault();
      triggerRef.current = target;
      const i = Number(target.dataset.lightboxIndex);
      if (!Number.isNaN(i)) setIndex(i);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  // Keyboard nav + scroll lock
  useEffect(() => {
    if (index === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, next, prev]);

  // Touch swipe
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      close();
    }
    touch.current = null;
  };

  const current = index !== null ? images[index] : null;

  return (
    <div
      ref={rootRef}
      onContextMenu={blockImageActions}
      onDragStart={blockImageActions}
      className="[&_*]:[-webkit-touch-callout:none]"
    >
      {children}

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || "Image viewer"}
          className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-sm flex flex-col animate-fade-in"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex items-center justify-between px-5 md:px-8 h-14 md:h-16 text-paper/80 text-[11px] uppercase tracking-widest">
            <span>
              {index! + 1} / {images.length}
            </span>
            <button
              onClick={close}
              aria-label="Close"
              className="hover:text-paper transition-opacity text-base tracking-normal normal-case"
            >
              Close ✕
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-4 md:px-16">
            <button
              onClick={prev}
              aria-label="Previous image"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-paper/70 hover:text-paper transition-colors"
            >
              <span className="block w-6 h-px bg-current relative">
                <span className="absolute -left-[1px] -top-[5px] w-[11px] h-px bg-current rotate-[-45deg] origin-left" />
                <span className="absolute -left-[1px] top-[5px] w-[11px] h-px bg-current rotate-[45deg] origin-left" />
              </span>
            </button>

            <div className="relative w-full h-full max-h-[82vh] flex items-center justify-center">
              <div className="relative w-full h-full">
                <LocalPicture
                  key={current.src}
                  image={current}
                  fill
                  sizes="100vw"
                  className="object-contain animate-fade-in"
                />
              </div>
            </div>

            <button
              onClick={next}
              aria-label="Next image"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-paper/70 hover:text-paper transition-colors"
            >
              <span className="block w-6 h-px bg-current relative">
                <span className="absolute right-[-1px] -top-[5px] w-[11px] h-px bg-current rotate-[45deg] origin-right" />
                <span className="absolute right-[-1px] top-[5px] w-[11px] h-px bg-current rotate-[-45deg] origin-right" />
              </span>
            </button>
          </div>

          <div className="px-5 md:px-8 pb-6 pt-3 text-paper/70 text-sm min-h-[56px]">
            {current.caption ? (
              <p className="max-w-3xl mx-auto text-center">{current.caption}</p>
            ) : null}
          </div>

          <div className="md:hidden absolute inset-y-14 left-0 w-1/3" onClick={prev} />
          <div className="md:hidden absolute inset-y-14 right-0 w-1/3" onClick={next} />
        </div>
      ) : null}
    </div>
  );
}
