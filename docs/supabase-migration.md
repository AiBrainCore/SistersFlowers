# Sisters Flowers → Supabase Postgres

## What moved
Prisma models (Product, Category, Order, City, Branch, Delivery*, Addon, Inquiry, …)
now target **PostgreSQL** on Supabase project `vztzjqodazcolxfcljsf` (**Singapore / ap-southeast-1**).

Photos stay on disk / `public/bouquets` (not in the database).

### Region note
Earlier cutover used Mumbai (`nxuoqbgxylqhviipqqdt` / `ap-south-1`). That was too far for Vietnam latency.
Active target is Singapore. After production points at Singapore, delete/pause the Mumbai project so you are not billed twice.

## Local secrets (gitignored)
- `secrets/supabase.env` — full connection strings + password
- `.env` / `.env.local` — `DATABASE_URL` + `DIRECT_URL`

## Commands already done
```bash
npx prisma migrate deploy          # created tables on Singapore
node scripts/migrate-pg-to-pg.mjs  # copied rows Mumbai → Singapore
```

## VPS production cutover (manual)
On the server (`/var/www/sisters-flowers` or your deploy path), set in the service env
(not in git):

```bash
DATABASE_URL="postgresql://postgres.vztzjqodazcolxfcljsf:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.vztzjqodazcolxfcljsf:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

Also set (optional public client):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://vztzjqodazcolxfcljsf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_…"
```

Then restart:

```bash
sudo systemctl restart sisters-flowers
# or your deploy script
```

After cutover, confirm shop loads and admin can list products.

## Re-copy data from Mumbai (if needed)
```bash
set -a; source secrets/supabase.env; set +a
node scripts/migrate-pg-to-pg.mjs
```

## Re-copy data from a SQLite backup
```bash
set -a; source secrets/supabase.env; set +a
node scripts/migrate-sqlite-to-supabase.mjs
```

## Rollback
Point `DATABASE_URL` back to the previous pooler host only if Singapore is broken.
Prefer fixing Postgres instead. SQLite migrations are archived under
`prisma/migrations_sqlite_archive/`.
