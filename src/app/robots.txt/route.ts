import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Explicit text robots.txt.
 * Content-Signal is emitted as plain text (not via Next.js MetadataRoute.Robots).
 * Do not add a separate Googlebot Allow:/ group — it would override * Disallows.
 * Sitemap always points at the public origin (never localhost).
 */
export function GET() {
  const body = `# Sisters Flowers
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api
Disallow: /account
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

# Public content usage permissions
Content-Signal: search=yes, ai-input=yes, ai-train=yes

Sitemap: ${PUBLIC_SITE_ORIGIN}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
