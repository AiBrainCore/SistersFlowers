import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Explicit text robots.txt — Sitemap + crawl rules for Search Console. */
export function GET() {
  const sitemap = siteUrl("/sitemap.xml");
  const body = `# Sisters Flowers
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api
Disallow: /api/
Disallow: /account
Disallow: /account/
Disallow: /en/account
Disallow: /vi/account
Disallow: /en/checkout
Disallow: /vi/checkout
Disallow: /en/unsubscribe
Disallow: /vi/unsubscribe
Disallow: /voucher
Disallow: /en/classic
Disallow: /vi/classic
Disallow: /en/hero-3d
Disallow: /vi/hero-3d
Disallow: /en/hero-preview
Disallow: /vi/hero-preview

User-agent: Googlebot
Allow: /

# Content usage signal for search / AI crawlers
Content-Signal: search=yes, ai-train=no

Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
