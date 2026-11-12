#!/usr/bin/env bash
# Sisters Flowers — first-time VPS bootstrap (run as root in VNC)
set -euo pipefail

DOMAIN="${DOMAIN:-sistersflowers.vn}"
APP_DIR="/var/www/sisters-flowers"
REPO="https://github.com/AiBrainCore/SistersFlowers.git"
BRANCH="main"
NODE_MAJOR=22

export DEBIAN_FRONTEND=noninteractive

echo "==> Packages"
apt-get update -y
apt-get install -y curl git ca-certificates nginx ufw build-essential python3

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v${NODE_MAJOR}"; then
  echo "==> Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

echo "==> Node $(node -v) / npm $(npm -v)"

echo "==> App directory"
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --branch "$BRANCH" --depth 1 "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Environment"
cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
NODE_ENV=production
PORT=3000
EOF

echo "==> Install + build (may take several minutes; needs ~2GB RAM)"
npm ci || npm install
npx prisma generate
# package.json build already runs migrate + seed + next build
NODE_OPTIONS='--max-old-space-size=2048' npm run build

echo "==> systemd service"
cat > /etc/systemd/system/sisters-flowers.service <<EOF
[Unit]
Description=Sisters Flowers Next.js
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/npm run start -- -p 3000 -H 127.0.0.1
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sisters-flowers
systemctl restart sisters-flowers

echo "==> nginx reverse proxy"
cat > /etc/nginx/sites-available/sisters-flowers <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN} www.${DOMAIN} 45.117.171.54;

  client_max_body_size 20m;

  location /_next/static/ {
    alias ${APP_DIR}/.next/static/;
    access_log off;
    expires 365d;
    add_header Cache-Control "public, immutable";
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF

ln -sfn /etc/nginx/sites-available/sisters-flowers /etc/nginx/sites-enabled/sisters-flowers
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "==> Firewall reminder"
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw status || true

echo "==> Status"
systemctl --no-pager --full status sisters-flowers | head -20
curl -sI -H "Host: ${DOMAIN}" http://127.0.0.1/ | head -10 || true

echo
echo "DONE. Next: point DNS A @ and www to 45.117.171.54, then install certbot for HTTPS."
echo "Test now: http://45.117.171.54/"
