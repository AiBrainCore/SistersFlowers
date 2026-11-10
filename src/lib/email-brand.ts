import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/seo";

/**
 * Absolute logo URLs + a tiny HTML snippet for order / inquiry emails.
 * Email clients need hosted PNG (not SVG) and absolute https URLs.
 */
export function emailBrandAssets() {
  return {
    wordmarkBlack: siteUrl(BRAND.emailWordmarkBlack),
    wordmarkWhite: siteUrl(BRAND.emailWordmarkWhite),
    wordmarkStackedBlack: siteUrl(BRAND.emailWordmarkStackedBlack),
    wordmarkStackedWhite: siteUrl(BRAND.emailWordmarkStackedWhite),
    markBlack: siteUrl(BRAND.emailMarkBlack),
    markCitrus: siteUrl(BRAND.markCitrus),
  };
}

export function emailBrandHeaderHtml(opts?: {
  dark?: boolean;
  /** Prefer 2-line stacked mark for confirmation emails */
  stacked?: boolean;
}) {
  const assets = emailBrandAssets();
  const stacked = opts?.stacked ?? true;
  const src = opts?.dark
    ? stacked
      ? assets.wordmarkStackedWhite
      : assets.wordmarkWhite
    : stacked
      ? assets.wordmarkStackedBlack
      : assets.wordmarkBlack;
  const bg = opts?.dark ? "#b0542c" : "#ffffff";
  const width = stacked ? 160 : 200;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:20px 24px;">
  <tr>
    <td align="center">
      <img src="${src}" width="${width}" alt="${BRAND.name}" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:${width}px;" />
    </td>
  </tr>
</table>`;
}
