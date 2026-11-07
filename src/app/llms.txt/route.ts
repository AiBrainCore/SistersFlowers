import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Summarises the storefront for LLM / agent crawlers. */
export function GET() {
  const body = `# Sisters Flowers

> Handcrafted flower bouquets and gifts with delivery in Da Nang and Da Lat, Vietnam.
> English and Vietnamese. Studios since 2020.

## Primary
- Home (EN): ${siteUrl("/en")}
- Home (VI): ${siteUrl("/vi")}
- Shop: ${siteUrl("/en/shop")}
- Custom bouquets: ${siteUrl("/en/custom")}
- Delivery: ${siteUrl("/en/delivery")}
- Contact: ${siteUrl("/en/contact")}
- About: ${siteUrl("/en/about")}
- Terms: ${siteUrl("/en/terms")}

## Services
- Weddings & events: ${siteUrl("/en/weddings")}
- Hotels & business: ${siteUrl("/en/hotels")}
- Flower assistant: ${siteUrl("/en/assistant")}

## Studios
- Da Nang: 53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau, Da Nang — 0904 985 761, 032 745 3536
- Da Lat: 04 Chi Lang, Ward 9, Da Lat, Lam Dong — 0904 985 761, 0964 889 329
- WhatsApp: https://wa.me/84327453536

## Policy
- Content-Signal: search=yes, ai-train=no
- Sitemap: ${siteUrl("/sitemap.xml")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
