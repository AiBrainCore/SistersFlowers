/**
 * Internal order receipt / confirmation — NOT a Vietnamese e-invoice (hóa đơn điện tử).
 * Legal e-invoice integration is a separate future module.
 */

export type ReceiptLine = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderReceipt = {
  kind: "order_confirmation";
  /** Explicit: this is not a tax e-invoice */
  isLegalEInvoice: false;
  businessName: string;
  branchLabel?: string | null;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  paymentReference?: string | null;
  lines: ReceiptLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: "VND";
};

export function buildOrderReceipt(input: {
  businessName?: string;
  branchLabel?: string | null;
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  paymentReference?: string | null;
  lines: Array<{ name: string; qty: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  tax?: number;
  total: number;
}): OrderReceipt {
  const lines: ReceiptLine[] = input.lines.map((l) => ({
    name: l.name,
    qty: Math.max(1, Math.round(l.qty)),
    unitPrice: Math.round(l.price),
    lineTotal: Math.round(l.price) * Math.max(1, Math.round(l.qty)),
  }));
  return {
    kind: "order_confirmation",
    isLegalEInvoice: false,
    businessName: input.businessName || "Sisters Flowers",
    branchLabel: input.branchLabel || null,
    orderNumber: input.orderNumber,
    createdAt:
      typeof input.createdAt === "string"
        ? input.createdAt
        : input.createdAt.toISOString(),
    customerName: input.customerName,
    paymentMethod: input.paymentMethod || null,
    paymentStatus: input.paymentStatus,
    paymentReference: input.paymentReference || null,
    lines,
    subtotal: Math.round(input.subtotal),
    deliveryFee: Math.round(input.deliveryFee),
    discount: Math.round(input.discount || 0),
    tax: Math.round(input.tax || 0),
    total: Math.round(input.total),
    currency: "VND",
  };
}
