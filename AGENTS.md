<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Local development

SQLite is the database. From the repository root:

1. `cp .env.example .env` when `.env` is missing. The example values are local placeholders.
2. `npx prisma migrate deploy`
3. `npx prisma db seed` (safe to repeat; products are inserted only when the table is empty)
4. `npm run dev` — open http://localhost:3000 (it redirects to `/en`). Next.js serves client dev resources for the `localhost` host; the numeric loopback address leaves add-to-cart and other client actions unhydrated.

`npm test` covers the shop bot. `npm run build` applies migrations, seeds, and builds the app. `npx tsc --noEmit` needs the types Next.js writes during `next dev` or `next build`. `npm run lint` currently reports existing React hook findings in the hero, reveal, and cart code.
