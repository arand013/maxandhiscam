import Link from "next/link";
import type { SiteContent } from "@/lib/content";
import { SocialIcons } from "./SocialIcons";

export function Footer({ site }: { site: SiteContent }) {
  const year = new Date().getFullYear();
  const name = site.name ?? "Diego Ortega";

  return (
    <footer className="mt-32 border-t border-ink/10 bg-paper-warm/40">
      <div className="wrap py-16 grid gap-10 md:grid-cols-3 md:items-end">
        <div>
          <p className="font-display text-3xl md:text-4xl leading-none">
            {name}
          </p>
          {site.tagline ? (
            <p className="mt-3 text-sm text-stone-subtle max-w-xs">
              {site.tagline}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 md:justify-center">
          <Link href="/" className="text-sm hover:opacity-60">
            Portfolio
          </Link>
          <Link href="/contact" className="text-sm hover:opacity-60">
            Contact
          </Link>
        </div>

        <div className="md:flex md:justify-end">
          <SocialIcons site={site} />
        </div>
      </div>

      <div className="wrap pb-10 flex flex-col md:flex-row gap-3 md:justify-between text-[11px] uppercase tracking-widest text-stone-subtle">
        <span>© {year} {name}. All rights reserved.</span>
        <span>{site.footerNote ?? "Photographs by Diego."}</span>
      </div>
    </footer>
  );
}
