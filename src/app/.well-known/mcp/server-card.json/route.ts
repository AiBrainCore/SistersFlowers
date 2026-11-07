import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Minimal MCP Server Card (SEP-1649) — declares the public site.
 * No remote tool execution is exposed; agents should use HTML/JSON-LD/llms.txt.
 */
export function GET() {
  const card = {
    name: "Sisters Flowers",
    description:
      "Florist studios in Da Nang and Da Lat, Vietnam — bouquets, gifts, and local delivery.",
    version: "1.0.0",
    url: siteUrl("/en"),
    endpoint: siteUrl("/en"),
    capabilities: {
      tools: false,
      resources: true,
      prompts: false,
    },
    resources: [
      { name: "llms.txt", uri: siteUrl("/llms.txt") },
      { name: "sitemap", uri: siteUrl("/sitemap.xml") },
      { name: "shop", uri: siteUrl("/en/shop") },
      { name: "contact", uri: siteUrl("/en/contact") },
    ],
  };

  return Response.json(card, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
