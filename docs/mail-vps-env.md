# VPS mail env (P.A Vietnam)

## One-shot from Mac (recommended)

Cloud agents often cannot reach Superdata SSH (`:22` firewall). From a Mac that already SSHs to the VPS:

```bash
cd /path/to/SistersFlowers
bash scripts/mac-apply-mail-env.sh --test
```

That copies `secrets/mail.env`, upserts `/var/www/sisters-flowers/.env` with `EMAIL_ENABLED=true`, strips leftover Zoho host lines, restarts `sisters-flowers`, and sends test emails.

## Manual keys

Copy these into `/var/www/sisters-flowers/.env` (values from local `secrets/mail.env` — never commit passwords):

```bash
EMAIL_ENABLED=true
SMTP_HOST=mail9234.maychuemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@sistersflowers.vn
# Quote if password contains $ or ! :
SMTP_PASSWORD='…same as panel…'
SMTP_PASS='…same as panel…'
MAIL_FROM=info@sistersflowers.vn
MAIL_FROM_INFO=info@sistersflowers.vn
MAIL_FROM_NAME=Sisters Flowers
MAIL_REPLY_TO=info@sistersflowers.vn
MAIL_STUDIO_INBOX=info@sistersflowers.vn
MAIL_FROM_ORDERS=orders@sistersflowers.vn
SMTP_USER_ORDERS=orders@sistersflowers.vn
SMTP_PASSWORD_ORDERS='…same as panel…'
SMTP_PASS_ORDERS='…same as panel…'
MAIL_PUBLIC_SITE_URL=https://sistersflowers.vn
MAIL_PREVIEW_TO=felsendorff@gmail.com,butchi0603@gmail.com,dinhlamhung50@gmail.com
```

Or on the VPS after uploading `secrets/mail.env`:

```bash
ENV_FILE=/var/www/sisters-flowers/.env \
MAIL_ENV_FILE=/tmp/sf-mail.env \
EMAIL_ENABLED=true \
node /var/www/sisters-flowers/scripts/apply-mail-env.mjs
systemctl restart sisters-flowers
```

Verify:

```bash
cd /var/www/sisters-flowers
node --env-file=.env --import tsx scripts/send-test-emails.mjs
```

Remove any leftover `smtp.zoho.com` / Zoho passwords from the same `.env` (the apply script strips Zoho host lines automatically).
