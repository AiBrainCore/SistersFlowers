#!/usr/bin/env bash
# Production deploy on Superdata VPS — pull main, build, restart.
# Usage:
#   bash scripts/deploy-production.sh           # rebuild only when git moved
#   bash scripts/deploy-production.sh force     # always rebuild (webhook / recovery)
#   FORCE_DEPLOY=1 bash scripts/deploy-production.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="/tmp/sisters-flowers-deploy.lock"
LOG_FILE="${LOG_FILE:-/var/log/sisters-flowers-deploy.log}"
MODE="${1:-auto}"
if [ "${FORCE_DEPLOY:-0}" = "1" ]; then
  MODE="force"
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy already running — skip" | tee -a "$LOG_FILE"
  exit 0
fi

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

  # Drop stale build output before rebuild so next start cannot serve half-written assets.
  rm -rf .next

  npm ci || npm install
  npx prisma generate
  NODE_OPTIONS='--max-old-space-size=2048' npm run build

  if [ ! -f .next/BUILD_ID ] || [ ! -d .next/static ]; then
    echo "ERROR: next build finished without .next/static — refusing restart"
    exit 1
  fi

  systemctl restart sisters-flowers
  sleep 2
  systemctl --no-pager --full status sisters-flowers | head -15
  echo "===== deploy done ====="
} >>"$LOG_FILE" 2>&1
