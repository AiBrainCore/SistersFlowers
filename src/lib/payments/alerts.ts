import { prisma } from "@/lib/db";

export type OpsAlert = {
  id: string;
  severity: "high" | "medium";
  kind: string;
  orderId: string;
  reference: string;
  messageEn: string;
  messageVi: string;
  createdAt: Date;
};

/** Compute high-visibility ops alerts from live order state (no fake urgency). */
export async function listOpsAlerts(limit = 40): Promise<OpsAlert[]> {
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const alerts: OpsAlert[] = [];

  const paidUnacked = await prisma.order.findMany({
    where: {
      paymentStatus: "paid",
      acknowledgedAt: null,
      status: { notIn: ["cancelled", "completed", "delivered"] },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      createdAt: true,
      deliveryDate: true,
      fulfillment: true,
      status: true,
      deliveryBooking: { select: { status: true } },
    },
  });

  for (const o of paidUnacked) {
    alerts.push({
      id: `unacked:${o.id}`,
      severity: "high",
      kind: "paid_unacknowledged",
      orderId: o.id,
      reference: o.reference,
      messageEn: "Paid order not acknowledged",
      messageVi: "Đơn đã thanh toán chưa được xác nhận",
      createdAt: o.createdAt,
    });
  }

  const paymentClaims = await prisma.paymentIntent.findMany({
    where: {
      status: "processing",
      order: { paymentStatus: { not: "paid" }, status: { not: "cancelled" } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      updatedAt: true,
      order: { select: { id: true, reference: true } },
    },
  });
  for (const intent of paymentClaims) {
    alerts.push({
      id: `claim:${intent.id}`,
      severity: "high",
      kind: "payment_claim_unconfirmed",
      orderId: intent.order.id,
      reference: intent.order.reference,
      messageEn: "Customer reported paid — verify bank",
      messageVi: "Khách báo đã trả — kiểm tra ngân hàng",
      createdAt: intent.updatedAt,
    });
  }

  const awaitingQuote = await prisma.order.findMany({
    where: { status: "awaiting_delivery_quote" },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, reference: true, createdAt: true },
  });
  for (const o of awaitingQuote) {
    alerts.push({
      id: `quote:${o.id}`,
      severity: "high",
      kind: "delivery_quote_needed",
      orderId: o.id,
      reference: o.reference,
      messageEn: "Delivery quote needed",
      messageVi: "Cần báo giá giao hàng",
      createdAt: o.createdAt,
    });
  }

  const deliveryPending = await prisma.order.findMany({
    where: {
      fulfillment: "delivery",
      paymentStatus: "paid",
      status: { in: ["confirmed", "preparing", "ready_for_dispatch", "paid"] },
      OR: [
        { deliveryBooking: null },
        {
          deliveryBooking: {
            status: { in: ["awaiting_arrangement", "courier_requested"] },
          },
        },
      ],
    },
    take: 20,
    select: {
      id: true,
      reference: true,
      createdAt: true,
      deliveryDate: true,
    },
  });
  for (const o of deliveryPending) {
    const sameDay =
      o.deliveryDate &&
      o.deliveryDate === new Date().toISOString().slice(0, 10);
    alerts.push({
      id: `delivery:${o.id}`,
      severity: sameDay ? "high" : "medium",
      kind: "delivery_not_arranged",
      orderId: o.id,
      reference: o.reference,
      messageEn: sameDay
        ? "Same-day delivery not arranged"
        : "Delivery not arranged yet",
      messageVi: sameDay
        ? "Giao trong ngày chưa sắp xếp"
        : "Chưa sắp xếp giao hàng",
      createdAt: o.createdAt,
    });
  }

  const pendingPayOld = await prisma.order.findMany({
    where: {
      paymentStatus: "pending",
      createdAt: { lt: new Date(now - dayMs) },
      status: { notIn: ["cancelled"] },
    },
    take: 15,
    select: { id: true, reference: true, createdAt: true },
  });
  for (const o of pendingPayOld) {
    alerts.push({
      id: `pending:${o.id}`,
      severity: "medium",
      kind: "payment_pending_stale",
      orderId: o.id,
      reference: o.reference,
      messageEn: "Payment still pending (>24h)",
      messageVi: "Vẫn chờ thanh toán (>24 giờ)",
      createdAt: o.createdAt,
    });
  }

  const failedMail = await prisma.notificationOutbox.findMany({
    where: { status: "failed" },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  for (const n of failedMail) {
    alerts.push({
      id: `mail:${n.id}`,
      severity: "medium",
      kind: "notification_failed",
      orderId: "",
      reference: n.dedupeKey.slice(0, 24),
      messageEn: `Failed notification: ${n.template}`,
      messageVi: `Gửi thông báo thất bại: ${n.template}`,
      createdAt: n.createdAt,
    });
  }

  return alerts.slice(0, limit);
}
