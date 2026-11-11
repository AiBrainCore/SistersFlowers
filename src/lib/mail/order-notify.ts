import { MAILBOX, MAIL_PREVIEW_TO } from "@/lib/mail/config";
import { sendMail } from "@/lib/mail/send";
import {
  buildOrderCustomerEmail,
  buildOrderStudioEmail,
  type OrderMailPayload,
} from "@/lib/mail/templates";

/**
 * Fire-and-forget safe: callers may await but failures must not break checkout.
 */
export async function notifyOrderEmails(payload: OrderMailPayload) {
  const customer = buildOrderCustomerEmail(payload);
  const studio = buildOrderStudioEmail(payload);
  const results = [];

  if (payload.email) {
    results.push(
      await sendMail({
        to: payload.email,
        from: "orders",
        subject: customer.subject,
        html: customer.html,
        replyTo: MAILBOX.info,
      }),
    );
  }

  results.push(
    await sendMail({
      to: MAILBOX.studioInbox,
      from: "orders",
      subject: studio.subject,
      html: studio.html,
      replyTo: payload.email || MAILBOX.info,
      // While validating deliverability, also BCC the owners.
      bcc:
        process.env.MAIL_BCC_OWNERS === "0" ? undefined : MAIL_PREVIEW_TO,
    }),
  );

  return results;
}
