import type {
  BotProduct,
  BotRecommendResult,
  ShopBotOccasion,
} from "./types";

/** Map guided occasions to existing catalog category slugs when reliable. */
export function occasionToCategorySlug(
  occasion?: ShopBotOccasion,
): string | undefined {
  switch (occasion) {
    case "birthday":
      return "birthday";
    case "anniversary":
    case "love":
      return "romance";
    case "congratulations":
      return "graduation";
    case "apology":
    case "other":
    default:
      return undefined;
  }
}

function sortKey(product: BotProduct): string {
  return product.id || product.slug;
}

function hasCategory(product: BotProduct, slug: string) {
  return (product.tag || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(slug);
}

/**
 * Deterministic ranker over already-trusted Da Lat product DTOs.
 * Prefer budget-fit + optional occasion; never silently exceed budget.
 */
export function rankBotProducts(options: {
  products: BotProduct[];
  budgetMaxVnd?: number;
  occasionCategorySlug?: string;
  limit?: number;
}): BotRecommendResult {
  const limit = options.limit ?? 3;
  const budget = options.budgetMaxVnd;
  const occasionSlug = options.occasionCategorySlug;

  const available = options.products.filter((p) => p.available && p.priceVnd > 0);

  const withinBudget =
    budget != null
      ? available.filter((p) => p.priceVnd <= budget)
      : available;

  let filtersRelaxed = false;
  let pool = withinBudget;

  if (occasionSlug) {
    const strict = withinBudget.filter((p) => hasCategory(p, occasionSlug));
    if (strict.length === 0 && withinBudget.length > 0) {
      filtersRelaxed = true;
      pool = withinBudget;
    } else {
      pool = strict;
    }
  }

  if (pool.length === 0) {
    return { items: [], filtersRelaxed: false, currency: "VND" };
  }

  const finalRanked = [...pool].sort((a, b) => {
    if (budget != null) {
      const closeA = budget - a.priceVnd;
      const closeB = budget - b.priceVnd;
      if (closeA !== closeB) return closeA - closeB;
    } else if (a.priceVnd !== b.priceVnd) {
      return a.priceVnd - b.priceVnd;
    }
    return sortKey(a).localeCompare(sortKey(b));
  });

  return {
    items: finalRanked.slice(0, limit),
    filtersRelaxed,
    currency: "VND",
  };
}
