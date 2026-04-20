# Diego Website Repo

This repository contains Diego Ortega's photography site in
[`diegos_website/`](./diegos_website).

## What is in this repo

- Next.js 15 App Router site
- Local photo pipeline using `sharp`
- Protected `/admin` workflow for uploads and ordering
- Server-backed contact form

## Important deployment note

This project can be stored on GitHub, but the current app should not be
deployed with GitHub Pages.

GitHub Pages is a static hosting service, while this app currently depends on
server-side features:

- cookies-based admin auth in
  [`diegos_website/lib/admin-auth.ts`](./diegos_website/lib/admin-auth.ts)
- server actions in
  [`diegos_website/app/admin/actions.ts`](./diegos_website/app/admin/actions.ts)
  and
  [`diegos_website/app/(site)/contact/actions.ts`](./diegos_website/app/%28site%29/contact/actions.ts)
- SMTP-backed contact delivery in
  [`diegos_website/lib/mailer.ts`](./diegos_website/lib/mailer.ts)
- runtime redirects in
  [`diegos_website/app/(site)/portfolio/page.tsx`](./diegos_website/app/%28site%29/portfolio/page.tsx)

For the current feature set, deploy on a Node-capable host such as Vercel.

## Local development

```bash
cd diegos_website
npm install
npm run photos
npm run dev
```

## More details

See [`diegos_website/README.md`](./diegos_website/README.md) for setup,
content editing, photo management, and deployment instructions.
