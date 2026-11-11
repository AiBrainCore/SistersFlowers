import { BRAND } from "@/lib/brand";
import { MAILBOX, mailPublicSiteUrl } from "@/lib/mail/config";
import {
  cityLabel,
  mailSocialLinks,
  studioAddress,
  studioContactForCity,
  studioMapsLink,
  studioPhoneLine,
} from "@/lib/mail/studio";
import {
  unsubscribeCopy,
  unsubscribeUrl,
} from "@/lib/mail/unsubscribe";
import type { Locale } from "@/i18n/config";

const COLORS = {
  citrus: "#b0542c",
  forest: "#1a1714",
  cream: "#fff4eb",
  mist: "#f5ebe3",
  paper: "#ffffff",
  muted: "#6b635c",
  line: "#e8d9cc",
  link: "#2f6fed",
  white: "#ffffff",
} as const;

/** Brand founding year for © range; end year always = current calendar year. */
export const MAIL_BRAND_SINCE = 2000;

export type MailLayoutInput = {
  /** Pre-rendered inner HTML (tables / paragraphs). */
  bodyHtml: string;
  /** Preview text for inbox list */
  preheader?: string;
  /** Order / inquiry city — drives studio contact block in footer */
  citySlug?: string | null;
  locale?: Locale;
  /** Recipient — used for “sent to …” + signed unsubscribe link */
  toEmail?: string | null;
  /**
   * Prefer cid: inline attachments when true (default).
   * Falls back to absolute https URLs for HTML previews without SMTP.
   */
  useCidAssets?: boolean;
};

export function mailCopyrightYears(now = new Date()) {
  const end = now.getFullYear();
  return end > MAIL_BRAND_SINCE
    ? `${MAIL_BRAND_SINCE}–${end}`
    : `${MAIL_BRAND_SINCE}`;
}

function assetSrc(cid: string, publicPath: string, useCid: boolean) {
  return useCid ? `cid:${cid}` : mailPublicSiteUrl(publicPath);
}

function socialRow(citySlug?: string | null, useCid = true) {
  const links = mailSocialLinks(citySlug);
  const cells = links
    .map(
      (item) => `<td align="center" style="padding:0 8px;">
  <a href="${escapeHtml(item.href)}" style="text-decoration:none;" target="_blank">
    <img src="${assetSrc(item.cid, item.path, useCid)}" width="36" height="36" alt="${escapeHtml(item.label)}" style="display:block;border:0;outline:none;width:36px;height:36px;border-radius:999px;" />
  </a>
</td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 18px;">
  <tr>${cells}</tr>
</table>`;
}

function studioContactBlock(citySlug?: string | null, locale: Locale = "en") {
  const studio = studioContactForCity(citySlug);
  const info = MAILBOX.info || "info@sistersflowers.vn";
  if (!studio) {
    return `<p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  Da Nang &amp; Da Lat
</p>
<p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  <a href="mailto:${escapeHtml(info)}" style="color:${COLORS.citrus};text-decoration:none;">${escapeHtml(info)}</a>
</p>`;
  }
  const address = studioAddress(studio, locale);
  const phones = studioPhoneLine(studio);
  const maps = studioMapsLink(studio, locale);
  return `<p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  <a href="${escapeHtml(maps)}" style="color:${COLORS.muted};text-decoration:underline;">${escapeHtml(address)}</a>
</p>
<p style="margin:0 0 6px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  ${escapeHtml(phones)}
</p>
<p style="margin:0 0 14px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  <a href="mailto:${escapeHtml(info)}" style="color:${COLORS.citrus};text-decoration:none;">${escapeHtml(info)}</a>
</p>`;
}

function footerLegalBlock(input: {
  locale: Locale;
  citySlug?: string | null;
  toEmail?: string | null;
}) {
  const locale = input.locale;
  const copy = unsubscribeCopy[locale];
  const email = input.toEmail?.trim() || "";
  const unsub = email
    ? unsubscribeUrl(email, locale)
    : mailPublicSiteUrl(`/${locale}/unsubscribe`);
  const years = mailCopyrightYears();

  const sentLine = email
    ? `<p style="margin:0 0 8px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  ${escapeHtml(copy.sentTo("EMAIL_PLACEHOLDER")).replace(
    "EMAIL_PLACEHOLDER",
    `<a href="mailto:${escapeHtml(email)}" style="color:${COLORS.link};text-decoration:underline;">${escapeHtml(email)}</a>`,
  )}
</p>`
    : "";

  return `${studioContactBlock(input.citySlug, locale)}
${sentLine}
<p style="margin:0 0 14px;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  ${escapeHtml(copy.preferNot)}
  <a href="${escapeHtml(unsub)}" style="color:${COLORS.link};text-decoration:underline;">${escapeHtml(copy.link)}</a>.
</p>
<p style="margin:0;font-size:12px;line-height:1.55;color:${COLORS.muted};">
  Copyright © ${years} ${BRAND.name}
</p>`;
}

/**
 * Single SF transactional layout — orange header + white logo,
 * city studio contact, social icons, single-locale unsubscribe,
 * copyright always last.
 */
export function renderMailLayout(input: MailLayoutInput): string {
  const useCid = input.useCidAssets !== false;
  const locale = input.locale || "en";
  const logoSrc = assetSrc(
    "sf-wordmark",
    BRAND.emailWordmarkWhite,
    useCid,
  );
  const preheader = input.preheader
    ? `<div style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>`
    : "";
  const city = cityLabel(input.citySlug, locale);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.mist};font-family:Georgia,'Times New Roman',serif;color:${COLORS.forest};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.mist};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.paper};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.line};">
        <tr>
          <td align="center" style="padding:28px 28px 22px;background:${COLORS.citrus};">
            <a href="${mailPublicSiteUrl(`/${locale}`)}" style="text-decoration:none;">
              <img src="${logoSrc}" width="220" alt="${BRAND.name}" style="display:block;border:0;outline:none;height:auto;max-width:220px;margin:0 auto;" />
            </a>
            ${
              city
                ? `<p style="margin:14px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.white};">${escapeHtml(city)}</p>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 28px;background:${COLORS.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${COLORS.forest};">
            ${input.bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:26px 28px 28px;background:${COLORS.cream};border-top:1px solid ${COLORS.line};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            ${socialRow(input.citySlug, useCid)}
            ${footerLegalBlock({
              locale,
              citySlug: input.citySlug,
              toEmail: input.toEmail,
            })}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Centered citrus CTA button. */
export function mailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;">
  <tr>
    <td align="center" style="border-radius:999px;background:${COLORS.citrus};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function mailMuted(text: string) {
  return `<p style="margin:0 0 12px;color:${COLORS.muted};font-size:13px;text-align:center;">${text}</p>`;
}

export function mailHeading(text: string) {
  return `<h1 style="margin:12px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:600;color:${COLORS.forest};text-align:center;">${text}</h1>`;
}

export function mailParagraph(text: string) {
  return `<p style="margin:0 0 14px;text-align:center;">${text}</p>`;
}

export function mailDetailTable(rows: Array<[string, string]>) {
  const cells = rows
    .map(
      ([k, v]) => `<tr>
  <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};color:${COLORS.muted};width:38%;vertical-align:top;font-size:13px;">${k}</td>
  <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};vertical-align:top;font-size:14px;">${v}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">${cells}</table>`;
}

export { COLORS };
