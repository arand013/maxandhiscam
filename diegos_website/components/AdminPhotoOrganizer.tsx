"use client";

import type { DragEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePhotoAction, savePhotoOrderAction } from "@/app/admin/actions";
import { LocalPicture } from "./LocalPicture";
import type { LocalImage } from "@/lib/content";

type AdminPhoto = LocalImage & {
  gallerySlug: string;
  galleryTitle?: string;
};

export function AdminPhotoOrganizer({ images }: { images: AdminPhoto[] }) {
  const router = useRouter();
  const [items, setItems] = useState(images);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const savedOrderRef = useRef(images.map(photoKey));

  useEffect(() => {
    setItems(images);
    savedOrderRef.current = images.map(photoKey);
  }, [images]);

  function handleDragStart(key: string, event: DragEvent<HTMLElement>) {
    if (isPending) return;
    setDraggingKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragEnter(targetKey: string) {
    if (!draggingKey || draggingKey === targetKey || isPending) return;
    setItems((current) => reorderPhotos(current, draggingKey, targetKey));
  }

  function handleDragEnd() {
    const nextOrder = items.map(photoKey);
    const previousOrder = savedOrderRef.current;
    setDraggingKey(null);

    if (isPending || sameOrder(nextOrder, previousOrder)) return;

    startTransition(async () => {
      const result = await savePhotoOrderAction(
        items.map((item) => ({
          slug: item.gallerySlug,
          sourceFile: item.sourceFile ?? "",
        }))
      );

      setStatus(result.message);

      if (result.ok) {
        savedOrderRef.current = nextOrder;
        router.refresh();
        return;
      }

      setItems(images);
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">
            Homepage sequence
          </h2>
          <p className="mt-3 text-sm text-ink/60">
            Drag photos into a new order. Changes save automatically when you drop.
          </p>
        </div>
        <div className="text-sm text-ink/60">
          {isPending ? "Saving order..." : status ?? `${items.length} photos`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {items.map((image, index) => {
          const key = photoKey(image);
          const isDragging = draggingKey === key;

          return (
            <article
              key={key}
              draggable={!isPending}
              onDragStart={(event) => handleDragStart(key, event)}
              onDragEnter={() => handleDragEnter(key)}
              onDragOver={(event) => event.preventDefault()}
              onDragEnd={handleDragEnd}
              onDrop={(event) => event.preventDefault()}
              className={`group relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-paper-warm/40 transition ${
                isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
              } ${isPending ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
            >
              <div className="relative bg-paper-warm">
                <LocalPicture
                  image={image}
                  sizes="(min-width: 1280px) 28vw, (min-width: 640px) 50vw, 100vw"
                  className="w-full h-auto"
                />

                <div className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-[11px] uppercase tracking-widest text-ink">
                  #{index + 1}
                </div>

                {image.galleryTitle ? (
                  <div className="absolute left-3 bottom-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] uppercase tracking-widest text-paper">
                    {image.galleryTitle}
                  </div>
                ) : null}

                <form action={deletePhotoAction} className="absolute right-3 top-3">
                  <input type="hidden" name="slug" value={image.gallerySlug} />
                  <input
                    type="hidden"
                    name="sourceFile"
                    value={image.sourceFile ?? ""}
                  />
                  <button
                    type="submit"
                    aria-label={`Remove ${image.sourceFile ?? image.name}`}
                    draggable={false}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-xl leading-none text-ink hover:bg-red-600 hover:text-paper transition-colors"
                  >
                    ×
                  </button>
                </form>
              </div>

              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">{image.sourceFile ?? image.name}</p>
                    <p className="mt-2 truncate text-sm text-ink/70">
                      {image.alt || image.name}
                    </p>
                  </div>

                  <a
                    href={`/portfolio/${image.gallerySlug}`}
                    className="text-xs uppercase tracking-widest text-ink/60 hover:text-ink transition-colors"
                  >
                    View
                  </a>
                </div>

                <p className="text-[11px] uppercase tracking-widest text-ink/45">
                  Drag to reorder
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function reorderPhotos(items: AdminPhoto[], draggedKey: string, targetKey: string) {
  const fromIndex = items.findIndex((item) => photoKey(item) === draggedKey);
  const toIndex = items.findIndex((item) => photoKey(item) === targetKey);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [dragged] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, dragged);
  return next;
}

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function photoKey(image: AdminPhoto) {
  return `${image.gallerySlug}:${image.sourceFile ?? image.src}`;
}
