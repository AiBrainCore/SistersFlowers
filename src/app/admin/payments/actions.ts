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
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order?.email) {
      const { notifyOrderStatusEmail } = await import("@/lib/mail/order-notify");
      await notifyOrderStatusEmail({
        orderId: order.id,
        reference: order.reference,
        locale: order.locale === "en" ? "en" : "vi",
        status: "accepted",
        customerName: order.customerName,
        email: order.email,
      });
    }
  } catch (error) {
    console.error("[payments] confirm notify", error);
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?paid=1");
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
  redirect("/admin/orders?delivery=1");
}
