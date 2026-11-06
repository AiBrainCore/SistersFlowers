"use server";

import {
  loadShopBotAddons,
  recommendForShopBot,
} from "@/features/shop-bot/catalog-adapter";
import type {
  BotRecommendInput,
  BotRecommendResult,
} from "@/features/shop-bot/types";
import { SHOP_BOT_INTENTS, SHOP_BOT_OCCASIONS } from "@/features/shop-bot/types";
import type { AddonPublic } from "@/lib/addons";

function sanitizeRecommendInput(
  input: BotRecommendInput,
): BotRecommendInput | null {
  if (input.locale !== "en" && input.locale !== "vi") return null;
  if (input.city !== "dalat") return null;
  if (!SHOP_BOT_INTENTS.includes(input.intent)) return null;
  if (
    input.occasion != null &&
    !SHOP_BOT_OCCASIONS.includes(input.occasion)
  ) {
    return null;
  }
  let budgetMaxVnd = input.budgetMaxVnd;
  if (budgetMaxVnd != null) {
    if (!Number.isFinite(budgetMaxVnd) || budgetMaxVnd < 50_000) {
      budgetMaxVnd = undefined;
    } else {
      budgetMaxVnd = Math.min(20_000_000, Math.round(budgetMaxVnd));
    }
  }
  return {
    locale: input.locale,
    city: "dalat",
    intent: input.intent,
    occasion: input.occasion,
    budgetMaxVnd,
  };
}

export async function recommendShopBotAction(
  input: BotRecommendInput,
): Promise<BotRecommendResult> {
  const clean = sanitizeRecommendInput(input);
  if (!clean) {
    return { items: [], filtersRelaxed: false, currency: "VND" };
  }
  return recommendForShopBot(clean);
}

export async function listShopBotAddonsAction(): Promise<AddonPublic[]> {
  return loadShopBotAddons();
}
