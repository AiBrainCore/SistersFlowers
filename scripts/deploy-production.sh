#!/usr/bin/env bash
# Production deploy on Superdata VPS — pull main, build, restart.
# Usage:
#   bash scripts/deploy-production.sh           # rebuild only when git moved
#   bash scripts/deploy-production.sh force     # always rebuild (webhook / recovery)
#   FORCE_DEPLOY=1 bash scripts/deploy-production.sh
#
# True zero-downtime-during-build: compile into .next.new via NEXT_DIST_DIR so
# the live `.next` stays on disk the whole time. Swap + restart only after
# Build OK. Stale locks (>25m) are cleared so a hung npm build cannot brick forever.
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
SCRIPT_SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"

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

# Re-exec after git sync inherits fd 9 (flock). Skip re-open so we keep the lock.
if [ "${SF_DEPLOY_LOCK_HELD:-0}" != "1" ]; then
  clear_stale_lock
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy already running — skip" | tee -a "$LOG_FILE"
    exit 0
  fi
  export SF_DEPLOY_LOCK_HELD=1
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
  DID_RESET=0
  # Survives re-exec: auto mode after git reset must still rebuild .next
  # (otherwise LOCAL==REMOTE + existing .next → false noop with stale assets).
  if [ "${SF_DEPLOY_NEED_BUILD:-0}" = "1" ]; then
    NEED_BUILD=1
  fi
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Updating $LOCAL -> $REMOTE"
    git reset --hard "origin/$BRANCH"
    NEED_BUILD=1
    DID_RESET=1
  elif [ "$MODE" = "force" ] || [ "$NEED_BUILD" = "1" ]; then
    if [ "$MODE" = "force" ]; then
      echo "Git already at $LOCAL — force rebuild"
    else
      echo "Git already at $LOCAL — rebuild required after sync"
    fi
    git reset --hard "origin/$BRANCH"
    NEED_BUILD=1
    DID_RESET=1
  elif [ ! -f .next/BUILD_ID ] || [ ! -d .next/static ]; then
    echo "Missing .next build artifacts — rebuilding"
    NEED_BUILD=1
  else
    echo "Already up to date ($LOCAL) with .next present"
    echo "===== deploy noop ====="
    exit 0
  fi

  # Bash already loaded this file before git reset. Re-exec once so script
  # changes (e.g. sidecar .next.new) apply on the same deploy that pulls them.
  if [ "$DID_RESET" = "1" ] && [ -z "${SF_DEPLOY_BOOTSTRAPPED:-}" ]; then
    echo "Re-exec after git sync so deploy script updates apply"
    export SF_DEPLOY_BOOTSTRAPPED=1
    export SF_DEPLOY_LOCK_HELD=1
    export SF_DEPLOY_NEED_BUILD=1
    export FORCE_DEPLOY
    exec bash "$SCRIPT_SELF" "$MODE"
  fi

  if [ -f scripts/ensure-auth-env.mjs ]; then
    echo "Ensuring Supabase Auth public env on .env"
    node scripts/ensure-auth-env.mjs
  fi

  # Seed + prerender need more than one pooled connection.
  if [ -f .env ] && grep -q 'connection_limit=1' .env; then
    sed -i 's/connection_limit=1/connection_limit=5/g' .env
    echo "Raised DATABASE_URL connection_limit 1 → 5 for build/runtime"
  fi

  npm ci || npm install
  npx prisma generate

  # Build into a sidecar distDir — live `.next` keeps serving throughout.
  export NEXT_DIST_DIR=".next.new"
  rm -rf .next.new
  echo "Building into $NEXT_DIST_DIR (live .next untouched)"

  set +e
  NODE_OPTIONS='--max-old-space-size=2048' npm run build
  BUILD_RC=$?
  set -e

  if [ "$BUILD_RC" -ne 0 ] || [ ! -f .next.new/BUILD_ID ] || [ ! -d .next.new/static ]; then
    echo "ERROR: next build failed (rc=$BUILD_RC) or missing .next.new/static"
    rm -rf .next.new
    echo "Live .next left in place — site should still be up"
    exit 1
  fi

  echo "Build OK ($(cat .next.new/BUILD_ID)) — swapping into place"
  # Brief cutover: stop → swap → start so nothing reads a half-moved tree.
  systemctl stop sisters-flowers || true
  rm -rf .next.prev
  if [ -d .next ]; then
    mv .next .next.prev
  fi
  mv .next.new .next
  systemctl start sisters-flowers
  sleep 2
  if ! systemctl is-active --quiet sisters-flowers; then
    echo "ERROR: service failed to start after swap — restoring previous .next"
    systemctl stop sisters-flowers || true
    rm -rf .next
    if [ -d .next.prev ]; then
      mv .next.prev .next
    fi
    systemctl start sisters-flowers || true
    exit 1
  fi
  rm -rf .next.prev
  systemctl --no-pager --full status sisters-flowers | head -15

  # Prefer nginx disk static when the HTTPS vhost still proxies /_next/static to Node.
  if [ -f scripts/fix-nginx-static.sh ]; then
    bash scripts/fix-nginx-static.sh || echo "nginx static fix skipped/failed (non-fatal)"
  fi

  echo "===== deploy done ====="
} >>"$LOG_FILE" 2>&1
