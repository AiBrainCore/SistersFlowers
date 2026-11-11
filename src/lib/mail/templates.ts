import type { Locale } from "@/i18n/config";
import { MAILBOX, mailPublicSiteUrl } from "@/lib/mail/config";
import {
  authCopy,
  formatVnd,
  inquiryCopy,
  orderCustomerCopy,
  orderStatusCopy,
  orderStudioCopy,
} from "@/lib/mail/copy";
import {
  escapeHtml,
  mailButton,
  mailDetailTable,
  mailHeading,
  mailMuted,
  mailParagraph,
  renderMailLayout,
} from "@/lib/mail/layout";
import {
  cityLabel,
  citySubjectTag,
  studioAddress,
  studioContactForCity,
  studioPhoneLine,
} from "@/lib/mail/studio";

export type OrderMailItem = {
  name: string;
  qty: number;
  price: number;
};

export type OrderMailPayload = {
  locale: Locale;
  reference: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  zone?: string | null;
  citySlug?: string | null;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  subtotal: number;
  deliveryFee?: number | null;
  deliveryTotal: number;
  items: OrderMailItem[];
};

export type InquiryMailPayload = {
  locale: Locale;
  variant: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  citySlug?: string | null;
  date?: string | null;
  hotel?: string | null;
  venue?: string | null;
};

function itemsHtml(items: OrderMailItem[], locale: Locale) {
  return items
    .map(
      (item) =>
        `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #e8d9cc;">${escapeHtml(item.name)} × ${item.qty}</td>
  <td align="right" style="padding:8px 0;border-bottom:1px solid #e8d9cc;white-space:nowrap;">${escapeHtml(formatVnd(item.price * item.qty, locale))}</td>
</tr>`,
    )
    .join("");
}

function withCityTag(subject: string, citySlug?: string | null) {
  const tag = citySubjectTag(citySlug);
  return tag ? `${tag} ${subject}` : subject;
}

function cityRow(
  locale: Locale,
  citySlug?: string | null,
): Array<[string, string]> {
  const label = cityLabel(citySlug, locale);
  if (!label) return [];
  return [[locale === "vi" ? "Studio" : "Studio", escapeHtml(label)]];
}

export function buildOrderCustomerEmail(payload: OrderMailPayload) {
  const c = orderCustomerCopy(payload.locale);
  const when = [payload.deliveryDate, payload.deliveryTime]
    .filter(Boolean)
    .join(" · ");
  const rows: Array<[string, string]> = [
    ...cityRow(payload.locale, payload.citySlug),
    ["Ref", escapeHtml(payload.reference)],
    [c.phoneLabel, escapeHtml(payload.phone)],
    [c.addressLabel, escapeHtml(payload.address)],
  ];
  if (when) rows.push([c.dateLabel, escapeHtml(when)]);
  if (payload.notes) rows.push([c.notesLabel, escapeHtml(payload.notes)]);
  rows.push([
    c.deliveryLabel,
    escapeHtml(formatVnd(payload.deliveryFee ?? 0, payload.locale)),
  ]);
  rows.push([
    c.totalLabel,
    `<strong>${escapeHtml(formatVnd(payload.deliveryTotal, payload.locale))}</strong>`,
  ]);

  const body = [
    mailHeading(c.heading),
    mailParagraph(escapeHtml(c.intro(payload.customerName))),
    mailMuted(escapeHtml(c.statusNote)),
    mailDetailTable(rows),
    `<p style="margin:16px 0 6px;font-size:13px;color:#6b635c;text-align:center;">${escapeHtml(c.itemsLabel)}</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml(payload.items, payload.locale)}</table>`,
    mailButton(mailPublicSiteUrl(`/${payload.locale}/shop`), c.cta),
  ].join("\n");

  return {
    subject: withCityTag(c.subject(payload.reference), payload.citySlug),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.preheader(payload.reference),
      citySlug: payload.citySlug,
      locale: payload.locale,
      toEmail: payload.email,
    }),
  };
}

export function buildOrderStudioEmail(payload: OrderMailPayload) {
  const c = orderStudioCopy();
  const studio = studioContactForCity(payload.citySlug);
  const city = cityLabel(payload.citySlug, "en") || "—";
  const rows: Array<[string, string]> = [
    ["City", `<strong>${escapeHtml(city)}</strong>`],
    ["Reference", escapeHtml(payload.reference)],
    ["Locale", escapeHtml(payload.locale)],
    ["Customer", escapeHtml(payload.customerName)],
    ["Phone", escapeHtml(payload.phone)],
    ["Email", escapeHtml(payload.email || "—")],
    ["Address", escapeHtml(payload.address)],
    ["Zone", escapeHtml(payload.zone || "—")],
    [
      "When",
      escapeHtml(
        [payload.deliveryDate, payload.deliveryTime].filter(Boolean).join(" · ") ||
          "—",
      ),
    ],
    ["Notes", escapeHtml(payload.notes || "—")],
    ["Total", escapeHtml(formatVnd(payload.deliveryTotal, "en"))],
  ];
  if (studio) {
    rows.splice(1, 0, [
      "Studio desk",
      `${escapeHtml(studioAddress(studio, "en"))}<br/>${escapeHtml(studioPhoneLine(studio))}`,
    ]);
  }

  const body = [
    mailHeading(c.heading),
    mailParagraph(escapeHtml(c.intro)),
    mailDetailTable(rows),
    `<p style="margin:16px 0 6px;font-size:13px;color:#6b635c;text-align:center;">Items</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml(payload.items, "en")}</table>`,
    mailButton(mailPublicSiteUrl("/admin/orders"), c.openAdmin),
  ].join("\n");

  return {
    subject: withCityTag(
      c.subject(payload.reference, payload.customerName),
      payload.citySlug,
    ),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.preheader(payload.reference),
      citySlug: payload.citySlug,
      locale: "en",
      toEmail: MAILBOX.studioInbox,
    }),
  };
}

export function buildWelcomeEmail(
  locale: Locale,
  name?: string,
  toEmail?: string | null,
) {
  const c = authCopy(locale);
  const body = [
    mailHeading(c.welcomeHeading),
    mailParagraph(escapeHtml(c.welcomeIntro(name))),
    mailParagraph(escapeHtml(c.welcomeBody)),
    mailButton(
      mailPublicSiteUrl(`/${locale}/account`),
      locale === "vi" ? "Vào tài khoản" : "Open account",
    ),
  ].join("\n");
  return {
    subject: c.welcomeSubject,
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.welcomeSubject,
      locale,
      toEmail,
    }),
  };
}

export function buildVerifyEmail(
  locale: Locale,
  verifyUrl: string,
  toEmail?: string | null,
) {
  const c = authCopy(locale);
  const body = [
    mailHeading(c.verifyHeading),
    mailParagraph(escapeHtml(c.verifyIntro)),
    mailButton(verifyUrl, c.verifyCta),
    mailMuted(escapeHtml(c.verifyHint)),
  ].join("\n");
  return {
    subject: c.verifySubject,
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.verifySubject,
      locale,
      toEmail,
    }),
  };
}

export function buildOrderStatusEmail(input: {
  locale: Locale;
  reference: string;
  customerName: string;
  status: string;
  citySlug?: string | null;
  email?: string | null;
}) {
  const c = orderStatusCopy(input.locale, input.status);
  const rows: Array<[string, string]> = [
    ...cityRow(input.locale, input.citySlug),
    ["Ref", escapeHtml(input.reference)],
    ["Status", escapeHtml(input.status)],
  ];
  const body = [
    mailHeading(c.heading),
    mailParagraph(escapeHtml(c.intro(input.customerName))),
    mailDetailTable(rows),
    mailMuted(escapeHtml(c.support)),
  ].join("\n");
  return {
    subject: withCityTag(c.subject(input.reference), input.citySlug),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.subject(input.reference),
      citySlug: input.citySlug,
      locale: input.locale,
      toEmail: input.email,
    }),
  };
}

export function buildInquiryStudioEmail(payload: InquiryMailPayload) {
  const c = inquiryCopy("en");
  const city = cityLabel(payload.citySlug, "en") || "—";
  const rows: Array<[string, string]> = [
    ["City", `<strong>${escapeHtml(city)}</strong>`],
    ["Type", escapeHtml(payload.variant)],
    ["Name", escapeHtml(payload.name)],
    ["Email", escapeHtml(payload.email)],
    ["Phone", escapeHtml(payload.phone || "—")],
    ["Date", escapeHtml(payload.date || "—")],
    ["Hotel", escapeHtml(payload.hotel || "—")],
    ["Venue", escapeHtml(payload.venue || "—")],
    ["Message", escapeHtml(payload.message)],
  ];
  const body = [
    mailHeading(c.studioHeading),
    mailDetailTable(rows),
    mailButton(mailPublicSiteUrl("/admin/inquiries"), "Open inquiries"),
  ].join("\n");
  return {
    subject: withCityTag(
      c.studioSubject(payload.variant, payload.name),
      payload.citySlug,
    ),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.studioHeading,
      citySlug: payload.citySlug,
      locale: "en",
      toEmail: MAILBOX.studioInbox,
    }),
  };
}

export function buildInquiryAckEmail(payload: InquiryMailPayload) {
  const c = inquiryCopy(payload.locale);
  const body = [
    mailHeading(c.ackHeading),
    mailParagraph(escapeHtml(c.ackIntro(payload.name))),
    mailParagraph(escapeHtml(c.ackBody)),
    mailButton(
      mailPublicSiteUrl(`/${payload.locale}/shop`),
      payload.locale === "vi" ? "Xem cửa hàng" : "Browse shop",
    ),
  ].join("\n");
  return {
    subject: withCityTag(c.ackSubject, payload.citySlug),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.ackSubject,
      citySlug: payload.citySlug,
      locale: payload.locale,
      toEmail: payload.email,
    }),
  };
}
