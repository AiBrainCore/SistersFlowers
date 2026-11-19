# VPS mail env (P.A Vietnam)

Copy these keys into `/var/www/sisters-flowers/.env` on the production VPS (values from local `secrets/mail.env` — never commit passwords).

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

Then restart the app (systemd / `pm2` / deploy script).

Verify:

```bash
cd /var/www/sisters-flowers
node --env-file=.env --import tsx scripts/send-test-emails.mjs
```

Remove any leftover `smtp.zoho.com` / Zoho passwords from the same `.env`.
