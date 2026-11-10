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
    markBlack: siteUrl(BRAND.emailMarkBlack),
    markCitrus: siteUrl(BRAND.markCitrus),
  };
}

export function emailBrandHeaderHtml(opts?: { dark?: boolean }) {
  const assets = emailBrandAssets();
  const src = opts?.dark ? assets.wordmarkWhite : assets.wordmarkBlack;
  const bg = opts?.dark ? "#b0542c" : "#ffffff";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:20px 24px;">
  <tr>
    <td align="center">
      <img src="${src}" width="200" height="35" alt="${BRAND.name}" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:200px;" />
    </td>
  </tr>
</table>`;
}
