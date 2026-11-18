/**
 * payOS adapter — implemented but inactive until credentials exist.
 * Docs: https://payos.vn/docs/
 *
 * Never treat a browser return URL as proof of payment.
 */

export function payosConfigured() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID?.trim() &&
      process.env.PAYOS_API_KEY?.trim() &&
      process.env.PAYOS_CHECKSUM_KEY?.trim(),
  );
}

export type PayosCreateResult =
  | {
      ok: true;
      checkoutUrl: string;
      paymentLinkId: string;
      orderCode: number;
    }
  | { ok: false; error: string };

/** Create payment link — returns error if not configured (safe default). */
export async function createPayosPaymentLink(input: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayosCreateResult> {
  if (!payosConfigured()) {
    return { ok: false, error: "payos_not_configured" };
  }

  const clientId = process.env.PAYOS_CLIENT_ID!.trim();
  const apiKey = process.env.PAYOS_API_KEY!.trim();
  // Checksum signing follows current payOS docs when activating live.
  // Placeholder request kept server-side only.
  void input;
  void clientId;
  void apiKey;
  return {
    ok: false,
    error: "payos_not_activated",
  };
}

export function verifyPayosWebhookSignature(_rawBody: string, _signature: string) {
  if (!payosConfigured()) return false;
  // Activation: implement HMAC with PAYOS_CHECKSUM_KEY per current docs.
  return false;
}
