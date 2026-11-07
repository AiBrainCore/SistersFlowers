import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Explicit text robots.txt — Hostinger scanners expect Sitemap + Content-Signal lines. */
export function GET() {
  const sitemap = siteUrl("/sitemap.xml");
  const body = `# Sisters Flowers
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api

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
