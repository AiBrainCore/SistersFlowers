"use server";

import { prisma } from "@/lib/db";
import {
  buildWhatsAppUrl,
  makeOrderReference,
  orderSubtotal,
  validateCheckout,
  type CheckoutPayload,
  type IssuedVoucherLine,
} from "@/lib/orders";
import { commissionAmount } from "@/lib/addons";
import { makeVoucherCode, remitToPartner } from "@/lib/vouchers";

export type SubmitOrderResult =
  | { ok: true; reference: string; whatsappUrl: string }
  | { ok: false; error: string };

export async function submitOrderAction(
  payload: CheckoutPayload,
): Promise<SubmitOrderResult> {
  const errors = validateCheckout(payload);
  if (errors.length) {
    return { ok: false, error: `Missing: ${errors.join(", ")}` };
  }

  const reference = makeOrderReference();
  const subtotal = orderSubtotal(payload.items);
  const deliveryFee = payload.deliveryFee ?? null;
  const deliveryTotal = subtotal + (deliveryFee ?? 0);

  type ItemCreate = {
    slug: string;
    name: string;
    price: number;
    qty: number;
    image: string;
    kind: string;
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

  for (const item of payload.items) {
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
      note: item.note || null,
      partnerName: item.partnerName || null,
      commissionPercent,
      commissionAmount: commissionAmountValue,
    });
  }

  const whatsappUrl = buildWhatsAppUrl(reference, payload, issuedVouchers);

  await prisma.order.create({
    data: {
      reference,
      locale: payload.locale,
      customerName: payload.customerName.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      zone: payload.zone.trim(),
      deliveryKm: payload.deliveryKm ?? null,
      deliveryFee,
      address: payload.address.trim(),
      deliveryDate: payload.deliveryDate?.trim() || null,
      deliveryTime: payload.deliveryTime?.trim() || null,
      notes: payload.notes?.trim() || null,
      recipientName: payload.recipientName?.trim() || null,
      hotelName: payload.hotelName?.trim() || null,
      roomNumber: payload.roomNumber?.trim() || null,
      subtotal,
      deliveryTotal,
      whatsappUrl,
      items: { create: itemsData },
    },
  });

  return { ok: true, reference, whatsappUrl };
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

  if (!["custom", "wedding", "hotel"].includes(variant)) {
    return { ok: false, error: "invalid variant" };
  }
  if (!name || !email || !message) {
    return { ok: false, error: "missing fields" };
  }

  await prisma.inquiry.create({
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
    },
  });

  return { ok: true };
}
