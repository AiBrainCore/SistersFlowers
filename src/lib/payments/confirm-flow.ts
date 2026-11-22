import { prisma } from "@/lib/db";

/** Fulfillment statuses that should move to "confirmed" once money is verified. */
const ADVANCE_ON_PAID = new Set(["new", "awaiting_payment"]);

/**
 * Studio confirmed money arrived (bank app / statement). Marks intent+order paid
 * and advances fulfillment to "confirmed" when the order was waiting on payment.
 * Guests do not self-report payment — staff Confirm paid is the only path.
 */
export async function markIntentPaidAndAdvance(input: {
  intentId: string;
  actor?: string;
  note?: string;
}) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: input.intentId },
    include: { order: true },
  });
  if (!intent) throw new Error("intent_not_found");
  if (intent.status === "paid") {
    return { intent, advancedTo: null as string | null, alreadyPaid: true };
  }

  const now = new Date();
  const fromFulfillment = intent.order.status;
  const shouldAdvance = ADVANCE_ON_PAID.has(fromFulfillment);
  const toFulfillment = shouldAdvance ? "confirmed" : fromFulfillment;

  const ops = [
    prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "paid", paidAt: now },
    }),
    prisma.order.update({
      where: { id: intent.orderId },
      data: {
        paymentStatus: "paid",
        ...(shouldAdvance ? { status: toFulfillment } : {}),
      },
    }),
    prisma.orderPayment.create({
      data: {
        orderId: intent.orderId,
        kind: "full",
        method: intent.method,
        amount: intent.amount,
        note: input.note || `Confirmed ${intent.reference}`,
        seenAt: now,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: intent.orderId,
        fromStatus: intent.order.paymentStatus,
        toStatus: "paid",
        note: input.note || "Payment confirmed",
        actor: input.actor || "admin",
      },
    }),
  ];

  if (shouldAdvance) {
    ops.push(
      prisma.orderStatusHistory.create({
        data: {
          orderId: intent.orderId,
          fromStatus: fromFulfillment,
          toStatus: toFulfillment,
          note: "Auto-advanced after payment confirmed — ready for production",
          actor: input.actor || "admin",
        },
      }),
    );
  }

  await prisma.$transaction(ops);

  const updated = await prisma.paymentIntent.findUniqueOrThrow({
    where: { id: intent.id },
  });
  return {
    intent: updated,
    advancedTo: shouldAdvance ? toFulfillment : null,
    alreadyPaid: false,
  };
}
