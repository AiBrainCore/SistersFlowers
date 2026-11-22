import type { Locale } from "@/i18n/config";

type OrderCustomerCopy = {
  subject: (ref: string) => string;
  preheader: (ref: string) => string;
  heading: string;
  /** name, optional branch/city label for body copy */
  intro: (name: string, branch?: string | null) => string;
  statusNote: string;
  branchLabel: string;
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
  heading: (branch?: string | null) => string;
  intro: (branch?: string | null) => string;
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
    intro: (name, branch) =>
      branch
        ? `Xin chào ${name || "bạn"}, cảm ơn bạn đã đặt hoa tại Sisters Flowers — chi nhánh ${branch}.`
        : `Xin chào ${name || "bạn"}, cảm ơn bạn đã đặt hoa tại Sisters Flowers.`,
    statusNote:
      "Thanh toán đủ bằng VietQR trên trang thanh toán. Khi studio thấy tiền vào tài khoản, họ xác nhận và bắt đầu làm hoa — đơn online không nhận trả trước một phần. Nếu cần gấp — nhắn Zalo hoặc WhatsApp.",
    branchLabel: "Chi nhánh",
    itemsLabel: "Sản phẩm",
    totalLabel: "Tạm tính",
    deliveryLabel: "Giao hàng",
    addressLabel: "Địa chỉ",
    phoneLabel: "Điện thoại",
    dateLabel: "Ngày / giờ giao",
    notesLabel: "Ghi chú",
    cta: "Xem đơn hàng",
    footer: "Đà Nẵng & Đà Lạt · sistersflowers.vn",
  },
  en: {
    subject: (ref) => `Sisters Flowers — order received ${ref}`,
    preheader: (ref) => `Thank you. Reference ${ref}.`,
    heading: "We received your order",
    intro: (name, branch) =>
      branch
        ? `Hi ${name || "there"}, thank you for ordering with Sisters Flowers — ${branch} branch.`
        : `Hi ${name || "there"}, thank you for ordering with Sisters Flowers.`,
    statusNote:
      "Pay the full amount with the VietQR on your pay page. When the studio sees the transfer in their bank, they confirm and start your bouquet — no deposit / partial pay for online shop orders. For anything urgent, message Zalo or WhatsApp.",
    branchLabel: "Branch",
    itemsLabel: "Items",
    totalLabel: "Subtotal",
    deliveryLabel: "Delivery",
    addressLabel: "Address",
    phoneLabel: "Phone",
    dateLabel: "Delivery date / time",
    notesLabel: "Notes",
    cta: "View your order",
    footer: "Da Nang & Da Lat · sistersflowers.vn",
  },
};

const orderStudio: OrderStudioCopy = {
  subject: (ref, name) => `New order ${ref} — ${name}`,
  preheader: (ref) => `New Sisters Flowers order ${ref}`,
  heading: (branch) =>
    branch ? `New shop order — ${branch}` : "New shop order",
  intro: (branch) =>
    branch
      ? `A customer submitted a new order for the ${branch} branch. Full details below — do not mix with the other city.`
      : "A customer submitted a new order. Full details below.",
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

const statusCopy: Record<
  Locale,
  Record<
    string,
    {
      subject: (ref: string) => string;
      heading: string;
      intro: (name: string, branch?: string | null) => string;
      support: string;
    }
  >
> = {
  en: {
    accepted: {
      subject: (ref) => `Sisters Flowers — order ${ref} accepted`,
      heading: "Order accepted",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, the ${branch} studio accepted your order and will prepare it after payment is complete.`
          : `Hi ${name || "there"}, the studio accepted your order and will prepare it after payment is complete.`,
      support:
        "Questions? Reply to this email, or message us on Zalo or WhatsApp for anything urgent.",
    },
    payment_accepted: {
      subject: (ref) => `Sisters Flowers — payment received ${ref}`,
      heading: "Payment received",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, we received your full payment for order at ${branch}. The studio is starting your bouquet now.`
          : `Hi ${name || "there"}, we received your full payment. The studio is starting your bouquet now.`,
      support:
        "This confirms the transfer — not a VAT invoice. Questions? Reply or message Zalo / WhatsApp.",
    },
    ready: {
      subject: (ref) => `Sisters Flowers — order ${ref} ready`,
      heading: "Your order is ready",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your ${branch} order is ready.`
          : `Hi ${name || "there"}, your order is ready.`,
      support:
        "Questions? Reply to this email, or message us on Zalo or WhatsApp for anything urgent.",
    },
    ready_pickup: {
      subject: (ref) => `Sisters Flowers — ready for pickup ${ref}`,
      heading: "Ready for pickup",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your bouquet is ready at the ${branch} studio — you can collect it now.`
          : `Hi ${name || "there"}, your bouquet is ready at the studio — you can collect it now.`,
      support:
        "Bring your order reference when you arrive. Questions? Zalo or WhatsApp.",
    },
    ready_ship: {
      subject: (ref) => `Sisters Flowers — ready to deliver ${ref}`,
      heading: "Ready for delivery",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your ${branch} bouquet is packed and ready — we are arranging delivery.`
          : `Hi ${name || "there"}, your bouquet is packed and ready — we are arranging delivery.`,
      support:
        "You will get another note when it is on the way. Questions? Zalo or WhatsApp.",
    },
    dispatched: {
      subject: (ref) => `Sisters Flowers — on the way ${ref}`,
      heading: "On the way",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your ${branch} order is out for delivery.`
          : `Hi ${name || "there"}, your order is out for delivery.`,
      support:
        "Questions? Reply to this email, or message us on Zalo or WhatsApp for anything urgent.",
    },
    completed: {
      subject: (ref) => `Sisters Flowers — order ${ref} completed`,
      heading: "Order completed",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your ${branch} order is complete. Thank you.`
          : `Hi ${name || "there"}, your order is complete. Thank you.`,
      support:
        "Questions? Reply to this email, or message us on Zalo or WhatsApp for anything urgent.",
    },
    cancelled: {
      subject: (ref) => `Sisters Flowers — order ${ref} cancelled`,
      heading: "Order cancelled",
      intro: (name, branch) =>
        branch
          ? `Hi ${name || "there"}, your ${branch} order was cancelled.`
          : `Hi ${name || "there"}, your order was cancelled.`,
      support:
        "Questions? Reply to this email, or message us on Zalo or WhatsApp for anything urgent.",
    },
  },
  vi: {
    accepted: {
      subject: (ref) => `Sisters Flowers — đã nhận đơn ${ref}`,
      heading: "Đơn đã được nhận",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, studio ${branch} đã nhận đơn và sẽ làm hoa sau khi thanh toán đủ.`
          : `Xin chào ${name || "bạn"}, studio đã nhận đơn và sẽ làm hoa sau khi thanh toán đủ.`,
      support:
        "Cần hỗ trợ? Trả lời email này, hoặc nếu gấp — nhắn Zalo hoặc WhatsApp.",
    },
    payment_accepted: {
      subject: (ref) => `Sisters Flowers — đã nhận thanh toán ${ref}`,
      heading: "Đã nhận thanh toán",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, chúng tôi đã nhận đủ thanh toán cho đơn ${branch}. Studio bắt đầu làm bó hoa ngay.`
          : `Xin chào ${name || "bạn"}, chúng tôi đã nhận đủ thanh toán. Studio bắt đầu làm bó hoa ngay.`,
      support:
        "Đây là xác nhận chuyển khoản — chưa phải hóa đơn VAT. Cần hỗ trợ? Zalo / WhatsApp.",
    },
    ready: {
      subject: (ref) => `Sisters Flowers — đơn ${ref} sẵn sàng`,
      heading: "Đơn đã sẵn sàng",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, đơn ${branch} của bạn đã sẵn sàng.`
          : `Xin chào ${name || "bạn"}, đơn hàng của bạn đã sẵn sàng.`,
      support:
        "Cần hỗ trợ? Trả lời email này, hoặc nếu gấp — nhắn Zalo hoặc WhatsApp.",
    },
    ready_pickup: {
      subject: (ref) => `Sisters Flowers — sẵn sàng nhận ${ref}`,
      heading: "Sẵn sàng nhận tại studio",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, bó hoa đã sẵn sàng tại studio ${branch} — bạn có thể đến nhận.`
          : `Xin chào ${name || "bạn"}, bó hoa đã sẵn sàng tại studio — bạn có thể đến nhận.`,
      support: "Mang theo mã đơn khi đến. Cần hỗ trợ? Zalo hoặc WhatsApp.",
    },
    ready_ship: {
      subject: (ref) => `Sisters Flowers — sẵn sàng giao ${ref}`,
      heading: "Sẵn sàng giao hàng",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, bó hoa ${branch} đã đóng gói xong — chúng tôi đang sắp xếp giao.`
          : `Xin chào ${name || "bạn"}, bó hoa đã đóng gói xong — chúng tôi đang sắp xếp giao.`,
      support:
        "Bạn sẽ nhận thêm tin khi đơn đang trên đường. Cần hỗ trợ? Zalo / WhatsApp.",
    },
    dispatched: {
      subject: (ref) => `Sisters Flowers — đang giao ${ref}`,
      heading: "Đang trên đường giao",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, đơn ${branch} đang được giao.`
          : `Xin chào ${name || "bạn"}, đơn hàng đang được giao.`,
      support:
        "Cần hỗ trợ? Trả lời email này, hoặc nếu gấp — nhắn Zalo hoặc WhatsApp.",
    },
    completed: {
      subject: (ref) => `Sisters Flowers — hoàn tất ${ref}`,
      heading: "Đơn đã hoàn tất",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, đơn ${branch} đã hoàn tất. Cảm ơn bạn.`
          : `Xin chào ${name || "bạn"}, đơn hàng đã hoàn tất. Cảm ơn bạn.`,
      support:
        "Cần hỗ trợ? Trả lời email này, hoặc nếu gấp — nhắn Zalo hoặc WhatsApp.",
    },
    cancelled: {
      subject: (ref) => `Sisters Flowers — đã hủy ${ref}`,
      heading: "Đơn đã hủy",
      intro: (name, branch) =>
        branch
          ? `Xin chào ${name || "bạn"}, đơn ${branch} đã được hủy.`
          : `Xin chào ${name || "bạn"}, đơn hàng đã được hủy.`,
      support:
        "Cần hỗ trợ? Trả lời email này, hoặc nếu gấp — nhắn Zalo hoặc WhatsApp.",
    },
  },
};

export function orderStatusCopy(locale: Locale, status: string) {
  const pack =
    statusCopy[locale]?.[status] ||
    statusCopy.en[status] ||
    statusCopy.en.accepted;
  return {
    ...pack,
    footer:
      locale === "vi"
        ? "Đà Nẵng & Đà Lạt · sistersflowers.vn"
        : "Da Nang & Da Lat · sistersflowers.vn",
  };
}

export function inquiryCopy(locale: Locale) {
  if (locale === "en") {
    return {
      ackSubject: "We received your Sisters Flowers request",
      ackHeading: "Thank you for writing",
      ackIntro: (name: string, branch?: string | null) =>
        branch
          ? `Hi ${name || "there"}, we received your request for our ${branch} studio and will reply soon.`
          : `Hi ${name || "there"}, we received your request and will reply soon.`,
      ackBody:
        "Our studio team reads every message. For anything urgent, message us on Zalo or WhatsApp.",
      studioSubject: (variant: string, name: string) =>
        `New ${variant} inquiry — ${name}`,
      studioHeading: (branch?: string | null) =>
        branch ? `New customer inquiry — ${branch}` : "New customer inquiry",
    };
  }
  return {
    ackSubject: "Sisters Flowers đã nhận yêu cầu của bạn",
    ackHeading: "Cảm ơn bạn đã liên hệ",
    ackIntro: (name: string, branch?: string | null) =>
      branch
        ? `Xin chào ${name || "bạn"}, chúng tôi đã nhận yêu cầu cho studio ${branch} và sẽ phản hồi sớm.`
        : `Xin chào ${name || "bạn"}, chúng tôi đã nhận yêu cầu và sẽ phản hồi sớm.`,
    ackBody:
      "Studio đọc mọi tin nhắn. Nếu cần gấp, hãy nhắn Zalo hoặc WhatsApp.",
    studioSubject: (variant: string, name: string) =>
      `Yêu cầu ${variant} mới — ${name}`,
    studioHeading: (branch?: string | null) =>
      branch ? `Yêu cầu khách hàng mới — ${branch}` : "Yêu cầu khách hàng mới",
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
