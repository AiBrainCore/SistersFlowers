import { formatVnd } from "@/data/products";

export type CheckoutItem = {
  slug: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  kind?: "product" | "addon";
  note?: string;
  addonKind?: "extra" | "partner";
  partnerName?: string;
  commissionPercent?: number;
  validityDays?: number;
};

export type CheckoutPayload = {
  locale: "en" | "vi";
  customerName: string;
  phone: string;
  email?: string;
  zone: string;
  deliveryKm?: number;
  deliveryFee?: number;
  address: string;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  recipientName?: string;
  hotelName?: string;
  roomNumber?: string;
  items: CheckoutItem[];
};

export type IssuedVoucherLine = {
  code: string;
  name: string;
  partnerName: string;
  faceValue: number;
  expiresAt: Date | null;
};

export function makeOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(Math.random() * 36 ** 2)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `SF-${stamp}${rand}`;
}

export function orderSubtotal(items: CheckoutItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function buildWhatsAppUrl(
  reference: string,
  payload: CheckoutPayload,
  vouchers: IssuedVoucherLine[] = [],
) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const lines = [
    `Sisters Flowers order ${reference}`,
    `Name: ${payload.customerName}`,
    `Phone: ${payload.phone}`,
    payload.email ? `Email: ${payload.email}` : null,
    `Zone: ${payload.zone}`,
    payload.deliveryKm != null ? `Distance: ${payload.deliveryKm} km` : null,
    payload.deliveryFee != null
      ? `Delivery fee: ${formatVnd(payload.deliveryFee, payload.locale)}`
      : "Delivery fee: to quote",
    `Address: ${payload.address}`,
    payload.deliveryDate ? `Date: ${payload.deliveryDate}` : null,
    payload.deliveryTime ? `Time: ${payload.deliveryTime}` : null,
    payload.recipientName ? `Recipient: ${payload.recipientName}` : null,
    payload.hotelName ? `Hotel: ${payload.hotelName}` : null,
    payload.roomNumber ? `Room: ${payload.roomNumber}` : null,
    "",
    "Bouquets & extras:",
    ...payload.items.map((item) => {
      const tag =
        item.kind === "addon"
          ? item.addonKind === "partner"
            ? "voucher"
            : "extra"
          : "bouquet";
      const note = item.note ? ` — “${item.note}”` : "";
      const partner = item.partnerName ? ` (${item.partnerName})` : "";
      return `- [${tag}] ${item.qty}x ${item.name}${partner} (${formatVnd(item.price, payload.locale)})${note}`;
    }),
    "",
    `Subtotal: ${formatVnd(orderSubtotal(payload.items), payload.locale)}`,
    payload.deliveryFee != null
      ? `Delivery: ${formatVnd(payload.deliveryFee, payload.locale)}`
      : null,
    `Total est.: ${formatVnd(
      orderSubtotal(payload.items) + (payload.deliveryFee ?? 0),
      payload.locale,
    )}`,
    payload.notes ? `Notes: ${payload.notes}` : null,
  ].filter(Boolean) as string[];

  if (vouchers.length) {
    lines.push("", "Voucher codes (show at partner):");
    for (const voucher of vouchers) {
      const expiry = voucher.expiresAt
        ? ` · valid until ${voucher.expiresAt.toISOString().slice(0, 10)}`
        : "";
      const partner = voucher.partnerName ? ` @ ${voucher.partnerName}` : "";
      lines.push(
        `- ${voucher.code}: ${formatVnd(voucher.faceValue, payload.locale)}${partner}${expiry}`,
      );
    }
    lines.push("Partner checks code at /voucher");
  }

  const text = encodeURIComponent(lines.join("\n"));
  if (!number) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${number}?text=${text}`;
}

export function validateCheckout(payload: CheckoutPayload) {
  const errors: string[] = [];
  if (!payload.customerName.trim()) errors.push("name");
  if (!payload.phone.trim()) errors.push("phone");
  if (!payload.zone.trim()) errors.push("zone");
  if (!payload.address.trim()) errors.push("address");
  if (!payload.items.length) errors.push("items");
  return errors;
}
