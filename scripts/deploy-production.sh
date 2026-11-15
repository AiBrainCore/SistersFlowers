#!/usr/bin/env bash
# Production deploy on Superdata VPS — pull main, build, restart.
# Usage:
#   bash scripts/deploy-production.sh           # rebuild only when git moved
#   bash scripts/deploy-production.sh force     # always rebuild (webhook / recovery)
#   FORCE_DEPLOY=1 bash scripts/deploy-production.sh
#
# Atomic build: never delete the live .next until the new build is ready.
# Stale locks (>25m) are cleared so a hung npm build cannot brick forever.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/sisters-flowers-deploy.lock}"
LOCK_PID_FILE="${LOCK_PID_FILE:-/tmp/sisters-flowers-deploy.pid}"
LOG_FILE="${LOG_FILE:-/var/log/sisters-flowers-deploy.log}"
STALE_LOCK_MINUTES="${STALE_LOCK_MINUTES:-25}"
MODE="${1:-auto}"
if [ "${FORCE_DEPLOY:-0}" = "1" ]; then
  MODE="force"
fi

clear_stale_lock() {
  if [ ! -f "$LOCK_FILE" ]; then
    return 0
  fi
  # Busybox/GNU find: delete lock if older than N minutes
  find "$LOCK_FILE" -mmin "+${STALE_LOCK_MINUTES}" -print -delete 2>/dev/null | while read -r _; do
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) cleared stale deploy lock (>${STALE_LOCK_MINUTES}m)" | tee -a "$LOG_FILE"
  done
  if [ -f "$LOCK_PID_FILE" ]; then
    old_pid="$(cat "$LOCK_PID_FILE" 2>/dev/null || true)"
    if [ -n "${old_pid:-}" ] && ! kill -0 "$old_pid" 2>/dev/null; then
      rm -f "$LOCK_FILE" "$LOCK_PID_FILE"
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) cleared deploy lock (pid $old_pid dead)" | tee -a "$LOG_FILE"
    fi
  fi
}

clear_stale_lock

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy already running — skip" | tee -a "$LOG_FILE"
  exit 0
fi
echo "$$" >"$LOCK_PID_FILE"
trap 'rm -f "$LOCK_PID_FILE"' EXIT

{
  echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy start mode=${MODE} ====="
  cd "$APP_DIR"

  git fetch origin "$BRANCH"
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse "origin/$BRANCH")

  NEED_BUILD=0
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Updating $LOCAL -> $REMOTE"
    git reset --hard "origin/$BRANCH"
    NEED_BUILD=1
  elif [ "$MODE" = "force" ]; then
    echo "Git already at $LOCAL — force rebuild"
    git reset --hard "origin/$BRANCH"
    NEED_BUILD=1
  elif [ ! -f .next/BUILD_ID ] || [ ! -d .next/static ]; then
    echo "Missing .next build artifacts — rebuilding"
    NEED_BUILD=1
  else
    echo "Already up to date ($LOCAL) with .next present"
    echo "===== deploy noop ====="
    exit 0
  fi

  if [ -f scripts/ensure-auth-env.mjs ]; then
    echo "Ensuring Supabase Auth public env on .env"
    node scripts/ensure-auth-env.mjs
  fi

  # Seed + prerender need more than one pooled connection.
  if [ -f .env ] && grep -q 'connection_limit=1' .env; then
    sed -i 's/connection_limit=1/connection_limit=5/g' .env
  fi

  npm ci || npm install
  npx prisma generate

  # Build into a sidecar directory so the live site keeps working if build fails.
  export NEXT_BUILD_DIR=".next.new"
  rm -rf .next.new
  mkdir -p .next.new
  # Next always writes to .next — build there in an isolated copy tree via rename dance:
  # 1) move live .next aside (keep as fallback)
  # 2) build fresh .next
  # 3) on success discard fallback; on failure restore fallback
  LIVE_BACKUP=""
  if [ -d .next ]; then
    LIVE_BACKUP=".next.live.bak"
    rm -rf "$LIVE_BACKUP"
    mv .next "$LIVE_BACKUP"
    echo "Parked live build at $LIVE_BACKUP"
  fi

  set +e
  NODE_OPTIONS='--max-old-space-size=2048' npm run build
  BUILD_RC=$?
  set -e

  if [ "$BUILD_RC" -ne 0 ] || [ ! -f .next/BUILD_ID ] || [ ! -d .next/static ]; then
    echo "ERROR: next build failed (rc=$BUILD_RC) or missing .next/static"
    rm -rf .next
    if [ -n "$LIVE_BACKUP" ] && [ -d "$LIVE_BACKUP" ]; then
      mv "$LIVE_BACKUP" .next
      echo "Restored previous .next — live assets preserved"
    fi
    exit 1
  fi

  rm -rf "$LIVE_BACKUP" .next.new
  echo "Build OK ($(cat .next/BUILD_ID))"

  systemctl restart sisters-flowers
  sleep 2
  systemctl --no-pager --full status sisters-flowers | head -15

  # Prefer nginx disk static when the HTTPS vhost still proxies /_next/static to Node.
  if [ -f scripts/fix-nginx-static.sh ]; then
    bash scripts/fix-nginx-static.sh || echo "nginx static fix skipped/failed (non-fatal)"
  fi

  echo "===== deploy done ====="
} >>"$LOG_FILE" 2>&1
