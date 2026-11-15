import { NextResponse } from "next/server";
import {
  listPublishedProducts,
  parseCatalogSearchParams,
} from "@/lib/products";
import {
  getActiveCity,
  listAvailableProductIdsForCity,
} from "@/lib/locations";

/** Live filter preview count for the shop drawer / sidebar draft. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const query = parseCatalogSearchParams(raw);
  const activeCity = await getActiveCity();
  const cityProductIds = await listAvailableProductIdsForCity(activeCity.id);
  const products = await listPublishedProducts({
    ...query,
    cityProductIds,
    cityId: activeCity.id,
    citySlug: activeCity.slug,
  });
  return NextResponse.json({ count: products.length });
}
