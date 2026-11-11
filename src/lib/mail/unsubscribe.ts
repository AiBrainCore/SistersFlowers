import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { mailPublicSiteUrl } from "@/lib/mail/config";
import type { Locale } from "@/i18n/config";

function secret() {
  return (
    process.env.MAIL_UNSUBSCRIBE_SECRET ||
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    "dev-mail-unsubscribe-secret"
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Signed token so unsubscribe links cannot be forged for arbitrary addresses. */
export function signUnsubscribeToken(email: string) {
  const normalized = normalizeEmail(email);
  const sig = createHmac("sha256", secret())
    .update(`unsub:${normalized}`)
    .digest("base64url");
  return `${Buffer.from(normalized, "utf8").toString("base64url")}.${sig}`;
}

export function verifyUnsubscribeToken(token: string | null | undefined) {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  let email = "";
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = signUnsubscribeToken(email).split(".")[1];
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return normalizeEmail(email);
}

export function unsubscribeUrl(email: string, locale: Locale = "en") {
  const token = signUnsubscribeToken(email);
  return mailPublicSiteUrl(
    `/${locale}/unsubscribe?token=${encodeURIComponent(token)}`,
  );
}

export async function isEmailSuppressed(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  try {
    const row = await prisma.emailSuppression.findUnique({
      where: { email: normalized },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function suppressEmail(
  email: string,
  source = "unsubscribe_link",
) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return prisma.emailSuppression.upsert({
    where: { email: normalized },
    create: { email: normalized, source },
    update: { source },
  });
}

export const unsubscribeCopy = {
  en: {
    sentTo: (email: string) =>
      `This email was sent to ${email} because you contacted Sisters Flowers or placed an order on our website.`,
    preferNot: "If you would prefer not to receive emails from us in the future, please",
    link: "unsubscribe",
    standalone: "Unsubscribe",
    pageTitle: "Unsubscribe",
    pageBody:
      "You will no longer receive Sisters Flowers marketing or update emails at this address. Order receipts related to an active purchase may still be sent when needed.",
    pageDone: "You are unsubscribed.",
    pageInvalid: "This unsubscribe link is invalid or expired.",
    pageCta: "Back to shop",
  },
  vi: {
    sentTo: (email: string) =>
      `Email này được gửi tới ${email} vì bạn đã liên hệ Sisters Flowers hoặc đặt hàng trên website.`,
    preferNot:
      "Nếu bạn không muốn nhận email từ chúng tôi trong tương lai, vui lòng",
    link: "hủy đăng ký",
    standalone: "Hủy đăng ký",
    pageTitle: "Hủy đăng ký email",
    pageBody:
      "Bạn sẽ không còn nhận email cập nhật / marketing từ Sisters Flowers tại địa chỉ này. Biên nhận đơn hàng đang xử lý vẫn có thể được gửi khi cần.",
    pageDone: "Bạn đã hủy đăng ký.",
    pageInvalid: "Liên kết hủy đăng ký không hợp lệ hoặc đã hết hạn.",
    pageCta: "Về cửa hàng",
  },
} as const;
