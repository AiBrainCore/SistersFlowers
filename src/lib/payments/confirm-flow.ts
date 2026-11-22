import { prisma } from "@/lib/db";

/** Fulfillment statuses that should move to "confirmed" once money is verified. */
const ADVANCE_ON_PAID = new Set(["new", "awaiting_payment"]);

/**
 * Customer tapped “I've paid” after VietQR transfer.
 * Does NOT mark the order paid — studio must still confirm the bank credit.
 */
export async function markCustomerReportedPaid(input: {
  trackingToken: string;
}) {
  const order = await prisma.order.findFirst({
    where: { trackingToken: input.trackingToken },
    include: {
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
      branch: { include: { city: true } },
      items: true,
    },
  });
  if (!order) throw new Error("order_not_found");

  const intent = order.paymentIntents[0] || null;
  if (!intent) throw new Error("intent_not_found");
  if (intent.status === "paid" || order.paymentStatus === "paid") {
    return { order, intent, already: "paid" as const };
  }
  if (intent.status === "processing") {
    return { order, intent, already: "processing" as const };
  }
  if (intent.status !== "pending") {
    throw new Error("intent_not_pending");
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "processing" },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: intent.status,
        toStatus: "processing",
        note: "Customer reported bank transfer completed",
        actor: "customer",
      },
    }),
  ]);

  const updated = await prisma.paymentIntent.findUniqueOrThrow({
    where: { id: intent.id },
  });
  return { order, intent: updated, already: null };
}

/**
 * Studio confirmed money arrived. Marks intent+order paid and advances
 * fulfillment to "confirmed" when the order was waiting on payment.
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
