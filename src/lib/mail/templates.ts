import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/seo";
import {
  authCopy,
  formatVnd,
  orderCustomerCopy,
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
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  subtotal: number;
  deliveryFee?: number | null;
  deliveryTotal: number;
  items: OrderMailItem[];
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

export function buildOrderCustomerEmail(payload: OrderMailPayload) {
  const c = orderCustomerCopy(payload.locale);
  const when = [payload.deliveryDate, payload.deliveryTime]
    .filter(Boolean)
    .join(" · ");
  const rows: Array<[string, string]> = [
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
    `<p style="margin:16px 0 6px;font-size:13px;color:#6b635c;">${escapeHtml(c.itemsLabel)}</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml(payload.items, payload.locale)}</table>`,
    mailButton(siteUrl(`/${payload.locale}/shop`), c.cta),
  ].join("\n");

  return {
    subject: c.subject(payload.reference),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.preheader(payload.reference),
      footerHtml: escapeHtml(c.footer),
    }),
  };
}

export function buildOrderStudioEmail(payload: OrderMailPayload) {
  const c = orderStudioCopy();
  const rows: Array<[string, string]> = [
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

  const body = [
    mailHeading(c.heading),
    mailParagraph(escapeHtml(c.intro)),
    mailDetailTable(rows),
    `<p style="margin:16px 0 6px;font-size:13px;color:#6b635c;">Items</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml(payload.items, "en")}</table>`,
    mailButton(siteUrl("/admin/orders"), c.openAdmin),
  ].join("\n");

  return {
    subject: c.subject(payload.reference, payload.customerName),
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.preheader(payload.reference),
    }),
  };
}

export function buildWelcomeEmail(locale: Locale, name?: string) {
  const c = authCopy(locale);
  const body = [
    mailHeading(c.welcomeHeading),
    mailParagraph(escapeHtml(c.welcomeIntro(name))),
    mailParagraph(escapeHtml(c.welcomeBody)),
    mailButton(siteUrl(`/${locale}/account`), locale === "vi" ? "Vào tài khoản" : "Open account"),
  ].join("\n");
  return {
    subject: c.welcomeSubject,
    html: renderMailLayout({
      bodyHtml: body,
      preheader: c.welcomeSubject,
    }),
  };
}

export function buildVerifyEmail(locale: Locale, verifyUrl: string) {
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
    }),
  };
}
