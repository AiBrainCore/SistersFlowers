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

In Supabase dashboard:

1. Authentication → Providers → enable **Email**
2. Enable **Google** → paste Google Cloud OAuth client ID/secret
3. URL configuration / Redirect URLs allowlist:
   - `https://sistersflowers.vn/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Optional: Authentication → SMTP → same maychuemail SMTP so verify emails come from Sisters

App env (VPS + local) — deploy also runs `scripts/ensure-auth-env.mjs`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vztzjqodazcolxfcljsf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
CUSTOMER_SESSION_SECRET=long-random
NEXT_PUBLIC_SITE_URL=https://sistersflowers.vn
```

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
