"use server";

import { revalidatePath } from "next/cache";
import { markCustomerReportedPaid } from "@/lib/payments/confirm-flow";
import { notifyStudioPaymentClaimed } from "@/lib/mail/order-notify";

export type ReportPaidResult =
  | { ok: true; state: "processing" | "paid" | "already_processing" }
  | { ok: false; error: string };

/** Guest on /order/pay/[token] — “I’ve paid” after scanning VietQR. */
export async function reportCustomerPaidAction(
  trackingToken: string,
): Promise<ReportPaidResult> {
  const token = String(trackingToken || "").trim();
  if (!token) return { ok: false, error: "missing_token" };

  try {
    const result = await markCustomerReportedPaid({ trackingToken: token });
    if (result.already === "paid") {
      return { ok: true, state: "paid" };
    }
    if (result.already === "processing") {
      return { ok: true, state: "already_processing" };
    }

    const citySlug = result.order.branch?.city.slug || null;
    try {
      await notifyStudioPaymentClaimed({
        orderId: result.order.id,
        reference: result.order.reference,
        customerName: result.order.customerName,
        phone: result.order.phone,
        amount: result.intent.amount,
        transferRef: result.intent.reference,
        citySlug,
        fulfillment: result.order.fulfillment,
      });
    } catch (error) {
      console.error("[payments] claim studio mail", error);
    }

    const locale = result.order.locale === "en" ? "en" : "vi";
    revalidatePath(`/${locale}/order/pay/${token}`);
    revalidatePath(`/${locale}/order/track/${token}`);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${result.order.id}`);

    return { ok: true, state: "processing" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    console.error("[payments] reportCustomerPaid", msg);
    return { ok: false, error: msg };
  }
}
