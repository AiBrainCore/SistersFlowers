import { prisma } from "@/lib/db";
import type { Product } from "@/data/products";
import { ensureNetworkLocations } from "@/lib/locations";
import {
  baseSizePrices,
  citySizePrices,
  minOfferedPrice,
  type SizePriceMap,
} from "@/lib/product-sizes";

export const CITY_PRICE_SLUGS = ["danang", "dalat"] as const;
export type CityPriceSlug = (typeof CITY_PRICE_SLUGS)[number];

export type CityStockPublic = {
  cityId: string;
  citySlug: string;
  cityNameEn: string;
  cityNameVi: string;
  available: boolean;
  priceOverride: number | null;
  sizePrices: SizePriceMap;
};

/** Effective shop list price for a city (min size or legacy override). */
export function resolveCityPrice(
  product: Pick<Product, "price" | "sizePrices" | "cityStock">,
  citySlug: string | undefined | null,
): number {
  if (!citySlug || !product.cityStock?.length) {
    return minOfferedPrice(product.sizePrices, undefined, product.price);
  }
  const row = product.cityStock.find((s) => s.citySlug === citySlug);
  if (!row) {
    return minOfferedPrice(product.sizePrices, undefined, product.price);
  }
  const legacy =
    row.priceOverride != null && Number.isFinite(row.priceOverride)
      ? row.priceOverride
      : product.price;
  return minOfferedPrice(product.sizePrices, row.sizePrices, legacy);
}

export function withCityPrice(
  product: Product,
  citySlug: string | undefined | null,
): Product {
  return {
    ...product,
    price: resolveCityPrice(product, citySlug),
  };
}

/** Map of productId → priceOverride (null = use base). Legacy helper. */
export async function getCityPriceOverrideMap(
  cityId: string,
): Promise<Map<string, number | null>> {
  const rows = await prisma.productCityAvailability.findMany({
    where: { cityId },
    select: {
      productId: true,
      priceOverride: true,
      priceSm: true,
      priceMd: true,
      priceLg: true,
      priceGrand: true,
    },
  });
  return new Map(
    rows.map((r) => {
      const citySizes = citySizePrices(r);
      const hasSize = Object.values(citySizes).some((v) => v != null && v > 0);
      if (hasSize) {
        // Signal "use size matrix" by keeping null — applyOverrideMap uses full product.
        return [r.productId, r.priceOverride];
      }
      return [r.productId, r.priceOverride];
    }),
  );
}

export function applyOverrideMap(
  product: Product,
  overrides: Map<string, number | null> | null,
  citySlug?: string | null,
): Product {
  if (citySlug) {
    return withCityPrice(product, citySlug);
  }
  if (!overrides || !product.id) {
    return {
      ...product,
      price: minOfferedPrice(product.sizePrices, undefined, product.price),
    };
  }
  const override = overrides.get(product.id);
  const legacy =
    override != null && Number.isFinite(override) ? override : product.price;
  const cityRow = product.cityStock?.find((s) => s.cityId);
  return {
    ...product,
    price: minOfferedPrice(product.sizePrices, cityRow?.sizePrices, legacy),
  };
}

export async function listCitiesForPricing() {
  await ensureNetworkLocations();
  const cities = await prisma.city.findMany({
    where: { slug: { in: [...CITY_PRICE_SLUGS] } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameVi: true,
    },
  });
  return cities;
}

export type CityStockWrite = {
  cityId: string;
  available: boolean;
  priceOverride: number | null;
  priceSm: number | null;
  priceMd: number | null;
  priceLg: number | null;
  priceGrand: number | null;
};

export async function upsertProductCityStock(
  productId: string,
  entries: CityStockWrite[],
) {
  for (const entry of entries) {
    await prisma.productCityAvailability.upsert({
      where: {
        productId_cityId: {
          productId,
          cityId: entry.cityId,
        },
      },
      create: {
        productId,
        cityId: entry.cityId,
        available: entry.available,
        priceOverride: entry.priceOverride,
        priceSm: entry.priceSm,
        priceMd: entry.priceMd,
        priceLg: entry.priceLg,
        priceGrand: entry.priceGrand,
      },
      update: {
        available: entry.available,
        priceOverride: entry.priceOverride,
        priceSm: entry.priceSm,
        priceMd: entry.priceMd,
        priceLg: entry.priceLg,
        priceGrand: entry.priceGrand,
      },
    });
  }
}

export function parseOptionalVnd(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export { baseSizePrices, citySizePrices };
