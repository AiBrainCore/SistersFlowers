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

/** Trusted Da Lat catalog for the bot (published + city assortment). */
export async function loadDalAtBotCatalog(locale: Locale): Promise<BotProduct[]> {
  const dalat = await getCityBySlug(DEFAULT_CITY_SLUG);
  const cityProductIds = dalat
    ? await listAvailableProductIdsForCity(dalat.id)
    : null;

  const products = await listPublishedProducts({
    sort: "featured",
    cityProductIds,
  });

  return products.map((p) => toBotProduct(p, locale));
}

export async function recommendForShopBot(
  input: BotRecommendInput,
): Promise<BotRecommendResult> {
  const catalog = await loadDalAtBotCatalog(input.locale);
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
