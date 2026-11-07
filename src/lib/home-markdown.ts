import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/seo";

/** Compact homepage representation for Accept: text/markdown agents. */
export function homeMarkdown(locale: Locale) {
  const shop = siteUrl(`/${locale}/shop`);
  return `# Sisters Flowers

Handcrafted flower bouquets and gifts — delivery in Da Nang and Da Lat, Vietnam.

## Shop
- Bouquets: ${shop}
- Custom: ${siteUrl(`/${locale}/custom`)}
- Delivery: ${siteUrl(`/${locale}/delivery`)}
- Contact: ${siteUrl(`/${locale}/contact`)}
- About: ${siteUrl(`/${locale}/about`)}
- Terms: ${siteUrl(`/${locale}/terms`)}

## Studios
- Da Nang — 53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau — 0904 985 761 / 032 745 3536
- Da Lat — 04 Chi Lang, Ward 9 — 0904 985 761 / 0964 889 329
- WhatsApp: https://wa.me/84327453536

Prices are listed on ${shop} in VND (no login required).
`;
}
