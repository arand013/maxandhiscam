# Photos source folder

Drop photographs here in a subfolder named for the gallery. File formats
supported: **.tif / .tiff / .jpg / .jpeg / .png / .webp / .heic**.

```
photos/
  mexico/                 ← gallery slug (URL will be /portfolio/mexico)
    MEX0001.tif
    MEX0002.tif
    ...
    meta.json             ← optional: title, location, year, description
  street-notes/
    IMG_0001.jpg
    ...
```

After adding or changing files here, run:

```bash
npm run photos
```

That converts everything to web-ready JPEGs in `public/photos/<slug>/` and
regenerates `content/galleries.json` (the manifest the site reads).

## Optional `meta.json`

Drop a `meta.json` in any gallery folder to override defaults:

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

Fields are all optional. Without `cover`, the first image becomes the cover.
Without `order`, galleries sort alphabetically by slug. Without `visible`,
they're shown.
