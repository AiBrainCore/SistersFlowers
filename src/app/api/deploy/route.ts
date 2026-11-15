import { timingSafeEqual } from "crypto";
import { spawn } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPLOY_SCRIPT =
  process.env.DEPLOY_SCRIPT_PATH ||
  "/var/www/sisters-flowers/scripts/deploy-production.sh";
const APP_DIR = process.env.APP_DIR || "/var/www/sisters-flowers";
const LOCK_FILE = "/tmp/sisters-flowers-deploy.lock";
const LOCK_PID_FILE = "/tmp/sisters-flowers-deploy.pid";
const LOG_FILE =
  process.env.DEPLOY_LOG_FILE || "/var/log/sisters-flowers-deploy.log";

function authorized(req: Request) {
  const secret = process.env.DEPLOY_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readTail(path: string, maxBytes = 4000) {
  try {
    const buf = readFileSync(path);
    return buf
      .subarray(Math.max(0, buf.length - maxBytes))
      .toString("utf8");
  } catch {
    return null;
  }
}

/** GitHub → HTTPS webhook. Restarts the app after pull/build (detached). */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Break stale locks in the wrapper so recovery works even before the new
  // deploy-production.sh is pulled (hung npm holding flock bricks /_next/static).
  const wrapper = [
    "set -e",
    `LOCK='${LOCK_FILE}'`,
    `PIDF='${LOCK_PID_FILE}'`,
    'if [ -f "$LOCK" ]; then',
    '  find "$LOCK" -mmin +25 -delete 2>/dev/null || true',
    '  if [ -f "$PIDF" ]; then',
    '    OPID=$(cat "$PIDF" 2>/dev/null || true)',
    '    if [ -n "$OPID" ] && ! kill -0 "$OPID" 2>/dev/null; then rm -f "$LOCK" "$PIDF"; fi',
    "  fi",
    "fi",
    `bash '${DEPLOY_SCRIPT}' force`,
  ].join("; ");

  try {
    const child = spawn("bash", ["-lc", wrapper], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, FORCE_DEPLOY: "1", APP_DIR },
    });
    child.unref();
  } catch {
    return NextResponse.json({ ok: false, error: "spawn_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, message: "deploy started (force rebuild, stale-lock clear)" },
    { status: 202 },
  );
}

/** Public health — helps diagnose HTML-ok / static-500 without SSH. */
export async function GET() {
  const staticDir = join(APP_DIR, ".next/static");
  const buildIdPath = join(APP_DIR, ".next/BUILD_ID");
  let buildId: string | null = null;
  let staticOk = false;
  let lockAgeMin: number | null = null;
  try {
    staticOk = existsSync(staticDir);
    if (existsSync(buildIdPath)) {
      buildId = readFileSync(buildIdPath, "utf8").trim();
    }
    if (existsSync(LOCK_FILE)) {
      lockAgeMin = Math.round(
        (Date.now() - statSync(LOCK_FILE).mtimeMs) / 60000,
      );
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    ok: true,
    service: "sisters-flowers-deploy",
    buildId,
    staticDirExists: staticOk,
    deployLockAgeMinutes: lockAgeMin,
    logTail: readTail(LOG_FILE),
  });
}
