# Diego Ortega — Photography

A minimal, image-first photography portfolio. Next.js 15 (App Router) +
Tailwind. Local photos can still be generated from disk, and Vercel deployments
can use Vercel Blob for durable runtime uploads from `/admin`.

## Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS, Cormorant Garamond (display) + Inter (sans)
- **Images:** `sharp` at build time (TIF/JPG/PNG → optimized JPEG) + `next/image`
  at runtime, with blur placeholders baked into the manifest
- **Content:** two JSON files — `content/site.json` (text) and
  `content/galleries.json` (auto-generated from `photos/`)
- **Production uploads:** optional Vercel Blob manifest for durable `/admin`
  uploads, deletions, and ordering on Vercel

## Pages

| Route                     | What it shows                                |
| ------------------------- | -------------------------------------------- |
| `/`                       | Hero, featured galleries, short about blurb  |
| `/portfolio`              | Editorial grid of all visible galleries      |
| `/portfolio/[slug]`       | Gallery detail — masonry + fullscreen lightbox |
| `/contact`                | Full contact form UI, location, and socials   |

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

If SMTP is not configured, the contact page keeps the same visible form UI and
opens a prefilled `mailto:` draft instead of showing a broken submit flow.

## Admin setup

The `/admin` route requires:

- `ADMIN_PASSWORD`

Set it in `.env.local` for local development or in your host's environment
variable settings for production.

If you deploy on Vercel, edit it in:

- Project Settings
- Environment Variables
- `ADMIN_PASSWORD`

For durable uploads, deletions, and reordering on Vercel, also connect a public
Vercel Blob store so `BLOB_READ_WRITE_TOKEN` is available. When that token
exists, `/admin` writes to Blob instead of the ephemeral filesystem.

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

### Production uploads on Vercel

If the Vercel project has `BLOB_READ_WRITE_TOKEN`, the deployed `/admin` route
uses Vercel Blob instead of writing to the server filesystem. That makes these
operations durable in production:

- upload new photos
- delete photos
- reorder photos across galleries

Bundled images committed in `public/photos/` still work normally. New runtime
uploads are stored in Blob and are mixed into the same gallery manifest.

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

### GitHub

GitHub is the right place to store the code and collaborate, but **GitHub Pages
is not a compatible production host for the current app**.

Why:

- GitHub Pages is a static hosting service.
- This app uses server-side features that require a Node runtime:
  - cookies-based admin auth in `lib/admin-auth.ts`
  - server actions in `app/admin/actions.ts` and `app/(site)/contact/actions.ts`
  - SMTP mail delivery in `lib/mailer.ts`
  - a writable `/admin` workflow that uses Vercel Blob in production
  - runtime redirects in `app/(site)/portfolio/page.tsx`

Next.js static export also does not support important features this app relies
on, including cookies, redirects, server actions, and the default image
optimization pipeline.

### Recommended production host

Any Node host works. **Vercel** is the easiest path for the current feature set.

1. Push to GitHub.
2. Import the repository into Vercel.
3. Set `ADMIN_PASSWORD`.
4. Connect a public Vercel Blob store so `BLOB_READ_WRITE_TOKEN` is added.
5. If you want direct contact form delivery, set the SMTP/contact env vars
   listed above.
6. Run `npm run photos` before pushing so `public/photos/` and
   `content/galleries.json` are committed.

Current production alias:

- `https://maxandhiscam.vercel.app`

### If you must use GitHub Pages

You would need to convert the site to a static export build and give up or
replace the current server-driven features. In practice that means removing or
reworking:

- `/admin`
- direct SMTP sending from `/contact`
- cookies-based auth
- runtime redirects and other request-dependent behavior

At that point the public portfolio pages could be deployed to Pages, but the
current full app cannot.

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
lib/blob-gallery-store.ts
                       # optional Vercel Blob manifest + file storage helpers
content/
  site.json            # hand-edited text + socials
  galleries.json       # generated by `npm run photos`
photos/                # raw source photos, organized by gallery slug
  README.md
public/photos/         # optimized JPEGs (generated — safe to delete)
scripts/photos.ts      # TIF → JPEG + manifest generator
```
