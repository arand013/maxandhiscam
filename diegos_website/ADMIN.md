# Admin guide — Diego

Everything you need to manage portfolio photos without touching the code.

The main workflow is now the protected `/admin` page:

1. Sign in at `/admin`
2. Upload photos into a gallery
3. Reorder or remove photos in the browser
4. Commit and push if you want those changes deployed elsewhere

---

## Before you start

### `/admin` needs `ADMIN_PASSWORD`

Set an environment variable before starting the site:

```bash
ADMIN_PASSWORD=choose-a-strong-password
```

For local development, put it in `.env.local`.

If the site is deployed on Vercel and you need to change the password later,
edit:

- Project Settings
- Environment Variables
- `ADMIN_PASSWORD`

Then start the site:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/admin
```

### Important note about hosting

This admin writes directly to the project files:

- `photos/<gallery>/`
- `photos/<gallery>/meta.json`
- `public/photos/<gallery>/`
- `content/galleries.json`

That means it works best on a local machine or any server with a writable
filesystem. If the site is deployed to a typical read-only/serverless host,
use `/admin` locally, then commit and push the generated changes.

---

## Fastest way to upload pictures

### Add photos to an existing gallery

1. Go to `/admin`
2. Sign in with the admin password
3. In **Gallery slug**, type the gallery name

Example:

```text
mexico
```

4. Select one or more image files
5. Click **Upload photos**

Supported formats:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.tif`
- `.tiff`
- `.heic`
- `.heif`

The site automatically:

- stores the original upload in `photos/<gallery>/`
- generates the web image in `public/photos/<gallery>/`
- updates `content/galleries.json`
- places new uploads at the end of the current homepage order

### Create a brand-new gallery

You do not need to create folders manually anymore.

1. Open `/admin`
2. In **Gallery slug**, type a new slug

Example:

```text
street-notes
```

3. Select the photos
4. Click **Upload photos**

That automatically creates the gallery folder and makes the gallery live.

Use lowercase letters and dashes in slugs.

Good:

```text
street-notes
oaxaca-portraits
summer-2025
```

Avoid:

```text
Street Notes
Mexico 2024
my/folder
```

---

## Reorder photos

The admin page shows the same portfolio sequence that appears on the homepage.

To change the order:

1. Open `/admin`
2. Find the photo card
3. Click **Move earlier** or **Move later**

That updates the saved order for the live portfolio.

You do not need to rename files anymore just to change order.

---

## Remove photos

1. Open `/admin`
2. Find the photo you want to remove
3. Click **Remove**

This deletes the source image from the gallery and removes it from the site.

---

## What happens after upload/remove/reorder

Every admin action updates the project files on disk. If you want the changes
to be published to GitHub / Vercel / another machine, commit and push them:

```bash
git add photos public/photos content/galleries.json
git commit -m "Update portfolio photos"
git push
```

If you are only working locally, the site updates immediately after the admin
action.

---

## Editing text, email, and social links

The `/admin` page currently manages photos only.

To edit site text and contact/social info, update:

```text
content/site.json
```

This file controls things like:

- site name
- tagline
- Instagram / YouTube links
- contact email
- contact page headline/body/location/availability

---

## If you prefer the terminal

The old file-based workflow still works.

You can still:

- drop files into `photos/<gallery>/`
- run `npm run photos`
- commit and push

But `/admin` is now the easiest path for normal photo uploads and ordering.

---

## Troubleshooting

| Problem | Likely fix |
| --- | --- |
| `/admin` keeps showing the login screen | Make sure `ADMIN_PASSWORD` is set and you entered the same value in the form |
| Upload button works but email/text edits are not in admin | That is expected — `/admin` only manages photos right now |
| New photos show locally but not on the deployed site | Commit and push `photos`, `public/photos`, and `content/galleries.json` |
| Uploads fail on production hosting | The host may not allow persistent file writes; use `/admin` locally and push changes |
| A gallery name looks wrong on the site | The gallery title defaults from the slug; customize it later in `photos/<gallery>/meta.json` if needed |
| The site does not start | Restart `npm run dev` and try again |

---

## Summary cheatsheet

```text
Upload photos   → /admin → enter gallery slug → choose files → Upload photos
New gallery     → /admin → new slug           → choose files → Upload photos
Reorder photos  → /admin → Move earlier / later
Delete photo    → /admin → Remove
Publish changes → git add photos public/photos content/galleries.json
                → git commit
                → git push
Edit site text  → content/site.json
```
