import {
  buildGoogleMerchantFeed,
  merchantFeedToTsv,
} from "@/lib/google-merchant/feed";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLocale(value: string | null): Locale {
  return value === "en" ? "en" : "vi";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = parseLocale(url.searchParams.get("lang"));
  const citySlug = url.searchParams.get("city") || undefined;

  const result = await buildGoogleMerchantFeed({ locale, citySlug });
  const body = merchantFeedToTsv(result);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      "X-Merchant-Items": String(result.meta.itemCount),
      "X-Merchant-Products": String(result.meta.productCount),
      "X-Merchant-Issues": String(result.issues.length),
    },
  });
}
