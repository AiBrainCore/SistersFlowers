# Sisters Flowers → Supabase Postgres

## What moved
Prisma models (Product, Category, Order, City, Branch, Delivery*, Addon, Inquiry, …)
now target **PostgreSQL** on Supabase project `nxuoqbgxylqhviipqqdt` (ap-south-1).

Photos stay on disk / `public/bouquets` (not in the database).

## Local secrets (gitignored)
- `secrets/supabase.env` — full connection strings + password
- `.env` / `.env.local` — `DATABASE_URL` + `DIRECT_URL`

## Commands already done
```bash
npx prisma migrate deploy          # created tables
node scripts/migrate-sqlite-to-supabase.mjs   # copied SQLite rows
```

## VPS production cutover (manual)
On the server (`/var/www/sisters-flowers` or your deploy path), set in the service env
(not in git):

```bash
DATABASE_URL="postgresql://postgres.nxuoqbgxylqhviipqqdt:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.nxuoqbgxylqhviipqqdt:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

Then restart:

```bash
sudo systemctl restart sisters-flowers
# or your deploy script
```

After cutover, confirm shop loads and admin can list products.

## Re-copy data from a SQLite backup
```bash
set -a; source secrets/supabase.env; set +a
node scripts/migrate-sqlite-to-supabase.mjs
```

## Rollback
Point `DATABASE_URL` back to `file:./prisma/dev.db` and switch
`prisma/schema.prisma` provider to `sqlite` only if you must — prefer fixing
Postgres instead. SQLite migrations are archived under
`prisma/migrations_sqlite_archive/`.
