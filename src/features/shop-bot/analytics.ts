import type { ShopBotStep } from "./types";

export type ShopBotEvent =
  | { name: "shop_bot_opened"; locale: string; source?: string }
  | { name: "shop_bot_intent_selected"; intent: string }
  | { name: "shop_bot_budget_set"; budgetBand: string }
  | {
      name: "shop_bot_recommendations_shown";
      count: number;
      filtersRelaxed: boolean;
    }
  | { name: "shop_bot_product_selected"; productId: string }
  | { name: "shop_bot_addon_selected"; addonId: string; kind: string }
  | { name: "shop_bot_added_to_cart"; itemKind: string }
  | { name: "shop_bot_checkout_handoff"; cartItems: number }
  | { name: "shop_bot_no_match"; reason: string }
  | { name: "shop_bot_closed"; atStep: string };

/** Lightweight, privacy-safe analytics — no PII, no third-party SaaS. */
export function trackShopBotEvent(event: ShopBotEvent) {
  if (typeof window === "undefined") return;
  try {
    const detail = { ...event, at: Date.now() };
    window.dispatchEvent(new CustomEvent("sf:shop-bot", { detail }));
    if (process.env.NODE_ENV !== "production") {
      // Dev-only visibility; never log phones/names/notes.
      console.info("[shop-bot]", detail.name, detail);
    }
  } catch {
    // ignore
  }
}

export function trackClosed(atStep: ShopBotStep) {
  trackShopBotEvent({ name: "shop_bot_closed", atStep });
}
