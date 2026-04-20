import type { SiteContent } from "@/lib/content";

type Props = {
  site: SiteContent;
  size?: "sm" | "md";
  labeled?: boolean;
  includeEmail?: boolean;
};

/**
 * Renders Instagram, YouTube, and email links as monochrome SVG icons.
 * Icons inherit currentColor so they pick up the surrounding text color.
 */
export function SocialIcons({
  site,
  size = "md",
  labeled = false,
  includeEmail = true,
}: Props) {
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const iconBtn =
    "inline-flex items-center gap-2 hover:opacity-60 transition-opacity";

  return (
    <ul className="flex flex-wrap items-center gap-5">
      {site.instagramUrl ? (
        <li>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Instagram ${site.instagramHandle ?? ""}`.trim()}
            className={iconBtn}
          >
            <InstagramIcon className={dim} />
            {labeled ? (
              <span className="text-sm">
                {site.instagramHandle ?? "Instagram"}
              </span>
            ) : null}
          </a>
        </li>
      ) : null}

      {site.youtubeUrl ? (
        <li>
          <a
            href={site.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`YouTube ${site.youtubeHandle ?? ""}`.trim()}
            className={iconBtn}
          >
            <YouTubeIcon className={dim} />
            {labeled ? (
              <span className="text-sm">
                {site.youtubeHandle ?? "YouTube"}
              </span>
            ) : null}
          </a>
        </li>
      ) : null}

      {includeEmail && site.email ? (
        <li>
          <a
            href={`mailto:${site.email}`}
            aria-label={`Email ${site.email}`}
            className={iconBtn}
          >
            <MailIcon className={dim} />
            {labeled ? <span className="text-sm">{site.email}</span> : null}
          </a>
        </li>
      ) : null}
    </ul>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
      <path d="M10.5 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 7 8.5-7" />
    </svg>
  );
}
