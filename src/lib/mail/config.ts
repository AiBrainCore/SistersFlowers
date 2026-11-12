/** Zoho Mail / transactional SMTP — server-side only. */

/**
 * Public origin used inside HTML emails (logos + CTA links).
 * Must be a publicly reachable https host — never localhost — so Gmail/Apple Mail can load assets.
 */
export function mailPublicSiteUrl(path = "") {
  const base = (
    process.env.MAIL_PUBLIC_SITE_URL?.trim() ||
    (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")
      ? ""
      : process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
    "https://sistersflowers.vn"
  ).replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${clean}`;
}

export const MAILBOX = {
  info:
    process.env.MAIL_FROM?.trim() ||
    process.env.MAIL_FROM_INFO?.trim() ||
    "info@sistersflowers.vn",
  /** Orders mailbox; falls back to info@ when unset. */
  orders:
    process.env.MAIL_FROM_ORDERS?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    process.env.MAIL_FROM_INFO?.trim() ||
    "info@sistersflowers.vn",
  studioInbox:
    process.env.MAIL_STUDIO_INBOX?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    process.env.MAIL_FROM_INFO?.trim() ||
    "info@sistersflowers.vn",
  fromName: process.env.MAIL_FROM_NAME?.trim() || "Sisters Flowers",
  replyTo:
    process.env.MAIL_REPLY_TO?.trim() ||
    process.env.MAIL_FROM?.trim() ||
    process.env.MAIL_FROM_INFO?.trim() ||
    "info@sistersflowers.vn",
} as const;

/** Future city-specific studio inboxes (unset = studioInbox). */
export function studioInboxForCity(citySlug?: string | null) {
  const slug = (citySlug || "").toLowerCase();
  if (slug === "dalat" || slug === "da-lat") {
    return process.env.MAIL_STUDIO_INBOX_DALAT?.trim() || MAILBOX.studioInbox;
  }
  if (slug === "danang" || slug === "da-nang") {
    return process.env.MAIL_STUDIO_INBOX_DANANG?.trim() || MAILBOX.studioInbox;
  }
  return MAILBOX.studioInbox;
}

/** Always BCC this teammate so they see every outbound system email. */
const MAIL_TEAM_ALWAYS = ["dinhlamhung50@gmail.com"];

/** Team inboxes that receive a BCC of every outbound system email. */
export const MAIL_PREVIEW_TO = Array.from(
  new Set(
    (
      process.env.MAIL_PREVIEW_TO ||
      "felsendorff@gmail.com,butchi0603@gmail.com,dinhlamhung50@gmail.com"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .concat(MAIL_TEAM_ALWAYS),
  ),
);

/** When false (`MAIL_BCC_OWNERS=0`), skip automatic team BCC copies. */
export function mailTeamBccEnabled() {
  return process.env.MAIL_BCC_OWNERS !== "0";
}

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

export type MailIdentity = "info" | "orders";

export function emailSendingEnabled() {
  const raw = (process.env.EMAIL_ENABLED || "false").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function smtpBase() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true"
      : port === 465;
  return { host, port, secure };
}

/** Default / info@ SMTP login. */
export function getSmtpConfig(): SmtpConfig | null {
  return getSmtpConfigFor("info");
}

/** Per-mailbox Zoho auth (orders@ uses its own password when set). */
export function getSmtpConfigFor(identity: MailIdentity = "info"): SmtpConfig | null {
  const { host, port, secure } = smtpBase();
  if (identity === "orders") {
    const user =
      process.env.SMTP_USER_ORDERS?.trim() ||
      process.env.MAIL_FROM_ORDERS?.trim() ||
      process.env.SMTP_USER?.trim();
    const pass =
      process.env.SMTP_PASSWORD_ORDERS?.trim() ||
      process.env.SMTP_PASS_ORDERS?.trim() ||
      process.env.SMTP_PASSWORD?.trim() ||
      process.env.SMTP_PASS?.trim();
    if (!user || !pass) return null;
    return { host, port, secure, user, pass };
  }

  const user = process.env.SMTP_USER?.trim();
  const pass =
    process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  return { host, port, secure, user, pass };
}

export function mailConfigured() {
  return Boolean(getSmtpConfig());
}

export function ordersMailConfigured() {
  return Boolean(getSmtpConfigFor("orders"));
}

export function mailIntegrationStatus(): {
  provider: string;
  from: string;
  ordersFrom: string;
  fromName: string;
  replyTo: string;
  smtpConfigured: boolean;
  ordersSmtpConfigured: boolean;
  sendingEnabled: boolean;
  host: string | null;
  port: number | null;
} {
  const smtp = getSmtpConfig();
  return {
    provider: smtp?.host?.includes("zoho")
      ? "Zoho Mail"
      : smtp
        ? "SMTP"
        : "Not configured",
    from: MAILBOX.info,
    ordersFrom: MAILBOX.orders,
    fromName: MAILBOX.fromName,
    replyTo: MAILBOX.replyTo,
    smtpConfigured: Boolean(smtp),
    ordersSmtpConfigured: ordersMailConfigured(),
    sendingEnabled: emailSendingEnabled(),
    host: smtp?.host || null,
    port: smtp?.port || null,
  };
}
