"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { SocialIcons } from "./SocialIcons";

const LINKS = [
  { href: "/", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
];

export function Nav({ site }: { site: SiteContent }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const title = site.navTitle || site.name || "MAX AND HIS CAM";
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/portfolio")
      : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-paper/90 backdrop-blur-md border-b border-ink/5"
          : "bg-paper/60 backdrop-blur"
      }`}
    >
      <div className="wrap flex items-center justify-between h-16 md:h-20 gap-6">
        <Link
          href="/"
          className="font-display text-xl md:text-2xl tracking-tight hover:opacity-70 transition-opacity"
        >
          {title}
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-10">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[13px] uppercase tracking-widest transition-opacity ${
                  isActive(l.href) ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <SocialIcons site={site} size="sm" includeEmail={false} />
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden w-10 h-10 flex items-center justify-center -mr-2"
        >
          <span className="relative block w-6 h-[10px]">
            <span
              className={`absolute left-0 right-0 top-0 h-px bg-ink transition-transform duration-300 ${
                open ? "translate-y-[5px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 right-0 bottom-0 h-px bg-ink transition-transform duration-300 ${
                open ? "-translate-y-[5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-out-quart ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="wrap pb-10 pt-2 flex flex-col gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-display text-3xl tracking-tight"
            >
              {l.label}
            </Link>
          ))}

          <div className="pt-2">
            <SocialIcons site={site} labeled includeEmail={false} />
          </div>
        </nav>
      </div>
    </header>
  );
}
