#!/usr/bin/env bash
# Optional VPS recovery: let nginx serve /_next/static from disk (bypasses Next).
# Run as root on the VPS after a successful build.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
DOMAIN="${DOMAIN:-sistersflowers.vn}"
CONF="/etc/nginx/sites-available/sisters-flowers"

cat > "$CONF" <<EOF
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
    try_files \$uri =404;
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

# If certbot already installed HTTPS, leave that server block alone — this script
# only refreshes the HTTP vhost template used at bootstrap. Prefer rebuilding
# Next (.next) first; use this when Next still 500s static after a clean build.

nginx -t
systemctl reload nginx
echo "nginx static alias ready for ${APP_DIR}/.next/static"
