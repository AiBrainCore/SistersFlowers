import { MAILBOX, MAIL_PREVIEW_TO, studioInboxForCity } from "@/lib/mail/config";
import { sendMail } from "@/lib/mail/send";
import {
  buildInquiryAckEmail,
  buildInquiryStudioEmail,
  buildOrderCustomerEmail,
  buildOrderStatusEmail,
  buildOrderStudioEmail,
  type InquiryMailPayload,
  type OrderMailPayload,
} from "@/lib/mail/templates";

/**
 * Fire-and-forget safe: callers may await but failures must not break checkout.
 * WhatsApp confirmation flow remains the primary customer channel.
 */
export async function notifyOrderEmails(
  payload: OrderMailPayload & { orderId?: string; citySlug?: string | null },
) {
  const customer = buildOrderCustomerEmail(payload);
  const studio = buildOrderStudioEmail(payload);
  const results = [];
  const studioTo = studioInboxForCity(payload.citySlug);

  if (payload.email) {
    results.push(
      await sendMail({
        to: payload.email,
        from: "orders",
        subject: customer.subject,
        html: customer.html,
        replyTo: MAILBOX.replyTo,
        citySlug: payload.citySlug,
        transactional: true,
        eventKey: payload.orderId
          ? `order:${payload.orderId}:received:customer`
          : `order-ref:${payload.reference}:received:customer`,
        relatedType: "order",
        relatedId: payload.orderId || payload.reference,
      }),
    );
  }

  results.push(
    await sendMail({
      to: studioTo,
      from: "orders",
      subject: studio.subject,
      html: studio.html,
      replyTo: payload.email || MAILBOX.replyTo,
      bcc: process.env.MAIL_BCC_OWNERS === "0" ? undefined : MAIL_PREVIEW_TO,
      citySlug: payload.citySlug,
      transactional: true,
      eventKey: payload.orderId
        ? `order:${payload.orderId}:received:studio`
        : `order-ref:${payload.reference}:received:studio`,
      relatedType: "order",
      relatedId: payload.orderId || payload.reference,
    }),
  );

  return results;
}

export async function notifyOrderStatusEmail(input: {
  orderId: string;
  reference: string;
  locale: "en" | "vi";
  status: string;
  customerName: string;
  email?: string | null;
  citySlug?: string | null;
}) {
  const customerFacing = ["accepted", "ready", "dispatched", "completed", "cancelled"];
  if (!customerFacing.includes(input.status) || !input.email) return null;

  const mail = buildOrderStatusEmail({
    locale: input.locale,
    reference: input.reference,
    customerName: input.customerName,
    status: input.status,
    citySlug: input.citySlug,
    email: input.email,
  });

  return sendMail({
    to: input.email,
    from: "orders",
    subject: mail.subject,
    html: mail.html,
    replyTo: MAILBOX.replyTo,
    citySlug: input.citySlug,
    transactional: true,
    eventKey: `order:${input.orderId}:status:${input.status}:customer`,
    relatedType: "order",
    relatedId: input.orderId,
  });
}

export async function notifyInquiryEmails(
  payload: InquiryMailPayload & { inquiryId?: string },
) {
  const results = [];
  const studio = buildInquiryStudioEmail(payload);
  const studioTo = studioInboxForCity(payload.citySlug);

  results.push(
    await sendMail({
      to: studioTo,
      from: "info",
      subject: studio.subject,
      html: studio.html,
      replyTo: payload.email || MAILBOX.replyTo,
      bcc: process.env.MAIL_BCC_OWNERS === "0" ? undefined : MAIL_PREVIEW_TO,
      citySlug: payload.citySlug,
      transactional: true,
      eventKey: payload.inquiryId
        ? `inquiry:${payload.inquiryId}:received:studio`
        : undefined,
      relatedType: "inquiry",
      relatedId: payload.inquiryId,
    }),
  );

  if (payload.email) {
    const ack = buildInquiryAckEmail(payload);
    results.push(
      await sendMail({
        to: payload.email,
        from: "info",
        subject: ack.subject,
        html: ack.html,
        replyTo: MAILBOX.replyTo,
        citySlug: payload.citySlug,
        transactional: false,
        eventKey: payload.inquiryId
          ? `inquiry:${payload.inquiryId}:ack:customer`
          : undefined,
        relatedType: "inquiry",
        relatedId: payload.inquiryId,
      }),
    );
  }

  return results;
}
