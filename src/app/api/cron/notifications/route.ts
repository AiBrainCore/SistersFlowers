import { NextResponse } from "next/server";
import { processNotificationOutbox } from "@/lib/payments/outbox-process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron-compatible outbox drain.
 * Auth: Authorization: Bearer $CRON_SECRET (or ?secret=)
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const urlSecret = new URL(req.url).searchParams.get("secret") || "";
  if (bearer !== secret && urlSecret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await processNotificationOutbox(25);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return POST(req);
}
