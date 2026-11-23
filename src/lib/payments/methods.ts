/**
 * Canonical payment method catalog — display + capability flags.
 * Live selectability also requires PaymentMethodSetting + provider readiness.
 */

export type PaymentMethodId =
  | "vietqr"
  | "payos"
  | "momo"
  | "zalopay"
  | "card"
  | "paypal"
  | "cash_pickup"
  | "cod"
  | "whatsapp";

export type PaymentMethodDef = {
  id: PaymentMethodId;
  nameEn: string;
  nameVi: string;
  /** Default coming-soon until admin enables + provider ready */
  defaultComingSoon: boolean;
  defaultEnabled: boolean;
  sortOrder: number;
  /** Public brand mark under /public/brand/payments/ */
  icon: string;
  provider: "vietqr" | "payos" | "stub" | "manual" | "whatsapp";
};

export const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: "vietqr",
    /** One QR — bank apps and MoMo Quét QR (no separate MoMo merchant QR). */
    nameEn: "VietQR — banks & MoMo",
    nameVi: "VietQR — ngân hàng & MoMo",
    defaultComingSoon: false,
    defaultEnabled: true,
    sortOrder: 10,
    icon: "/brand/payments/vietqr.svg",
    provider: "vietqr",
  },
  {
    id: "payos",
    nameEn: "payOS",
    nameVi: "payOS",
    defaultComingSoon: true,
    defaultEnabled: false,
    sortOrder: 20,
    icon: "/brand/payments/payos.svg",
    provider: "payos",
  },
  {
    id: "momo",
    nameEn: "MoMo",
    nameVi: "MoMo",
    defaultComingSoon: true,
    defaultEnabled: false,
    sortOrder: 30,
    icon: "/brand/payments/momo.svg",
    provider: "stub",
  },
  {
    id: "zalopay",
    nameEn: "ZaloPay",
    nameVi: "ZaloPay",
    defaultComingSoon: true,
    defaultEnabled: false,
    sortOrder: 40,
    icon: "/brand/payments/zalopay.svg",
    provider: "stub",
  },
  {
    id: "card",
    nameEn: "Visa / Mastercard",
    nameVi: "Visa / Mastercard",
    defaultComingSoon: true,
    defaultEnabled: false,
    sortOrder: 50,
    icon: "/brand/payments/card.svg",
    provider: "stub",
  },
  {
    id: "paypal",
    nameEn: "PayPal",
    nameVi: "PayPal",
    defaultComingSoon: true,
    defaultEnabled: false,
    sortOrder: 60,
    icon: "/brand/payments/paypal.svg",
    provider: "stub",
  },
  {
    id: "cash_pickup",
    nameEn: "Cash at pickup",
    nameVi: "Tiền mặt khi nhận tại studio",
    defaultComingSoon: false,
    defaultEnabled: true,
    sortOrder: 70,
    icon: "/brand/payments/cash.svg",
    provider: "manual",
  },
  {
    id: "cod",
    nameEn: "Cash on delivery",
    nameVi: "Thanh toán khi giao",
    defaultComingSoon: false,
    defaultEnabled: true,
    sortOrder: 80,
    icon: "/brand/payments/cod.svg",
    provider: "manual",
  },
  {
    id: "whatsapp",
    nameEn: "Chat Zalo / WhatsApp (not a payment)",
    nameVi: "Chat Zalo / WhatsApp (không phải thanh toán)",
    defaultComingSoon: false,
    /** Disabled: shop pays via VietQR; guests contact studio on Zalo or WhatsApp. */
    defaultEnabled: false,
    sortOrder: 90,
    icon: "/brand/payments/whatsapp.svg",
    provider: "whatsapp",
  },
];

export function paymentMethodDef(id: string) {
  return PAYMENT_METHODS.find((m) => m.id === id) || null;
}
