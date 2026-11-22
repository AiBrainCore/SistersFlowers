# Auth + transactional email (Sisters Flowers)

## What this adds

- Customer accounts: **email/password** + **Google** (Supabase Auth) + **Zalo** (custom OAuth PKCE)
- Guest checkout stays available (no forced login)
- Branded HTML emails with one SF layout (logo, citrus bar, cream card)
- Order emails: customer (VI/EN by `order.locale`) + studio inbox
- Mail provider: **P.A Vietnam / maychuemail** (Zoho retired)

## Mailboxes

Hosting panel (admin): `https://mail9234.maychuemail.com:1000/`  
Webmail: `https://mail9234.maychuemail.com/`

## Live mailboxes (launch)

| Address | Role |
| --- | --- |
| `info@sistersflowers.vn` | General + shared studio inbox |
| `orders@sistersflowers.vn` | Order confirmations / status |

`dalat@` / `danang@` can be added later. Until then both branches share `info@`; every studio alert subject includes `[Branch: Da Lat]` or `[Branch: Da Nang]` so staff do not mix cities.

Same SMTP password may be used for both mailboxes; store it only in `secrets/mail.env` and the VPS `.env` (never git).

## DNS (required for delivery)

At the domain DNS host for `sistersflowers.vn`, set (values from P.A Vietnam):

| Host | Type | Address | Priority |
| --- | --- | --- | --- |
| @ | MX | mail9234.maychuemail.com | 5 |
| @ | MX | mx9234.maychuemail.net | 10 |
| mail | CNAME | mail9234.maychuemail.com | |
| mx | CNAME | mx9234.maychuemail.net | |
| @ | TXT | `v=spf1 include:spf.maychuemail.com ~all` | |

Remove old Zoho MX / SPF records so they do not conflict.  
DKIM: ask P.A Vietnam technical team for the TXT record.

## SMTP (app + VPS)

Recommended encrypted SMTP:

- Host: `mail9234.maychuemail.com`
- Port: `465` SSL (or `587` STARTTLS with `SMTP_SECURE=false`)

Put values only in gitignored `secrets/mail.env` and production VPS `.env`:

```bash
EMAIL_ENABLED=false   # flip to true after a successful test send
SMTP_HOST=mail9234.maychuemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=…@sistersflowers.vn
SMTP_PASSWORD=…
MAIL_FROM=…@sistersflowers.vn
MAIL_FROM_INFO=…@sistersflowers.vn
MAIL_FROM_ORDERS=…@sistersflowers.vn
MAIL_STUDIO_INBOX=…@sistersflowers.vn
MAIL_PREVIEW_TO=felsendorff@gmail.com,butchi0603@gmail.com,dinhlamhung50@gmail.com
MAIL_PUBLIC_SITE_URL=https://sistersflowers.vn
```

Send samples:

```bash
node --env-file=secrets/mail.env --import tsx scripts/send-test-emails.mjs
```

HTML previews always land in `artifacts/email-previews/`.

## Mac / Outlook / phone (staff)

Use SSL settings from the provider card:

- IMAP: `mail9234.maychuemail.com` · 993 · SSL  
- SMTP: `mail9234.maychuemail.com` · 465 · SSL (or 587 STARTTLS)  
- Username = full email address  

Do not use unencrypted ports 110/143/25.

## Supabase Auth (Singapore SF-DB)

Project: `vztzjqodazcolxfcljsf` · region `ap-southeast-1`

### Customer email signup flow (branded)

1. App registers via **Auth admin `generateLink({ type: "signup" })`** — Supabase does **not** send its default confirm mail
2. App sends **Sisters Flowers** HTML verify mail (`info@…`, VI/EN by register locale) with a link to **`https://sistersflowers.vn/auth/confirm?token_hash=…`** (not `*.supabase.co/auth/v1/verify`)
3. `/auth/confirm` runs `verifyOtp({ token_hash, type: "signup" })`, then **welcome** mail once

Requires `SUPABASE_SERVICE_ROLE_KEY` on the VPS (same secret used for catalog uploads).

Purge a test account so they can re-register:

```bash
node --env-file=secrets/supabase-service.env --env-file=.env.local \
  scripts/purge-customer-auth.mjs someone@gmail.com
```

### Dashboard checklist

1. Authentication → Providers → enable **Email** (+ **Google** if used)
2. **URL configuration** (critical — wrong Site URL → confirm opens `localhost:3000`):
   - Site URL: `https://sistersflowers.vn`
   - Redirect URLs allowlist:
     - `https://sistersflowers.vn/auth/callback`
     - `https://sistersflowers.vn/auth/confirm`
     - `https://sistersflowers.vn/**`
     - `http://localhost:3000/auth/callback` (local only)
     - `http://localhost:3000/auth/confirm` (local only)
3. You do **not** need Supabase Auth SMTP for signup confirm anymore (app sends verify/welcome). Optional SMTP there only if you still use Supabase-built recovery templates.

App env (VPS + local) — deploy also runs `scripts/ensure-auth-env.mjs`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vztzjqodazcolxfcljsf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=sb_secret_…   # server only; never NEXT_PUBLIC_
CUSTOMER_SESSION_SECRET=long-random
NEXT_PUBLIC_SITE_URL=https://sistersflowers.vn
MAIL_PUBLIC_SITE_URL=https://sistersflowers.vn
```

Auth verify / OAuth redirects use `mailPublicSiteUrl()` (not `siteUrl()`), which **always** skips `localhost` / `127.0.0.1` and falls back to `https://sistersflowers.vn`. Deploy `ensure-auth-env.mjs` forces both site URL env vars to production and strips `ALLOW_LOCALHOST_SITE_URL`.

## Zalo login

Shop Bot is **not** Zalo OAuth — it only deep-links `?source=zalo`. Real login needs a Zalo app:

1. https://developers.zalo.me → create app → enable **Đăng nhập**
2. Callback URL: `https://sistersflowers.vn/auth/zalo/callback`
3. Env: `ZALO_APP_ID` / `ZALO_APP_SECRET`

Until set, the UI shows “Zalo soon” and email/Google still work.

## Email language rule

- One language per email (never VI+EN in the same message)
- Customer: `order.locale` or account `preferredLocale`
- Studio alerts: English
