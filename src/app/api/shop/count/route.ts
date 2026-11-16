import { NextResponse } from "next/server";
import {
  countShopCatalog,
  parseCatalogSearchParams,
} from "@/lib/products";
import { getActiveCity } from "@/lib/locations";

/** Live filter preview count for the shop drawer / sidebar draft. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const query = parseCatalogSearchParams(raw);
  const activeCity = await getActiveCity();
  const count = await countShopCatalog({
    ...query,
    cityId: activeCity.id,
    citySlug: activeCity.slug,
  });
  return NextResponse.json({ count });
}
