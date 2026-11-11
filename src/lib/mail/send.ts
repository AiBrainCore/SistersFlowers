import nodemailer from "nodemailer";
import {
  getSmtpConfig,
  MAILBOX,
  mailConfigured,
} from "@/lib/mail/config";

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  /** Defaults to info@ */
  from?: "info" | "orders" | string;
  replyTo?: string;
  bcc?: string | string[];
};

export type SendMailResult =
  | { ok: true; messageId?: string; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

function resolveFrom(from?: SendMailInput["from"]) {
  if (!from || from === "info") {
    return { address: MAILBOX.info, name: "Sisters Flowers" };
  }
  if (from === "orders") {
    return { address: MAILBOX.orders, name: "Sisters Flowers Orders" };
  }
  return { address: from, name: "Sisters Flowers" };
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn("[mail] SMTP not configured — skipping send:", input.subject);
    return { ok: true, skipped: true, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  const from = resolveFrom(input.from);
  try {
    const info = await transporter.sendMail({
      from: `"${from.name}" <${from.address}>`,
      to: input.to,
      bcc: input.bcc,
      replyTo: input.replyTo || from.address,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[mail] send failed:", message);
    return { ok: false, error: message };
  }
}

export { mailConfigured };
