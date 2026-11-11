import nodemailer from "nodemailer";
import {
  emailSendingEnabled,
  getSmtpConfigFor,
  MAILBOX,
  mailConfigured,
  type MailIdentity,
} from "@/lib/mail/config";
import { mailInlineAttachments } from "@/lib/mail/attachments";
import { isEmailSuppressed } from "@/lib/mail/unsubscribe";
import {
  sanitizeEmailList,
  sanitizeHeaderValue,
} from "@/lib/mail/validate";
import { prisma } from "@/lib/db";

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Defaults to official info@ identity */
  from?: "info" | "orders" | string;
  replyTo?: string;
  bcc?: string | string[];
  /** Optional event key for dedupe / admin logs */
  eventKey?: string;
  relatedType?: string;
  relatedId?: string;
  /** City for studio-specific social WhatsApp + CID assets */
  citySlug?: string | null;
  /** Skip embedding logo/social CID assets (HTML preview only) */
  skipInlineAssets?: boolean;
  /**
   * When false, honor EmailSuppression (welcome / marketing).
   * Order receipts and studio alerts should keep the default true.
   */
  transactional?: boolean;
};

export type SendMailResult =
  | { ok: true; messageId?: string; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

function resolveFrom(from?: SendMailInput["from"]) {
  if (!from || from === "info") {
    return { address: MAILBOX.info, name: MAILBOX.fromName };
  }
  if (from === "orders") {
    return {
      address: MAILBOX.orders,
      name: `${MAILBOX.fromName}`,
    };
  }
  return { address: from, name: MAILBOX.fromName };
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function recordDelivery(input: {
  eventKey?: string;
  relatedType?: string;
  relatedId?: string;
  to: string;
  subject: string;
  status: string;
  providerId?: string | null;
  error?: string | null;
}) {
  try {
    await prisma.emailDeliveryLog.create({
      data: {
        eventKey: input.eventKey || null,
        relatedType: input.relatedType || null,
        relatedId: input.relatedId || null,
        toAddress: input.to,
        subject: input.subject.slice(0, 250),
        status: input.status,
        providerId: input.providerId || null,
        error: input.error ? input.error.slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.warn("[mail] delivery log write failed", error);
  }
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const to = sanitizeEmailList(input.to);
  const bcc = sanitizeEmailList(input.bcc);
  const subject = sanitizeHeaderValue(input.subject, 200);
  const replyTo =
    sanitizeEmailList(input.replyTo || MAILBOX.replyTo)[0] || MAILBOX.replyTo;

  if (!to.length) {
    return { ok: false, error: "invalid_recipient" };
  }
  if (!subject) {
    return { ok: false, error: "invalid_subject" };
  }

  if (input.eventKey) {
    try {
      const prior = await prisma.emailDeliveryLog.findFirst({
        where: { eventKey: input.eventKey, status: "sent" },
      });
      if (prior) {
        return { ok: true, skipped: true, reason: "duplicate_event" };
      }
    } catch {
      // table may not exist yet during migrate — continue
    }
  }

  const transactional = input.transactional !== false;
  if (!transactional) {
    const suppressed: string[] = [];
    for (const address of to) {
      if (await isEmailSuppressed(address)) suppressed.push(address);
    }
    if (suppressed.length === to.length) {
      await recordDelivery({
        eventKey: input.eventKey,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        to: to.join(","),
        subject,
        status: "skipped_unsubscribed",
      });
      return { ok: true, skipped: true, reason: "unsubscribed" };
    }
  }

  if (!emailSendingEnabled()) {
    console.warn("[mail] EMAIL_ENABLED=false — skipping:", subject);
    await recordDelivery({
      eventKey: input.eventKey,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      to: to.join(","),
      subject,
      status: "skipped_disabled",
    });
    return { ok: true, skipped: true, reason: "email_disabled" };
  }

  const identity: MailIdentity = input.from === "orders" ? "orders" : "info";
  const smtp = getSmtpConfigFor(identity);
  if (!smtp) {
    console.warn("[mail] SMTP not configured — skipping:", subject);
    await recordDelivery({
      eventKey: input.eventKey,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      to: to.join(","),
      subject,
      status: "skipped_no_smtp",
    });
    return { ok: true, skipped: true, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });

  const from = resolveFrom(input.from);
  const attachments = input.skipInlineAssets
    ? undefined
    : mailInlineAttachments(input.citySlug);
  try {
    const info = await transporter.sendMail({
      from: `"${sanitizeHeaderValue(from.name, 80)}" <${from.address}>`,
      to,
      bcc: bcc.length ? bcc : undefined,
      replyTo,
      subject,
      html: input.html,
      text: input.text || htmlToText(input.html),
      attachments,
    });
    await recordDelivery({
      eventKey: input.eventKey,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      to: to.join(","),
      subject,
      status: "sent",
      providerId: info.messageId || null,
    });
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Never log SMTP auth secrets — message from nodemailer is usually safe.
    console.error("[mail] send failed:", message.replace(smtp.pass, "***"));
    await recordDelivery({
      eventKey: input.eventKey,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      to: to.join(","),
      subject,
      status: "failed",
      error: message,
    });
    return { ok: false, error: message };
  }
}

export { mailConfigured };
