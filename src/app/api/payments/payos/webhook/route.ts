import { NextResponse } from "next/server";
import { payosConfigured, verifyPayosWebhookSignature } from "@/lib/payments/payos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * payOS webhook — rejects until configured + signature verified.
 * Never mark paid from an unverified callback.
 */
export async function POST(req: Request) {
  if (!payosConfigured()) {
    return NextResponse.json(
      { ok: false, error: "payos_not_configured" },
      { status: 503 },
    );
  }

  const raw = await req.text();
  const signature =
    req.headers.get("x-payos-signature") ||
    req.headers.get("payos-signature") ||
    "";

  if (!verifyPayosWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  // Live activation: parse payload, idempotent markIntentPaid by provider id.
  return NextResponse.json({ ok: true, processed: false });
}
