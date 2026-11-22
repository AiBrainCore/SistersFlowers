"use server";

import { prisma } from "@/lib/db";
import {
  buildWhatsAppUrl,
  makeOrderReference,
  validateCheckout,
  type CheckoutPayload,
  type IssuedVoucherLine,
} from "@/lib/orders";
import { commissionAmount } from "@/lib/addons";
import { upsertBuyerCustomer } from "@/lib/customer-identity";
import { getCurrentCustomer } from "@/lib/customer-session";
import { makeVoucherCode, remitToPartner } from "@/lib/vouchers";

export type SubmitOrderResult =
  | {
      ok: true;
      reference: string;
      whatsappUrl: string;
      trackingToken?: string;
      paymentPath?: string;
    }
  | { ok: false; error: string };

export async function submitOrderAction(
  payload: CheckoutPayload,
): Promise<SubmitOrderResult> {
  const errors = validateCheckout(payload);
  if (errors.length) {
    return { ok: false, error: `Missing: ${errors.join(", ")}` };
  }

  const fulfillment =
    payload.fulfillment === "pickup" ? "pickup" : "delivery";
  const paymentMethod = (payload.paymentMethod || "vietqr").trim();

  const { repriceCheckoutItems } = await import("@/lib/payments/pricing");
  const priced = await repriceCheckoutItems({
    items: payload.items,
    citySlug: payload.citySlug,
  });
  if (!priced.ok) {
    return { ok: false, error: priced.error };
  }

  const reference = makeOrderReference();
  const subtotal = priced.subtotal;
  const needsDeliveryQuote =
    fulfillment === "delivery" &&
    (payload.deliveryFee === null || payload.deliveryFee === undefined);
  const deliveryFee = fulfillment === "pickup" ? 0 : payload.deliveryFee ?? null;

  type ItemCreate = {
    slug: string;
    name: string;
    price: number;
    qty: number;
    image: string;
    kind: string;
    size: string | null;
    note: string | null;
    partnerName: string | null;
    commissionPercent: number | null;
    commissionAmount: number | null;
    voucherCode?: string;
    voucherStatus?: string;
    voucherExpiresAt?: Date;
    remitAmount?: number;
  };

  const itemsData: ItemCreate[] = [];
  const issuedVouchers: IssuedVoucherLine[] = [];

  for (const item of priced.items) {
    const isPartner =
      item.kind === "addon" && item.addonKind === "partner";
    const commissionPercent = item.commissionPercent ?? null;

    if (isPartner) {
      const validityDays = Math.max(1, item.validityDays ?? 90);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);
      const percent = commissionPercent ?? 0;
      const units = Math.max(1, item.qty);

      for (let i = 0; i < units; i++) {
        const code = await makeVoucherCode();
        const commission =
          percent > 0 ? commissionAmount(item.price, percent) : null;
        itemsData.push({
          slug: item.slug,
          name: item.name,
          price: item.price,
          qty: 1,
          image: item.image,
          kind: "partner",
          size: null,
          note: item.note || null,
          partnerName: item.partnerName || null,
          commissionPercent: percent > 0 ? percent : null,
          commissionAmount: commission,
          voucherCode: code,
          voucherStatus: "issued",
          voucherExpiresAt: expiresAt,
          remitAmount: remitToPartner(item.price, percent),
        });
        issuedVouchers.push({
          code,
          name: item.name,
          partnerName: item.partnerName || "",
          faceValue: item.price,
          expiresAt,
        });
      }
      continue;
    }

    const commissionAmountValue =
      commissionPercent != null && commissionPercent > 0
        ? Math.round((item.price * item.qty * commissionPercent) / 100)
        : null;

    itemsData.push({
      slug: item.slug,
      name: item.name,
      price: item.price,
      qty: item.qty,
      image: item.image,
      kind: item.kind === "addon" ? "addon" : "product",
      size: item.size || null,
      note: item.note || null,
      partnerName: item.partnerName || null,
      commissionPercent,
      commissionAmount: commissionAmountValue,
    });
  }

  const pricedPayload = { ...payload, items: priced.items };
  const whatsappUrl = buildWhatsAppUrl(reference, pricedPayload, issuedVouchers);
  const feeForTotal = needsDeliveryQuote ? 0 : deliveryFee ?? 0;
  const payableTotal = subtotal + feeForTotal;
  const initialStatus = needsDeliveryQuote
    ? "awaiting_delivery_quote"
    : "new";
  const initialPaymentStatus = needsDeliveryQuote
    ? "unpaid"
    : paymentMethod === "whatsapp"
      ? "unpaid"
      : "pending";

  if (!needsDeliveryQuote && paymentMethod !== "whatsapp") {
    const { isMethodSelectable } = await import("@/lib/payments/catalog");
    const ok = await isMethodSelectable(paymentMethod, payload.citySlug);
    if (!ok) {
      return { ok: false, error: "Selected payment method is not available" };
    }
  }

  const email = payload.email?.trim() || null;
  const loggedIn = await getCurrentCustomer().catch(() => null);
  const customerId = await upsertBuyerCustomer({
    name: payload.customerName.trim(),
    phone: payload.phone.trim(),
    email,
    address: payload.address.trim(),
    preferredLocale: payload.locale,
    knownCustomerId: loggedIn?.id,
  });

  const { makeTrackingToken, createPaymentIntentForOrder } = await import(
    "@/lib/payments/intents"
  );
  const trackingToken = makeTrackingToken();

  const primaryBranch = payload.citySlug
    ? await prisma.branch.findFirst({
        where: { city: { slug: payload.citySlug }, isPrimary: true },
        select: { id: true },
      })
    : null;

  const order = await prisma.order.create({
    data: {
      reference,
      locale: payload.locale,
      customerName: payload.customerName.trim(),
      phone: payload.phone.trim(),
      email,
      customerId: customerId || undefined,
      branchId: primaryBranch?.id || undefined,
      zone:
        fulfillment === "pickup"
          ? `pickup:${payload.citySlug || "studio"}`
          : payload.zone.trim(),
      deliveryKm: fulfillment === "pickup" ? null : payload.deliveryKm ?? null,
      deliveryFee: fulfillment === "pickup" ? 0 : deliveryFee,
      address:
        fulfillment === "pickup"
          ? payload.address.trim() || "Pickup at studio"
          : payload.address.trim(),
      deliveryDate: payload.deliveryDate?.trim() || null,
      deliveryTime: payload.deliveryTime?.trim() || null,
      fulfillment,
      notes: payload.notes?.trim() || null,
      recipientName: payload.recipientName?.trim() || null,
      recipientPhone: payload.recipientPhone?.trim() || null,
      cardMessage: payload.cardMessage?.trim() || null,
      hotelName: payload.hotelName?.trim() || null,
      roomNumber: payload.roomNumber?.trim() || null,
      subtotal,
      deliveryTotal: payableTotal,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      paymentMethod,
      trackingToken,
      anonymousSender: Boolean(payload.anonymousSender),
      whatsappUrl,
      items: { create: itemsData },
      fulfillmentChecklist: { create: {} },
      statusHistory: {
        create: {
          toStatus: initialStatus,
          note: needsDeliveryQuote
            ? `Shop checkout · awaiting delivery quote · ${paymentMethod}`
            : `Shop checkout · ${paymentMethod}`,
          actor: "system",
        },
      },
      deliveryBooking:
        fulfillment === "delivery"
          ? {
              create: {
                provider: "grab_manual",
                status: needsDeliveryQuote
                  ? "awaiting_arrangement"
                  : "awaiting_arrangement",
                customerFee: feeForTotal,
                notes: needsDeliveryQuote ? "awaiting_customer_quote" : null,
              },
            }
          : undefined,
    },
  });

  let paymentPath: string | undefined;
  if (!needsDeliveryQuote) {
    try {
      const intent = await createPaymentIntentForOrder({
        orderId: order.id,
        orderReference: reference,
        amount: payableTotal,
        method: paymentMethod,
        citySlug: payload.citySlug,
        branchId: primaryBranch?.id,
        locale: payload.locale,
        siteUrl:
          process.env.NEXT_PUBLIC_SITE_URL || process.env.MAIL_PUBLIC_SITE_URL,
      });
      if (intent?.method === "vietqr") {
        paymentPath = `/${payload.locale}/order/pay/${trackingToken}`;
      } else if (intent?.checkoutUrl) {
        paymentPath = intent.checkoutUrl;
      }
    } catch (error) {
      console.error("[orders] payment intent", error);
    }
  } else {
    paymentPath = `/${payload.locale}/order/track/${trackingToken}`;
  }

  try {
    const { notifyOrderEmails } = await import("@/lib/mail/order-notify");
    const productSlugs = Array.from(
      new Set(
        itemsData
          .filter((item) => item.kind === "product")
          .map((item) => item.slug),
      ),
    );
    const skuRows =
      productSlugs.length > 0
        ? await prisma.product.findMany({
            where: { slug: { in: productSlugs } },
            select: { slug: true, sku: true },
          })
        : [];
    const skuBySlug = new Map(skuRows.map((row) => [row.slug, row.sku]));
    await notifyOrderEmails({
      locale: payload.locale === "en" ? "en" : "vi",
      reference,
      orderId: order.id,
      customerName: payload.customerName.trim(),
      phone: payload.phone.trim(),
      email,
      address: order.address,
      zone: order.zone,
      citySlug: payload.citySlug?.trim() || null,
      deliveryDate: payload.deliveryDate?.trim() || null,
      deliveryTime: payload.deliveryTime?.trim() || null,
      notes: payload.notes?.trim() || null,
      fulfillment,
      paymentMethod,
      recipientName: payload.recipientName?.trim() || null,
      recipientPhone: payload.recipientPhone?.trim() || null,
      cardMessage: payload.cardMessage?.trim() || null,
      anonymousSender: Boolean(payload.anonymousSender),
      hotelName: payload.hotelName?.trim() || null,
      roomNumber: payload.roomNumber?.trim() || null,
      subtotal,
      deliveryFee: order.deliveryFee,
      deliveryTotal: payableTotal,
      items: itemsData.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        sku:
          skuBySlug.get(item.slug) ||
          (item.kind === "partner" ? item.voucherCode : null) ||
          null,
      })),
    });
  } catch (error) {
    console.error("[orders] email notify failed", error);
  }

  return {
    ok: true,
    reference,
    whatsappUrl,
    trackingToken,
    paymentPath,
  };
}

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitInquiryAction(formData: FormData): Promise<SubmitInquiryResult> {
  const variant = String(formData.get("variant") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const date = String(formData.get("date") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();
  const hotel = String(formData.get("hotel") || "").trim() || null;
  const room = String(formData.get("room") || "").trim() || null;
  const venue = String(formData.get("venue") || "").trim() || null;
  const guests = String(formData.get("guests") || "").trim() || null;
  const citySlug = String(formData.get("citySlug") || "").trim() || null;

  if (!["custom", "wedding", "hotel"].includes(variant)) {
    return { ok: false, error: "invalid variant" };
  }
  if (!name || !email || !message) {
    return { ok: false, error: "missing fields" };
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      variant,
      name,
      email,
      phone,
      date,
      message,
      hotel,
      room,
      venue,
      guests,
      citySlug,
    },
  });

  try {
    const { notifyInquiryEmails } = await import("@/lib/mail/order-notify");
    await notifyInquiryEmails({
      locale: "vi",
      variant,
      name,
      email,
      phone,
      message,
      citySlug,
      date,
      hotel,
      venue,
      inquiryId: inquiry.id,
    });
  } catch (error) {
    console.error("[inquiry] email notify failed", error);
  }

  return { ok: true };
}
