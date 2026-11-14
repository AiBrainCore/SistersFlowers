# Journal V3 — rich editor + 5 articles

## What’s new
- TipTap editor in admin (bold/italic, H2/H3, lists, links, **inline images**, undo/redo)
- **Cover image** — replace / remove in admin (uploads to Supabase `catalog/journal/…`)
- **+ Image** in the body toolbar inserts additional photos inside the article
- **Insert internal link** picker → real routes (`/shop`, `/custom`, `/delivery`, occasion filters)
- SEO title/description + cover alt EN/VI
- Body stored as sanitized HTML; public pages render HTML + BlogPosting JSON-LD
- Revision snapshots on save (last 20)
- Five published bilingual posts with weekly dates ending 14 Nov 2026

## Images
- Cover + inline uploads need `SUPABASE_SERVICE_ROLE_KEY` (VPS `.env` or `secrets/supabase-service.env`)
- Fallback: `public/journal/uploads/` if Storage is unavailable (dev only — prefer Supabase on production)

## Seed / re-seed
```bash
npx prisma migrate deploy
npm run journal:seed-v3
```

Sources: `scripts/data/journal-v3/`

## Internal links used
| Token | Resolved |
| --- | --- |
| catalog / occasions | `/{locale}/shop` |
| custom | `/{locale}/custom` |
| delivery (editor picker) | `/{locale}/delivery` |
