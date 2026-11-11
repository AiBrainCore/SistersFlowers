import { BRAND } from "@/lib/brand";
import { emailBrandAssets } from "@/lib/email-brand";
import { mailPublicSiteUrl } from "@/lib/mail/config";

const COLORS = {
  citrus: "#b0542c",
  forest: "#1a1714",
  cream: "#fff4eb",
  mist: "#f5ebe3",
  paper: "#ffffff",
  muted: "#6b635c",
  line: "#e8d9cc",
} as const;

export type MailLayoutInput = {
  /** Pre-rendered inner HTML (tables / paragraphs). */
  bodyHtml: string;
  /** Footer line under the card */
  footerHtml?: string;
  /** Preview text for inbox list */
  preheader?: string;
};

/**
 * Single SF transactional layout — every email uses this shell
 * (logo header, cream frame, citrus accent bar, footer).
 */
export function renderMailLayout(input: MailLayoutInput): string {
  const assets = emailBrandAssets();
  const year = new Date().getFullYear();
  const preheader = input.preheader
    ? `<div style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>`
    : "";
  const footer =
    input.footerHtml ||
    `© ${year} ${BRAND.name} · <a href="${mailPublicSiteUrl("/vi")}" style="color:${COLORS.citrus};text-decoration:none;">sistersflowers.vn</a>`;

  return `<!DOCTYPE html>
<html lang="und">
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
          <td style="height:4px;background:${COLORS.citrus};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 28px 8px;background:${COLORS.cream};">
            <a href="${mailPublicSiteUrl("/vi")}" style="text-decoration:none;">
              <img src="${assets.wordmarkStackedBlack}" width="168" alt="${BRAND.name}" style="display:block;border:0;outline:none;height:auto;max-width:168px;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 32px;background:${COLORS.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${COLORS.forest};">
            ${input.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;background:${COLORS.cream};border-top:1px solid ${COLORS.line};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${COLORS.muted};text-align:center;">
            ${footer}
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

export function mailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr>
    <td style="border-radius:999px;background:${COLORS.citrus};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function mailMuted(text: string) {
  return `<p style="margin:0 0 12px;color:${COLORS.muted};font-size:13px;">${text}</p>`;
}

export function mailHeading(text: string) {
  return `<h1 style="margin:12px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:600;color:${COLORS.forest};">${text}</h1>`;
}

export function mailParagraph(text: string) {
  return `<p style="margin:0 0 14px;">${text}</p>`;
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
