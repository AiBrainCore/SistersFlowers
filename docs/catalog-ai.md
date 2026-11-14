# Catalog AI intelligence

Transforms placeholder bouquet names into bilingual, filterable, SEO-ready products using one vision pass per image.

## Already in place (do not rebuild)

- S / M / L / **Grand** size prices × city (admin + PDP + cart)
- VI/EN global language switcher
- City switcher (Da Lat / Da Nang)
- Occasion categories, search, accent/style filters
- Supabase Storage catalog images

## What this adds

| Piece | Role |
| --- | --- |
| `CatalogAttribute` | Flower / colour / style / arrangement taxonomy |
| `ProductAttribute` | Product ↔ attribute links (filters) |
| `ProductAnalysis` | Cached vision JSON + image hash |
| Product SEO fields | `seoTitle*`, `seoDescription*`, `imageAlt*` |
| `contentSource` / `contentLocked` | Manual edits win over AI |
| Enrichment job | Batch progress + rough cost |

## Commands

```bash
npx prisma migrate deploy
npm run catalog:seed-attributes

# Dry-run 3 products (needs OPENAI_API_KEY)
ENRICH_DRY_RUN=1 ENRICH_LIMIT=3 npm run catalog:enrich-ai

# Full catalog — write names/SEO only for Bouquet NNN placeholders
ENRICH_APPLY=1 npm run catalog:enrich-ai
```

Put the key in `secrets/openai.env` (see `secrets/openai.env.example`).

## Keyword research note

`src/lib/catalog-ai/keywords.ts` holds **market terminology** for Vietnamese florist SERPs (Da Nang / Da Lat). It is **not** Keyword Planner volume data. Do not claim “top searched” without verified metrics.

## Size variants

Keep existing **Grand** (not a separate XL product). Optional qualitative `sizeNote*` fields exist; never invent stem counts from photos.

## Publication policy

- Enrichment with `ENRICH_APPLY=0` stores analysis + attributes only (`aiStatus=ready`).
- `ENRICH_APPLY=1` updates copy for unlocked placeholders (`contentSource=ai`).
- Admin save always sets `contentSource=manual`.
- Locked products are never overwritten.
