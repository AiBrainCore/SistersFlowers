#!/usr/bin/env bash
# One-shot: pull latest, set deploy secret, enable cron auto-deploy, rebuild.
# Run on the VPS as root (VNC).
set -euo pipefail

APP_DIR=/var/www/sisters-flowers
SECRET="${1:-}"
if [ -z "$SECRET" ]; then
  echo "Usage: bash enable-autodeploy.sh <DEPLOY_SECRET>"
  exit 1
fi

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main
chmod +x scripts/deploy-production.sh scripts/enable-autodeploy.sh || true

if grep -q '^DEPLOY_SECRET=' .env 2>/dev/null; then
  sed -i "s/^DEPLOY_SECRET=.*/DEPLOY_SECRET=${SECRET}/" .env
else
  echo "DEPLOY_SECRET=${SECRET}" >> .env
fi

# Keep site URL correct
if grep -q '^NEXT_PUBLIC_SITE_URL=' .env; then
  sed -i 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL="https://sistersflowers.vn"|' .env
else
  echo 'NEXT_PUBLIC_SITE_URL="https://sistersflowers.vn"' >> .env
fi

# Cron every 3 minutes (no-op if already up to date)
cat > /etc/cron.d/sisters-flowers-deploy <<'EOF'
*/3 * * * * root /var/www/sisters-flowers/scripts/deploy-production.sh
EOF
chmod 644 /etc/cron.d/sisters-flowers-deploy

npm ci || npm install
npx prisma generate
NODE_OPTIONS='--max-old-space-size=2048' npm run build
systemctl restart sisters-flowers

echo
echo "AUTODEPLOY READY"
echo "- Cron pulls GitHub main every 3 minutes"
echo "- Webhook: POST https://sistersflowers.vn/api/deploy (Bearer DEPLOY_SECRET)"
echo "- Logs: /var/log/sisters-flowers-deploy.log"
