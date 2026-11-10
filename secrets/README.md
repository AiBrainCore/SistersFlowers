# Secrets (do not commit real values)

Put private hosting / SSH / panel / database credentials only in files under this folder.
Everything here is gitignored except this README.

Never paste passwords into chat, pull requests, or committed files.

## Recommended local files (gitignored)

| File | Purpose |
| --- | --- |
| `secrets/server.env` | VPS / domain panel / deploy |
| `secrets/supabase.env` | Supabase URL, keys, DB password |
| `.env.local` (repo root) | Local Next.js overrides |

## Supabase

After creating the project in the dashboard:

1. Copy URL + publishable key + DB password into `secrets/supabase.env`
2. Optional: `npx supabase link --project-ref <ref>`
3. Do **not** switch production `DATABASE_URL` until an explicit Prisma → Postgres migration

App stays on SQLite (`file:./dev.db`) until that migration task.
