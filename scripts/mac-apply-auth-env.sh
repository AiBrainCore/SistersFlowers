#!/usr/bin/env bash
# Upsert Supabase service role + public site URL on the VPS, then force deploy.
# Cloud agents usually cannot reach Superdata :22 — run from Mac.
#
#   bash scripts/mac-apply-auth-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
if [ -f "$ROOT/secrets/server.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/secrets/server.env"
  set +a
fi
if [ -f "$ROOT/secrets/supabase-service.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/secrets/supabase-service.env"
  set +a
fi

VPS="${VPS:-${SSH_USER:-root}@${SSH_HOST:-45.117.171.54}}"
APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
AUTH_TMP="$(mktemp)"
trap 'rm -f "$AUTH_TMP"' EXIT

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}${SUPABASE_SECRET_KEY:-}" ]; then
  echo "Missing SUPABASE_SERVICE_ROLE_KEY in secrets/supabase-service.env"
  exit 1
fi

{
  echo "NEXT_PUBLIC_SITE_URL=https://sistersflowers.vn"
  echo "MAIL_PUBLIC_SITE_URL=https://sistersflowers.vn"
  if [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}${SUPABASE_URL:-}" ]; then
    echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-$SUPABASE_URL}"
  fi
  if [ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}${SUPABASE_PUBLISHABLE_KEY:-}" ]; then
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$SUPABASE_PUBLISHABLE_KEY}"
  fi
  if [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
  fi
  if [ -n "${SUPABASE_SECRET_KEY:-}" ]; then
    echo "SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY}"
  fi
} >"$AUTH_TMP"

SSH_BASE=(ssh -o StrictHostKeyChecking=accept-new)
SCP_BASE=(scp -o StrictHostKeyChecking=accept-new)
if [ -n "${SSHPASS:-${SSH_PASS:-}}" ]; then
  export SSHPASS="${SSHPASS:-$SSH_PASS}"
  SSH_BASE=(sshpass -e ssh -o StrictHostKeyChecking=accept-new)
  SCP_BASE=(sshpass -e scp -o StrictHostKeyChecking=accept-new)
fi

echo "== scp auth env -> $VPS =="
"${SCP_BASE[@]}" "$AUTH_TMP" "$VPS:/tmp/sf-auth.env"
"${SCP_BASE[@]}" "$ROOT/scripts/apply-auth-env.mjs" "$VPS:$APP_DIR/scripts/apply-auth-env.mjs"

echo "== upsert .env + force deploy =="
"${SSH_BASE[@]}" "$VPS" bash -s -- "$APP_DIR" <<'REMOTE'
set -euo pipefail
APP_DIR="$1"
cd "$APP_DIR"
ENV_FILE="$APP_DIR/.env" AUTH_ENV_FILE=/tmp/sf-auth.env node scripts/apply-auth-env.mjs
rm -f /tmp/sf-auth.env
# Pull latest main + rebuild so NEXT_PUBLIC_* and auth code are live
git fetch origin main
git reset --hard origin/main
FORCE_DEPLOY=1 bash scripts/deploy-production.sh force
systemctl is-active sisters-flowers
# Confirm without printing secrets
node -e '
const fs=require("fs");
const t=fs.readFileSync(".env","utf8");
const has=/^SUPABASE_SERVICE_ROLE_KEY=.+/m.test(t)||/^SUPABASE_SECRET_KEY=.+/m.test(t);
const site=(t.match(/^NEXT_PUBLIC_SITE_URL=(.*)$/m)||[])[1]||"";
console.log("check: service_role="+has+" site="+site.replace(/["']/g,""));
'
REMOTE

echo "DONE. Auth env on VPS + deploy finished."
