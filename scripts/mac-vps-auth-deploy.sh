#!/usr/bin/env bash
# Run in Terminal ON THE MAC (not cloud agent).
set -euo pipefail
VPS="${VPS:-root@45.117.171.54}"

echo "== Mac -> VPS deploy key + auth live =="
uname -a

PUB=$(ssh -o StrictHostKeyChecking=accept-new "$VPS" bash -s <<'REMOTE'
set -euo pipefail
mkdir -p /root/.ssh && chmod 700 /root/.ssh
if [ ! -f /root/.ssh/sisters-flowers-deploy ]; then
  ssh-keygen -t ed25519 -f /root/.ssh/sisters-flowers-deploy -N "" -C "sisters-flowers-vps-deploy"
fi
cat > /root/.ssh/config <<'CFG'
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/sisters-flowers-deploy
  IdentitiesOnly yes
CFG
chmod 600 /root/.ssh/config /root/.ssh/sisters-flowers-deploy
ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null || true
cat /root/.ssh/sisters-flowers-deploy.pub
REMOTE
)

echo "Public key: $PUB"
if command -v gh >/dev/null; then
  gh api repos/AiBrainCore/SistersFlowers/keys \
    -f title='sisters-flowers-vps-deploy' \
    -f key="$PUB" \
    -F read_only=true >/tmp/dk.json 2>/tmp/dk.err || true
  if rg -q 'id|:403|already|Unprocessable' /tmp/dk.json /tmp/dk.err 2>/dev/null; then
    echo "Deploy key API result:"; cat /tmp/dk.json /tmp/dk.err 2>/dev/null | head -20
  fi
else
  echo "ERROR: gh not found on Mac — install GitHub CLI or add deploy key manually:"
  echo "https://github.com/AiBrainCore/SistersFlowers/settings/keys"
  exit 1
fi

ssh "$VPS" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/sisters-flowers
git remote set-url origin git@github.com:AiBrainCore/SistersFlowers.git
git fetch origin main
git reset --hard origin/main
node scripts/ensure-auth-env.mjs
if [ -f .env ] && grep -q 'connection_limit=1' .env; then
  sed -i 's/connection_limit=1/connection_limit=5/g' .env
fi
npm ci || npm install
NODE_OPTIONS='--max-old-space-size=2048' npm run build
systemctl restart sisters-flowers
sleep 2
systemctl is-active sisters-flowers
curl -sS -o /dev/null -w "local_register:%{http_code}\n" --max-time 20 http://127.0.0.1:3000/vi/account/register || true
REMOTE

curl -sS -o /dev/null -w "live_register:%{http_code}\n" --max-time 30 https://sistersflowers.vn/vi/account/register
echo DONE
