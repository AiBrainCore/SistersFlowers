# Auth + transactional email (Sisters Flowers)

## What this adds

- Customer accounts: **email/password** + **Google** (Supabase Auth) + **Zalo** (custom OAuth PKCE)
- Branded HTML emails with one SF layout (logo, citrus bar, cream card)
- Order emails: customer (VI/EN by `order.locale`) + studio (`orders@`)
- Mailbox target (start simple): **one** address `info@sistersflowers.vn` for From + studio inbox  
  (`orders@` is optional later; app falls back to `info@`)

## Mailboxes (must buy email hosting — not on the VPS panel)

Superdata / CloudPanel manage the **website VPS only**. They do **not** create `@sistersflowers.vn` inboxes.

Domain DNS currently has **no MX**. Until email hosting + MX exist, SMTP cannot send as `@sistersflowers.vn`.

1. Order email at P.A Vietnam ([Email Server](https://www.pavietnam.vn/vn/email-server/)) or Zoho / Hostinger
2. Create **`info@sistersflowers.vn`** (one mailbox is enough)
3. Add MX + SPF + DKIM as the provider shows
4. Put SMTP into VPS `.env` and `secrets/mail.env`:

```bash
SMTP_HOST=smtp.zoho.com   # or P.A Vietnam SMTP host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@sistersflowers.vn
SMTP_PASS=***
MAIL_FROM_INFO=info@sistersflowers.vn
MAIL_STUDIO_INBOX=info@sistersflowers.vn
MAIL_PREVIEW_TO=felsendorff@gmail.com,butchi0603@gmail.com
```

Send samples:

```bash
node --env-file=secrets/mail.env --env-file=.env.local scripts/send-test-emails.mjs
```

HTML previews always land in `artifacts/email-previews/`.

## Supabase Auth

In Supabase dashboard (`nxuoqbgxylqhviipqqdt`):

1. Authentication → Providers → enable **Email** (confirm email ON)
2. Enable **Google** → paste Google Cloud OAuth client ID/secret
3. Redirect URLs allowlist:
   - `https://sistersflowers.vn/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Optional: Authentication → SMTP → use the same SMTP so verify emails come from `info@`

App env (VPS + local):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nxuoqbgxylqhviipqqdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
CUSTOMER_SESSION_SECRET=long-random   # Zalo session cookie
```

## Zalo login

Shop Bot is **not** Zalo OAuth — it only deep-links `?source=zalo`. Real login needs a Zalo app:

1. https://developers.zalo.me → create app → enable **Đăng nhập**
2. Callback URL: `https://sistersflowers.vn/auth/zalo/callback`
3. Env:

```bash
ZALO_APP_ID=…
ZALO_APP_SECRET=…
```

Until set, the UI shows “Zalo soon” and email/Google still work.

## Email language rule

- One language per email (never VI+EN in the same message)
- Customer: `order.locale` or account `preferredLocale`
- Studio alerts: English
