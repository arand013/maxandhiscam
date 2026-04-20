# Diego Ortega — Photography

A minimal, image-first photography portfolio. Next.js 15 (App Router) +
Tailwind. No CMS — photos live on disk and are converted to web-optimized
JPEGs by a local script.

## Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS, Cormorant Garamond (display) + Inter (sans)
- **Images:** `sharp` at build time (TIF/JPG/PNG → optimized JPEG) + `next/image`
  at runtime, with blur placeholders baked into the manifest
- **Content:** two JSON files — `content/site.json` (text) and
  `content/galleries.json` (auto-generated from `photos/`)

## Pages

| Route                     | What it shows                                |
| ------------------------- | -------------------------------------------- |
| `/`                       | Hero, featured galleries, short about blurb  |
| `/portfolio`              | Editorial grid of all visible galleries      |
| `/portfolio/[slug]`       | Gallery detail — masonry + fullscreen lightbox |
| `/contact`                | Form + email, location, and social links      |

## Run locally

### Prerequisites

- **Node.js 18.18+** (tested on Node 22/25). Check with `node -v`.
- **npm** 9+ (ships with Node).

### Quick start

```bash
npm install
npm run photos          # converts photos/** → public/photos/** + manifest
npm run dev             # → http://localhost:3000
```

That's it.

### Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start dev server on :3000 with HMR                  |
| `npm run build`     | Production build (typechecks + compiles)            |
| `npm run start`     | Serve the production build                          |
| `npm run photos`    | Convert photos + regenerate gallery manifest        |
| `npm run lint`      | Run Next.js ESLint                                  |

## Contact form email setup

The contact page now sends mail directly from the server. Configure one of:

- `SMTP_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

And set:

- `CONTACT_FROM_EMAIL` or `SMTP_FROM_EMAIL`
- `CONTACT_TO_EMAIL` if you want a destination different from `content/site.json`
- `CONTACT_EMAIL` also works as a legacy alias for the destination address

Example:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@example.com
SMTP_PASS=your-app-password
CONTACT_FROM_EMAIL=you@example.com
CONTACT_TO_EMAIL=maxandhiscam@gmail.com
```

If SMTP is not configured, the contact page falls back to a visible `mailto:`
link instead of showing a broken form.

## Admin setup

The `/admin` route requires:

- `ADMIN_PASSWORD`

Set it in `.env.local` for local development or in your host's environment
variable settings for production.

## Adding or updating photos

1. Drop image files into `photos/<gallery-slug>/`:

   ```
   photos/
     mexico/
       MEX0001.tif
       MEX0002.tif
       ...
     street-notes/
       IMG_0001.jpg
   ```

   Supported formats: `.tif`, `.tiff`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`.
   TIFs are automatically converted to browser-friendly JPEGs.

2. Run the pipeline:

   ```bash
   npm run photos
   ```

   This:
   - Resizes each image to a max long edge of 2400px at quality 85
   - Writes optimized JPEGs to `public/photos/<slug>/`
   - Generates a blur placeholder for each image
   - Regenerates `content/galleries.json` — the manifest the site reads
   - Skips images whose source mtime is older than the existing output (fast reruns)

3. Restart (or let HMR pick it up) and refresh.

### Optional per-gallery metadata

Drop a `meta.json` into any gallery folder to override defaults:

```json
{
  "title": "Mexico",
  "location": "Oaxaca, Mexico",
  "year": "2024",
  "description": "Two weeks following the light through Oaxaca's streets.",
  "order": 0,
  "visible": true,
  "cover": "MEX0003.tif",
  "images": {
    "MEX0001.tif": { "alt": "Woman at the market", "caption": "Tuesday morning." }
  }
}
```

All fields optional. Without `cover`, the first image becomes the cover.
Without `order`, galleries sort alphabetically. Setting `"visible": false`
hides a gallery without deleting it.

## Editing site text, email, and socials

Everything in the nav, footer, hero overlay, and contact page is driven by
`content/site.json`. Open it and edit:

```json
{
  "name": "Diego Ortega",
  "tagline": "Photographs of light, place, and the people passing through.",
  "instagramHandle": "@max.andhiscam",
  "instagramUrl": "https://instagram.com/max.andhiscam",
  "youtubeHandle": "@max.andhiscam",
  "youtubeUrl": "https://www.youtube.com/@max.andhiscam",
  "email": "maxandhiscam@gmail.com",
  "home": {
    "heroHeadline": "Diego Ortega",
    "heroSubhead": "Photographer",
    "aboutPreview": "...",
    "featured": ["mexico"]
  },
  "contact": {
    "headline": "Let's work together.",
    "body": "...",
    "location": "Boca Raton, FL",
    "availability": "Booking editorial + portrait through Q3."
  }
}
```

- `home.featured` is an array of gallery slugs — they're shown on the home
  page in that order.
- `home.heroImage` can be set to an image `src` (like
  `/photos/mexico/MEX05027.jpg`) to force a specific hero; otherwise the
  first gallery's cover is used.

## Deploy

Any Node host works — **Vercel** is easiest. This app is not a GitHub Pages
site because it uses server rendering, server actions, SMTP mail delivery, and
a writable `/admin` workflow.

1. Push to GitHub.
2. Import in Vercel.
3. Set `ADMIN_PASSWORD` and, if you want direct form delivery, the SMTP/contact
   env vars above.
4. Important: run `npm run photos` **before** pushing so `public/photos/` and
   `content/galleries.json` are committed — or add a `prebuild` script to
   run it during deploy if you'd rather keep raw sources in git.

## Project layout

```
app/
  (site)/              # public site — wraps children in Nav + Footer
    page.tsx           # home
    portfolio/
      page.tsx         # gallery index
      [slug]/page.tsx  # gallery detail + lightbox
    contact/page.tsx
    not-found.tsx
  layout.tsx           # html shell + fonts
components/
  Nav.tsx / Footer.tsx
  Lightbox.tsx         # fullscreen viewer (keyboard, swipe, prev/next)
  GalleryMasonry.tsx   # masonry grid on gallery detail
  GalleryIndex.tsx     # editorial grid on /portfolio
  LocalPicture.tsx     # thin wrapper over next/image
  SocialIcons.tsx      # IG / YouTube / email SVG icons
  ContactForm.tsx
  Reveal.tsx           # scroll-reveal observer
lib/content.ts         # reads site.json + galleries.json
content/
  site.json            # hand-edited text + socials
  galleries.json       # generated by `npm run photos`
photos/                # raw source photos, organized by gallery slug
  README.md
public/photos/         # optimized JPEGs (generated — safe to delete)
scripts/photos.ts      # TIF → JPEG + manifest generator
```
