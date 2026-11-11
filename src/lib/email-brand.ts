import { BRAND } from "@/lib/brand";
import { mailPublicSiteUrl } from "@/lib/mail/config";

/**
 * Absolute logo URLs + a tiny HTML snippet for order / inquiry emails.
 * Email clients need hosted PNG (not SVG) and absolute https URLs.
 */
export function emailBrandAssets() {
  return {
    wordmarkBlack: mailPublicSiteUrl(BRAND.emailWordmarkBlack),
    wordmarkWhite: mailPublicSiteUrl(BRAND.emailWordmarkWhite),
    wordmarkStackedBlack: mailPublicSiteUrl(BRAND.emailWordmarkStackedBlack),
    wordmarkStackedWhite: mailPublicSiteUrl(BRAND.emailWordmarkStackedWhite),
    markBlack: mailPublicSiteUrl(BRAND.emailMarkBlack),
    markCitrus: mailPublicSiteUrl(BRAND.markCitrus),
  };
}

export function emailBrandHeaderHtml(opts?: {
  dark?: boolean;
  /** Prefer horizontal wordmark in emails (stacked only when explicitly requested). */
  stacked?: boolean;
}) {
  const assets = emailBrandAssets();
  const stacked = opts?.stacked ?? false;
  const src = opts?.dark
    ? stacked
      ? assets.wordmarkStackedWhite
      : assets.wordmarkWhite
    : stacked
      ? assets.wordmarkStackedBlack
      : assets.wordmarkBlack;
  const bg = opts?.dark ? "#b0542c" : "#ffffff";
  const width = stacked ? 160 : 220;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:20px 24px;">
  <tr>
    <td align="center">
      <img src="${src}" width="${width}" alt="${BRAND.name}" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:${width}px;" />
    </td>
  </tr>
</table>`;
}
