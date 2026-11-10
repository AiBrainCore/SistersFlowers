#!/usr/bin/env bash
# Production deploy on Superdata VPS — pull main, build, restart.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/sisters-flowers}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="/tmp/sisters-flowers-deploy.lock"
LOG_FILE="${LOG_FILE:-/var/log/sisters-flowers-deploy.log}"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy already running — skip" | tee -a "$LOG_FILE"
  exit 0
fi

{
  echo "===== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy start ====="
  cd "$APP_DIR"

  git fetch origin "$BRANCH"
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse "origin/$BRANCH")
  if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Already up to date ($LOCAL)"
    echo "===== deploy noop ====="
    exit 0
  fi

  echo "Updating $LOCAL -> $REMOTE"
  git reset --hard "origin/$BRANCH"

  npm ci || npm install
  npx prisma generate
  NODE_OPTIONS='--max-old-space-size=2048' npm run build

  systemctl restart sisters-flowers
  sleep 2
  systemctl --no-pager --full status sisters-flowers | head -15
  echo "===== deploy done ====="
} >>"$LOG_FILE" 2>&1
