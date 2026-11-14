# Catalog import (Supabase Storage)

## Goal

Replace mock shop products with real studio photos:

- Optimize each photo to **WebP + JPEG** (~100–200 KB)
- Upload to public Supabase Storage bucket `catalog`
- Create `Product` rows with `productType` + category
- Keep JPEG as `imageFallback` for clients that mishandle WebP

## Product types (Thu Tinh)

| slug | EN | VI |
| --- | --- | --- |
| `bouquet` | Bouquet | Bó hoa |
| `flower-basket` | Flower basket | Giỏ hoa |
| `stand-tray` | Stand / tray | Kệ, lẵng hoa |
| `stand-congrats` | Congratulatory stand | Kệ hoa chúc mừng |
| `stand-funeral` | Condolence stand | Kệ hoa viếng |

First import: **bouquet** only (Buckets folder).

## Prerequisites

1. Photos available to the agent VM at one of:
   - `/nexus/flowers/buckets` (if mounted)
   - `import/buckets/` in this repo (copy files here)
   - or `IMPORT_BUCKETS_DIR=/absolute/path`
2. `SUPABASE_SERVICE_ROLE_KEY` in `secrets/supabase-service.env` (gitignored)  
   Format:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. `DATABASE_URL` / `DIRECT_URL` already in `.env.local` or `secrets/supabase.env`
4. Storage bucket `catalog` is public (created once via migration/setup)

## Run

```bash
npm i   # ensures sharp
node scripts/import-buckets-catalog.mjs
```

Dry-run (encode only, no upload/DB):

```bash
IMPORT_DRY_RUN=1 IMPORT_LIMIT=3 node scripts/import-buckets-catalog.mjs
```

Optional:

```bash
IMPORT_DEFAULT_PRICE=750000
IMPORT_MAX_EDGE=1800
IMPORT_TARGET_BYTES=180000
IMPORT_LIMIT=50
```

## After import

- Legacy mock products with `/bouquets/...` images are **unpublished**
- Re-running is safe: matches on `sourceKey` (original filename) and upserts
- Admin can rename / set DN–DL prices later
- Landscape phone shots are rotated **90° CW** on import so flower heads point up

## Fix orientation on already-imported bouquets

```bash
node scripts/upright-bouquet-orient.mjs
```

Dry-run / limit:

```bash
ORIENT_DRY_RUN=1 ORIENT_LIMIT=5 node scripts/upright-bouquet-orient.mjs
```

Updates Storage `main.webp` / `main.jpg` in place and cache-busts `Product.image` URLs (`?v=upright1`).
