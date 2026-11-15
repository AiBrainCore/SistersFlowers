#!/usr/bin/env bash
# VPS recovery: serve /_next/static from disk for HTTP + HTTPS nginx vhosts.
# Bypasses Next when Node returns 500 for CSS/JS after a bad build.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
DOMAIN="${DOMAIN:-sistersflowers.vn}"
STATIC_BLOCK=$(cat <<EOF
  location /_next/static/ {
    alias ${APP_DIR}/.next/static/;
    access_log off;
    expires 365d;
    add_header Cache-Control "public, immutable";
    try_files \$uri =404;
  }
EOF
)

patched=0
for CONF in \
  /etc/nginx/sites-available/sisters-flowers \
  /etc/nginx/sites-enabled/sisters-flowers \
  /etc/nginx/sites-available/default \
  /etc/nginx/conf.d/*.conf
do
  [ -f "$CONF" ] || continue
  if ! grep -q "server_name .*${DOMAIN}\|server_name .*45\.117\.171\.54" "$CONF" 2>/dev/null; then
    # Still patch known sisters-flowers site file even if server_name form differs
    case "$CONF" in
      *sisters-flowers*) ;;
      *) continue ;;
    esac
  fi

  if grep -q "location /_next/static/" "$CONF"; then
    echo "already has /_next/static/ in $CONF"
  else
    # Insert static location before the first "location /" proxy block
    python3 - "$CONF" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
block = """
  location /_next/static/ {
    alias /var/www/sisters-flowers/.next/static/;
    access_log off;
    expires 365d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }
"""
if "location /_next/static/" in text:
    print("skip", path)
    raise SystemExit(0)
needle = "location / {"
if needle not in text:
    print("no location / in", path)
    raise SystemExit(0)
text = text.replace(needle, block + "\n" + needle, 1)
path.write_text(text)
print("patched", path)
PY
    patched=1
  fi
done

# Also scan certbot-managed files under sites-enabled
if [ -d /etc/nginx/sites-enabled ]; then
  for CONF in /etc/nginx/sites-enabled/*; do
    [ -f "$CONF" ] || continue
    if grep -q "sistersflowers\|45.117.171.54" "$CONF" 2>/dev/null \
      && ! grep -q "location /_next/static/" "$CONF"; then
      python3 - "$CONF" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
block = """
  location /_next/static/ {
    alias /var/www/sisters-flowers/.next/static/;
    access_log off;
    expires 365d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }
"""
needle = "location / {"
if "location /_next/static/" in text or needle not in text:
    raise SystemExit(0)
path.write_text(text.replace(needle, block + "\n" + needle, 1))
print("patched", path)
PY
      patched=1
    fi
  done
fi

nginx -t
systemctl reload nginx
echo "nginx static alias reload done (patched=${patched})"
