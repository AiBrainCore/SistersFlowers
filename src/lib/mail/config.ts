/** Transactional mail addresses + SMTP (Hostinger / CloudPanel / custom). */

export const MAILBOX = {
  info: process.env.MAIL_FROM_INFO || "info@sistersflowers.vn",
  orders: process.env.MAIL_FROM_ORDERS || "orders@sistersflowers.vn",
  studioInbox: process.env.MAIL_STUDIO_INBOX || "orders@sistersflowers.vn",
} as const;

export const MAIL_PREVIEW_TO = (
  process.env.MAIL_PREVIEW_TO ||
  "felsendorff@gmail.com,butchi0603@gmail.com"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true"
      : port === 465;
  return { host, port, secure, user, pass };
}

export function mailConfigured() {
  return Boolean(getSmtpConfig());
}
