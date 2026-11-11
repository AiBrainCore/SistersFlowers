import type { Locale } from "@/i18n/config";

type OrderCustomerCopy = {
  subject: (ref: string) => string;
  preheader: (ref: string) => string;
  heading: string;
  intro: (name: string) => string;
  statusNote: string;
  itemsLabel: string;
  totalLabel: string;
  deliveryLabel: string;
  addressLabel: string;
  phoneLabel: string;
  dateLabel: string;
  notesLabel: string;
  cta: string;
  footer: string;
};

type OrderStudioCopy = {
  subject: (ref: string, name: string) => string;
  preheader: (ref: string) => string;
  heading: string;
  intro: string;
  openAdmin: string;
};

type AuthCopy = {
  welcomeSubject: string;
  welcomeHeading: string;
  welcomeIntro: (name?: string) => string;
  welcomeBody: string;
  verifySubject: string;
  verifyHeading: string;
  verifyIntro: string;
  verifyCta: string;
  verifyHint: string;
};

const orderCustomer: Record<Locale, OrderCustomerCopy> = {
  vi: {
    subject: (ref) => `Sisters Flowers — đã nhận đơn ${ref}`,
    preheader: (ref) => `Cảm ơn bạn. Mã đơn ${ref}.`,
    heading: "Đã nhận đơn của bạn",
    intro: (name) =>
      `Xin chào ${name || "bạn"}, cảm ơn bạn đã đặt hoa tại Sisters Flowers.`,
    statusNote:
      "Studio sẽ sớm xác nhận chi tiết và hướng dẫn thanh toán. Đây chưa phải biên lai thanh toán.",
    itemsLabel: "Sản phẩm",
    totalLabel: "Tạm tính",
    deliveryLabel: "Giao hàng",
    addressLabel: "Địa chỉ",
    phoneLabel: "Điện thoại",
    dateLabel: "Ngày / giờ giao",
    notesLabel: "Ghi chú",
    cta: "Xem cửa hàng",
    footer: "Da Nang & Da Lat · sistersflowers.vn",
  },
  en: {
    subject: (ref) => `Sisters Flowers — order received ${ref}`,
    preheader: (ref) => `Thank you. Reference ${ref}.`,
    heading: "We received your order",
    intro: (name) =>
      `Hi ${name || "there"}, thank you for ordering with Sisters Flowers.`,
    statusNote:
      "The studio will confirm details and arrange payment shortly. This is not a payment receipt yet.",
    itemsLabel: "Items",
    totalLabel: "Subtotal",
    deliveryLabel: "Delivery",
    addressLabel: "Address",
    phoneLabel: "Phone",
    dateLabel: "Delivery date / time",
    notesLabel: "Notes",
    cta: "Browse the shop",
    footer: "Da Nang & Da Lat · sistersflowers.vn",
  },
};

const orderStudio: OrderStudioCopy = {
  subject: (ref, name) => `New order ${ref} — ${name}`,
  preheader: (ref) => `New Sisters Flowers order ${ref}`,
  heading: "New shop order",
  intro: "A customer submitted a new order. Full details below.",
  openAdmin: "Open admin orders",
};

const auth: Record<Locale, AuthCopy> = {
  vi: {
    welcomeSubject: "Chào mừng đến Sisters Flowers",
    welcomeHeading: "Tài khoản đã sẵn sàng",
    welcomeIntro: (name) =>
      `Xin chào ${name || "bạn"}, cảm ơn bạn đã tạo tài khoản Sisters Flowers.`,
    welcomeBody:
      "Bạn có thể lưu đơn hàng, đặt nhanh hơn và theo dõi các bó hoa yêu thích.",
    verifySubject: "Xác nhận email Sisters Flowers",
    verifyHeading: "Xác nhận địa chỉ email",
    verifyIntro:
      "Nhấn nút bên dưới để xác nhận email và kích hoạt tài khoản của bạn.",
    verifyCta: "Xác nhận email",
    verifyHint: "Nếu bạn không tạo tài khoản, hãy bỏ qua thư này.",
  },
  en: {
    welcomeSubject: "Welcome to Sisters Flowers",
    welcomeHeading: "Your account is ready",
    welcomeIntro: (name) =>
      `Hi ${name || "there"}, thank you for joining Sisters Flowers.`,
    welcomeBody:
      "You can save orders, check out faster, and keep your favourite bouquets close.",
    verifySubject: "Confirm your Sisters Flowers email",
    verifyHeading: "Confirm your email",
    verifyIntro: "Tap the button below to verify your email and activate your account.",
    verifyCta: "Confirm email",
    verifyHint: "If you did not create an account, you can ignore this email.",
  },
};

export function orderCustomerCopy(locale: Locale) {
  return orderCustomer[locale] ?? orderCustomer.vi;
}

export function orderStudioCopy() {
  return orderStudio;
}

export function authCopy(locale: Locale) {
  return auth[locale] ?? auth.vi;
}

const statusLabels: Record<Locale, Record<string, string>> = {
  en: {
    accepted: "accepted by the studio",
    ready: "ready for delivery / pickup",
    dispatched: "on the way",
    completed: "completed",
    cancelled: "cancelled",
  },
  vi: {
    accepted: "đã được studio xác nhận",
    ready: "đã sẵn sàng giao / nhận",
    dispatched: "đang trên đường giao",
    completed: "đã hoàn tất",
    cancelled: "đã hủy",
  },
};

export function orderStatusCopy(locale: Locale, status: string) {
  const label =
    statusLabels[locale]?.[status] ||
    statusLabels.en[status] ||
    status;
  if (locale === "en") {
    return {
      subject: (ref: string) => `Sisters Flowers — order ${ref} update`,
      heading: "Order status update",
      intro: (name: string) =>
        `Hi ${name || "there"}, your order is now ${label}.`,
      support: "Questions? Reply to this email or write info@sistersflowers.vn.",
      footer: "Da Nang & Da Lat · sistersflowers.vn",
    };
  }
  return {
    subject: (ref: string) => `Sisters Flowers — cập nhật đơn ${ref}`,
    heading: "Cập nhật trạng thái đơn",
    intro: (name: string) =>
      `Xin chào ${name || "bạn"}, đơn hàng của bạn hiện ${label}.`,
    support: "Cần hỗ trợ? Trả lời email này hoặc liên hệ info@sistersflowers.vn.",
    footer: "Đà Nẵng & Đà Lạt · sistersflowers.vn",
  };
}

export function inquiryCopy(locale: Locale) {
  if (locale === "en") {
    return {
      ackSubject: "We received your Sisters Flowers request",
      ackHeading: "Thank you for writing",
      ackIntro: (name: string) =>
        `Hi ${name || "there"}, we received your request and will reply soon.`,
      ackBody: "Our studio team reads every message. WhatsApp remains available for urgent arrangements.",
      studioSubject: (variant: string, name: string) =>
        `New ${variant} inquiry — ${name}`,
      studioHeading: "New customer inquiry",
    };
  }
  return {
    ackSubject: "Sisters Flowers đã nhận yêu cầu của bạn",
    ackHeading: "Cảm ơn bạn đã liên hệ",
    ackIntro: (name: string) =>
      `Xin chào ${name || "bạn"}, chúng tôi đã nhận yêu cầu và sẽ phản hồi sớm.`,
    ackBody:
      "Studio đọc mọi tin nhắn. Nếu cần gấp, bạn vẫn có thể nhắn WhatsApp.",
    studioSubject: (variant: string, name: string) =>
      `Yêu cầu ${variant} mới — ${name}`,
    studioHeading: "Yêu cầu khách hàng mới",
  };
}

export function formatVnd(amount: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ₫`;
  }
}
