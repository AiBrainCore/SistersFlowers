import { timingSafeEqual } from "crypto";
import { spawn } from "child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPLOY_SCRIPT =
  process.env.DEPLOY_SCRIPT_PATH || "/var/www/sisters-flowers/scripts/deploy-production.sh";

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

/** GitHub → HTTPS webhook. Restarts the app after pull/build (detached). */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const child = spawn("bash", [DEPLOY_SCRIPT], {
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
  } catch {
    return NextResponse.json({ ok: false, error: "spawn_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, message: "deploy started" },
    { status: 202 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "sisters-flowers-deploy" },
    { status: 200 },
  );
}
