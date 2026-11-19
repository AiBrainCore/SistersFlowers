"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ensurePaymentMethodSettings } from "@/lib/payments/catalog";
import { markIntentPaid } from "@/lib/payments/intents";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function savePaymentMethodSettingsAction(formData: FormData) {
  await requireAdmin();
  await ensurePaymentMethodSettings();
  const methodId = String(formData.get("methodId") || "");
  if (!methodId) redirect("/admin/payments?error=method");

  const enabled = formData.get("enabled") === "on";
  const comingSoon = formData.get("comingSoon") === "on";
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;

  await prisma.paymentMethodSetting.update({
    where: { methodId },
    data: { enabled, comingSoon, sortOrder },
  });

  console.info(
    "[payments-audit]",
    `method:${methodId}:enabled=${enabled}:soon=${comingSoon}:sort=${sortOrder}`,
  );

  revalidatePath("/admin/payments");
  redirect("/admin/payments?saved=methods");
}

export async function savePaymentAccountAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const label = String(formData.get("label") || "").trim();
  const bankCode = String(formData.get("bankCode") || "").trim();
  const bankName = String(formData.get("bankName") || "").trim();
  const accountNumber = String(formData.get("accountNumber") || "").trim();
  const accountName = String(formData.get("accountName") || "").trim();
  const holderType = String(formData.get("holderType") || "household").trim();
  const citySlug = String(formData.get("citySlug") || "").trim() || null;
  const branchId = String(formData.get("branchId") || "").trim() || null;
  const isDefault = formData.get("isDefault") === "on";
  const active = formData.get("active") === "on";
  const markVerified = formData.get("verified") === "on";
  const internalNote = String(formData.get("internalNote") || "").trim() || null;

  if (!label || !bankCode || !bankName || !accountNumber || !accountName) {
    redirect("/admin/payments?error=account");
  }

  if (isDefault) {
    await prisma.paymentAccount.updateMany({
      data: { isDefault: false },
    });
  }

  const verifiedAt = markVerified ? new Date() : null;

  if (id) {
    const existing = await prisma.paymentAccount.findUnique({ where: { id } });
    await prisma.paymentAccount.update({
      where: { id },
      data: {
        label,
        bankCode,
        bankName,
        accountNumber,
        accountName,
        holderType,
        citySlug,
        branchId,
        isDefault,
        active,
        internalNote,
        verifiedAt: markVerified
          ? existing?.verifiedAt || new Date()
          : null,
      },
    });
  } else {
    await prisma.paymentAccount.create({
      data: {
        label,
        bankCode,
        bankName,
        accountNumber,
        accountName,
        holderType,
        citySlug,
        branchId,
        isDefault,
        active,
        verifiedAt,
        internalNote,
      },
    });
  }

  revalidatePath("/admin/payments");
  redirect("/admin/payments?saved=account");
}

export async function deletePaymentAccountAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.paymentAccount.update({
      where: { id },
      data: { active: false, isDefault: false },
    });
  }
  revalidatePath("/admin/payments");
  redirect("/admin/payments?saved=disabled");
}

export async function confirmShopPaymentAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const intentId = String(formData.get("intentId") || "");
  if (!orderId) redirect("/admin/orders");

  if (intentId) {
    await markIntentPaid({
      intentId,
      actor: "admin",
      note: "Manual bank confirmation",
    });
  } else {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order && order.paymentStatus !== "paid") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid" },
        }),
        prisma.orderPayment.create({
          data: {
            orderId,
            kind: "full",
            method: order.paymentMethod || "other",
            amount: order.deliveryTotal,
            seenAt: new Date(),
            note: "Manual confirmation",
          },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: order.paymentStatus,
            toStatus: "paid",
            note: "Payment confirmed manually",
            actor: "admin",
          },
        }),
      ]);
    }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: { include: { city: true } } },
    });
    if (order?.email) {
      const { notifyOrderStatusEmail } = await import("@/lib/mail/order-notify");
      await notifyOrderStatusEmail({
        orderId: order.id,
        reference: order.reference,
        locale: order.locale === "en" ? "en" : "vi",
        status: "accepted",
        customerName: order.customerName,
        email: order.email,
        citySlug: order.branch?.city.slug || null,
      });
    }
  } catch (error) {
    console.error("[payments] confirm notify", error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function updateDeliveryBookingAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin/orders");

  const status = String(formData.get("status") || "awaiting_arrangement");
  const provider = String(formData.get("provider") || "grab_manual");
  const bookingRef = String(formData.get("bookingRef") || "").trim() || null;
  const trackingRef = String(formData.get("trackingRef") || "").trim() || null;
  const courierName = String(formData.get("courierName") || "").trim() || null;
  const courierPhone = String(formData.get("courierPhone") || "").trim() || null;
  const actualCostRaw = String(formData.get("actualCost") || "").trim();
  const actualCost =
    actualCostRaw === ""
      ? null
      : Math.max(0, Math.round(Number(actualCostRaw) || 0));
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.deliveryBooking.upsert({
    where: { orderId },
    create: {
      orderId,
      status,
      provider,
      bookingRef,
      trackingRef,
      courierName,
      courierPhone,
      actualCost: actualCost ?? undefined,
      notes,
      customerFee: 0,
    },
    update: {
      status,
      provider,
      bookingRef,
      trackingRef,
      courierName,
      courierPhone,
      actualCost,
      notes,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function acknowledgeOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin/orders");
  await prisma.order.update({
    where: { id: orderId },
    data: { acknowledgedAt: new Date() },
  });
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      toStatus: "acknowledged",
      note: "Staff acknowledged paid order",
      actor: "admin",
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function saveFulfillmentChecklistAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/admin/orders");

  const {
    CHECKLIST_FIELDS,
    checklistComplete,
  } = await import("@/lib/payments/checklist");

  const data: Record<string, boolean | string | Date | null> = {};
  for (const field of CHECKLIST_FIELDS) {
    data[field] = formData.get(field) === "on";
  }
  const overrideNote =
    String(formData.get("overrideNote") || "").trim() || null;
  data.overrideNote = overrideNote;
  const complete = checklistComplete(
    data as Record<(typeof CHECKLIST_FIELDS)[number], boolean>,
  );
  data.completedAt = complete || overrideNote ? new Date() : null;

  await prisma.fulfillmentChecklist.upsert({
    where: { orderId },
    create: {
      orderId,
      productsReviewed: Boolean(data.productsReviewed),
      flowersPrepared: Boolean(data.flowersPrepared),
      customVerified: Boolean(data.customVerified),
      extrasIncluded: Boolean(data.extrasIncluded),
      greetingCardIncluded: Boolean(data.greetingCardIncluded),
      recipientVerified: Boolean(data.recipientVerified),
      packagingCompleted: Boolean(data.packagingCompleted),
      readyForHandoff: Boolean(data.readyForHandoff),
      overrideNote,
      completedAt: data.completedAt as Date | null,
    },
    update: {
      productsReviewed: Boolean(data.productsReviewed),
      flowersPrepared: Boolean(data.flowersPrepared),
      customVerified: Boolean(data.customVerified),
      extrasIncluded: Boolean(data.extrasIncluded),
      greetingCardIncluded: Boolean(data.greetingCardIncluded),
      recipientVerified: Boolean(data.recipientVerified),
      packagingCompleted: Boolean(data.packagingCompleted),
      readyForHandoff: Boolean(data.readyForHandoff),
      overrideNote,
      completedAt: data.completedAt as Date | null,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function updateShopOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "new");
  if (!orderId) redirect("/admin/orders");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      fulfillmentChecklist: true,
      branch: { include: { city: true } },
    },
  });
  if (!order) redirect("/admin/orders");

  const {
    CHECKLIST_GATE_STATUSES,
    checklistComplete,
  } = await import("@/lib/payments/checklist");

  if (CHECKLIST_GATE_STATUSES.has(status)) {
    const cl = order.fulfillmentChecklist;
    const ok =
      (cl && checklistComplete(cl)) || Boolean(cl?.overrideNote?.trim());
    if (!ok) {
      redirect(`/admin/orders/${orderId}?err=checklist`);
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status, version: { increment: 1 } },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: status,
        actor: "admin",
      },
    }),
  ]);

  try {
    const mailStatus =
      status === "confirmed"
        ? "accepted"
        : status === "ready_for_pickup" || status === "ready_for_dispatch"
          ? "ready"
          : status === "out_for_delivery"
            ? "dispatched"
            : status === "completed" || status === "delivered"
              ? "completed"
              : status === "cancelled"
                ? "cancelled"
                : null;
    if (mailStatus && order.email) {
      const { notifyOrderStatusEmail } = await import(
        "@/lib/mail/order-notify"
      );
      await notifyOrderStatusEmail({
        orderId: order.id,
        reference: order.reference,
        locale: order.locale === "en" ? "en" : "vi",
        status: mailStatus,
        customerName: order.customerName,
        email: order.email,
        citySlug: order.branch?.city.slug || null,
      });
    }
  } catch (error) {
    console.error("[orders] status email", error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function setDeliveryQuoteAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const fee = Math.max(
    0,
    Math.round(Number(formData.get("deliveryFee") || 0) || 0),
  );
  if (!orderId) redirect("/admin/orders");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { paymentIntents: true },
  });
  if (!order) redirect("/admin/orders");

  const payableTotal = order.subtotal + fee;
  const method = order.paymentMethod || "whatsapp";

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryFee: fee,
        deliveryTotal: payableTotal,
        status: "awaiting_payment",
        paymentStatus: method === "whatsapp" ? "unpaid" : "pending",
        version: { increment: 1 },
      },
    }),
    prisma.deliveryBooking.upsert({
      where: { orderId },
      create: {
        orderId,
        customerFee: fee,
        provider: "grab_manual",
        status: "awaiting_arrangement",
      },
      update: { customerFee: fee, notes: "quote_confirmed" },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: "awaiting_payment",
        note: `Delivery quote set: ${fee} VND`,
        actor: "admin",
      },
    }),
  ]);

  if (method !== "whatsapp") {
    try {
      const { createPaymentIntentForOrder } = await import(
        "@/lib/payments/intents"
      );
      await createPaymentIntentForOrder({
        orderId: order.id,
        orderReference: order.reference,
        amount: payableTotal,
        method,
        branchId: order.branchId,
        locale: order.locale,
        siteUrl:
          process.env.NEXT_PUBLIC_SITE_URL || process.env.MAIL_PUBLIC_SITE_URL,
      });
    } catch (error) {
      console.error("[orders] quote payment intent", error);
    }
  }

  try {
    if (order.email) {
      const { enqueueNotification } = await import("@/lib/payments/outbox");
      const locale = order.locale === "en" ? "en" : "vi";
      const subject =
        locale === "vi"
          ? `Cập nhật phí giao — ${order.reference}`
          : `Delivery fee update — ${order.reference}`;
      const payLink = order.trackingToken
        ? `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/${locale}/order/pay/${order.trackingToken}`
        : "";
      const html = `<p>Hello ${order.customerName},</p>
<p>Your delivery fee is confirmed: <strong>${fee.toLocaleString("vi-VN")} ₫</strong>.</p>
<p>New total: <strong>${payableTotal.toLocaleString("vi-VN")} ₫</strong>.</p>
${payLink ? `<p><a href="${payLink}">Pay now</a></p>` : ""}
<p>Sisters Flowers</p>`;
      await enqueueNotification({
        dedupeKey: `order:${order.id}:delivery_quote:${fee}`,
        template: "delivery_quote",
        recipient: order.email,
        payload: { subject, html, from: "orders" },
      });
      const { processNotificationOutbox } = await import(
        "@/lib/payments/outbox-process"
      );
      await processNotificationOutbox(5);
    }
  } catch (error) {
    console.error("[orders] quote notify", error);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}
