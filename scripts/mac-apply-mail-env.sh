#!/usr/bin/env bash
# Apply maychuemail SMTP + EMAIL_ENABLED=true on the production VPS.
# Run from a machine that can SSH to the VPS (Mac). Cloud agents often cannot
# reach Superdata :22 (firewall).
#
#   bash scripts/mac-apply-mail-env.sh
#   bash scripts/mac-apply-mail-env.sh --test   # also send test emails
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
if [ -f "$ROOT/secrets/server.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/secrets/server.env"
  set +a
fi

VPS="${VPS:-${SSH_USER:-root}@${SSH_HOST:-45.117.171.54}}"
MAIL_ENV="${MAIL_ENV:-$ROOT/secrets/mail.env}"
APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
DO_TEST=0
for arg in "$@"; do
  case "$arg" in
    --test) DO_TEST=1 ;;
  esac
done

if [ ! -f "$MAIL_ENV" ]; then
  echo "Missing $MAIL_ENV"
  exit 1
fi

echo "== scp mail env -> $VPS =="
scp -o StrictHostKeyChecking=accept-new "$MAIL_ENV" "$VPS:/tmp/sf-mail.env"
scp -o StrictHostKeyChecking=accept-new "$ROOT/scripts/apply-mail-env.mjs" "$VPS:$APP_DIR/scripts/apply-mail-env.mjs"

echo "== upsert .env + restart =="
ssh -o StrictHostKeyChecking=accept-new "$VPS" bash -s -- "$APP_DIR" "$DO_TEST" <<'REMOTE'
set -euo pipefail
APP_DIR="$1"
DO_TEST="$2"
cd "$APP_DIR"
ENV_FILE="$APP_DIR/.env" MAIL_ENV_FILE=/tmp/sf-mail.env EMAIL_ENABLED=true \
  node scripts/apply-mail-env.mjs
rm -f /tmp/sf-mail.env
systemctl restart sisters-flowers
sleep 2
systemctl is-active sisters-flowers
if [ "$DO_TEST" = "1" ]; then
  echo "== send test emails =="
  node --env-file=.env --import tsx scripts/send-test-emails.mjs
fi
REMOTE

echo "DONE. Mail live on VPS (EMAIL_ENABLED=true)."
