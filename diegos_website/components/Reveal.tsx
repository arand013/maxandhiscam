"use client";

import { useEffect } from "react";

/**
 * Global IntersectionObserver that adds `.is-visible` to any element with the
 * `reveal` class when it enters the viewport. Keeps pages declarative.
 */
export function Reveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return null;
}
