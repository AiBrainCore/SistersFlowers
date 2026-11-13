import { listActiveAddons, type AddonPublic } from "@/lib/addons";
import {
  DEFAULT_CITY_SLUG,
  getCityBySlug,
  listAvailableProductIdsForCity,
} from "@/lib/locations";
import { listPublishedProducts } from "@/lib/products";
import type { Locale } from "@/i18n/config";
import { occasionToCategorySlug, rankBotProducts } from "./recommend";
import type { BotProduct, BotRecommendInput, BotRecommendResult } from "./types";

function toBotProduct(
  product: Awaited<ReturnType<typeof listPublishedProducts>>[number],
  locale: Locale,
): BotProduct {
  const categorySlugs = (product.categories || []).map((c) => c.slug);
  return {
    id: product.id || product.slug,
    slug: product.slug,
    name: product.names[locale],
    imageUrl: product.image || null,
    priceVnd: product.price,
    available: product.published !== false,
    productUrl: `/${locale}/shop/${product.slug}`,
    blurb: product.blurb[locale],
    tag: categorySlugs.join(","),
  };
}

/** Trusted city catalog for the bot (published + city assortment). */
export async function loadDalAtBotCatalog(
  locale: Locale,
  citySlug: string = DEFAULT_CITY_SLUG,
): Promise<BotProduct[]> {
  const city = await getCityBySlug(citySlug);
  const cityProductIds = city
    ? await listAvailableProductIdsForCity(city.id)
    : null;

  const products = await listPublishedProducts({
    sort: "featured",
    cityProductIds,
    cityId: city?.id,
    citySlug: city?.slug,
  });

  return products.map((p) => toBotProduct(p, locale));
}

export async function recommendForShopBot(
  input: BotRecommendInput,
): Promise<BotRecommendResult> {
  const catalog = await loadDalAtBotCatalog(input.locale, input.city);
  const occasionCategorySlug = occasionToCategorySlug(input.occasion);

  return rankBotProducts({
    products: catalog,
    budgetMaxVnd: input.budgetMaxVnd,
    occasionCategorySlug,
    limit: 3,
  });
}

export async function loadShopBotAddons(): Promise<AddonPublic[]> {
  return listActiveAddons();
}

export function findBotProduct(
  catalog: BotProduct[],
  productId: string | undefined,
): BotProduct | undefined {
  if (!productId) return undefined;
  return catalog.find((p) => p.id === productId || p.slug === productId);
}
