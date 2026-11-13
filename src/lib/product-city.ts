import { prisma } from "@/lib/db";
import type { Product } from "@/data/products";
import { ensureNetworkLocations } from "@/lib/locations";

export const CITY_PRICE_SLUGS = ["danang", "dalat"] as const;
export type CityPriceSlug = (typeof CITY_PRICE_SLUGS)[number];

export type CityStockPublic = {
  cityId: string;
  citySlug: string;
  cityNameEn: string;
  cityNameVi: string;
  available: boolean;
  priceOverride: number | null;
};

/** Effective shop price for a city (override or network base). */
export function resolveCityPrice(
  basePrice: number,
  stock: CityStockPublic[] | undefined,
  citySlug: string | undefined | null,
): number {
  if (!citySlug || !stock?.length) return basePrice;
  const row = stock.find((s) => s.citySlug === citySlug);
  if (row?.priceOverride != null && Number.isFinite(row.priceOverride)) {
    return row.priceOverride;
  }
  return basePrice;
}

export function withCityPrice(
  product: Product,
  citySlug: string | undefined | null,
): Product {
  return {
    ...product,
    price: resolveCityPrice(product.price, product.cityStock, citySlug),
  };
}

/** Map of productId → priceOverride (null = use base). */
export async function getCityPriceOverrideMap(
  cityId: string,
): Promise<Map<string, number | null>> {
  const rows = await prisma.productCityAvailability.findMany({
    where: { cityId },
    select: { productId: true, priceOverride: true },
  });
  return new Map(rows.map((r) => [r.productId, r.priceOverride]));
}

export function applyOverrideMap(
  product: Product,
  overrides: Map<string, number | null> | null,
): Product {
  if (!overrides || !product.id) return product;
  const override = overrides.get(product.id);
  if (override == null) return product;
  return { ...product, price: override };
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

export async function upsertProductCityStock(
  productId: string,
  entries: Array<{
    cityId: string;
    available: boolean;
    priceOverride: number | null;
  }>,
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
      },
      update: {
        available: entry.available,
        priceOverride: entry.priceOverride,
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
