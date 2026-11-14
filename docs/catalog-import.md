# Catalog import (Supabase Storage)

## Goal

Replace mock shop products with real studio photos:

- Optimize each photo to **WebP + JPEG** (~100–200 KB)
- Upload to public Supabase Storage bucket `catalog`
- Create `Product` rows with `productType` + category + default S/M/L prices
- Keep JPEG as `imageFallback` for clients that mishandle WebP

## Product types (Thu Tinh)

| slug | EN | VI | Local folder |
| --- | --- | --- | --- |
| `bouquet` | Bouquet | Bó hoa | `import/buckets` |
| `flower-basket` | Flower basket | Giỏ hoa | `import/basket` |
| `stand-tray` | Stand / tray | Kệ, lẵng hoa | `import/stand-tray` |
| `stand-congrats` | Congratulatory stand | Kệ hoa chúc mừng | `import/stand for congrats` |
| `stand-funeral` | Condolence stand | Kệ hoa viếng | `import/stand-funeral` |

## Prerequisites

1. Photos on the machine that runs the script (Cloud Agent cannot see your Mac/`/nexus`):
   - `import/<folder>/` in this repo, or
   - `IMPORT_SOURCE_DIR=/absolute/path`
2. `SUPABASE_SERVICE_ROLE_KEY` in `secrets/supabase-service.env` (gitignored)
3. `DATABASE_URL` / `DIRECT_URL` + Supabase URL in `.env.local` or `secrets/supabase.env`
4. Storage bucket `catalog` is public

## Run (on your Mac, in SistersFlowers)

```bash
cd /Users/Work/SistersFlowers   # your clone path
git pull origin main
npm i

# 1) Flower baskets
npm run catalog:import-basket
# or explicit path:
# IMPORT_SOURCE_DIR="/Users/Work/SistersFlowers/import/basket" npm run catalog:import-basket

# 2) Congratulatory stands
npm run catalog:import-stand-congrats
# IMPORT_SOURCE_DIR="/Users/Work/SistersFlowers/import/stand for congrats" npm run catalog:import-stand-congrats
```

Dry-run:

```bash
IMPORT_DRY_RUN=1 IMPORT_LIMIT=3 npm run catalog:import-basket
```

Bouquets (legacy):

```bash
IMPORT_SOURCE_DIR=/path/to/buckets npm run catalog:import-buckets
```

## After import — AI names / SEO / attributes

```bash
npm run catalog:seed-attributes
ENRICH_APPLY=1 ENRICH_PRODUCT_TYPE=flower-basket npm run catalog:enrich-ai
ENRICH_APPLY=1 ENRICH_PRODUCT_TYPE=stand-congrats npm run catalog:enrich-ai
```

## Notes

- Re-running is safe: matches on `sourceKey` (`{type}:{filename}`) and upserts
- Default ladder: S 450k / M 600k / L 850k (override with `IMPORT_PRICE_SM` etc.)
- Landscape upright rotation is **on for bouquets only** (stands/baskets keep orientation unless `IMPORT_UPRIGHT_LANDSCAPE=1`)
