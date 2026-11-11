# Secrets (do not commit real values)

Put private hosting / SSH / panel / database credentials only in files under this folder.
Everything here is gitignored except this README.

Never paste passwords into chat, pull requests, or committed files.

## Recommended local files (gitignored)

| File | Purpose |
| --- | --- |
| `secrets/server.env` | VPS / domain panel / deploy |
| `secrets/supabase.env` | Supabase URL, keys, DB password |
| `secrets/mail.env` | Zoho SMTP: `info@` + `orders@` passwords (never commit). Quote values with spaces (e.g. `MAIL_FROM_NAME`). |
| `.env.local` (repo root) | Local Next.js overrides |

## Supabase

1. Keep URL + publishable key + DB password in `secrets/supabase.env`
2. Local app/Prisma use `.env` / `.env.local` with `DATABASE_URL` + `DIRECT_URL`
3. Production VPS must set the same two vars in the systemd/service env (never git)

See `docs/supabase-migration.md` for cutover steps.
