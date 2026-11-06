export type ShopBotStep =
  | "greeting"
  | "intent"
  | "occasion"
  | "budget"
  | "recommendations"
  | "product"
  | "extras"
  | "review"
  | "handoff";

export type ShopBotIntent = "self" | "gift" | "hotel" | "browse";

/** Guided occasion keys (mapped to catalog categories when reliable). */
export type ShopBotOccasion =
  | "birthday"
  | "anniversary"
  | "love"
  | "congratulations"
  | "apology"
  | "other";

export type BotProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceVnd: number;
  available: boolean;
  productUrl: string;
  blurb?: string;
  tag?: string;
};

export type ShopBotCity = "danang" | "dalat";

export type BotRecommendInput = {
  locale: "en" | "vi";
  city: ShopBotCity;
  intent: ShopBotIntent;
  occasion?: ShopBotOccasion;
  budgetMaxVnd?: number;
};

export type BotRecommendResult = {
  items: BotProduct[];
  filtersRelaxed: boolean;
  currency: "VND";
};

export type ShopBotHotelHints = {
  name?: string;
  recipient?: string;
  note?: string;
};

export type ShopBotState = {
  step: ShopBotStep;
  locale: "en" | "vi";
  city: ShopBotCity;
  intent?: ShopBotIntent;
  occasion?: ShopBotOccasion;
  budgetMaxVnd?: number;
  source?: string;
  selectedProductId?: string;
  selectedAddonIds: string[];
  hotel: ShopBotHotelHints;
  filtersRelaxed?: boolean;
};

export type ShopBotDeepLink = {
  intent?: ShopBotIntent;
  occasion?: ShopBotOccasion;
  budgetMaxVnd?: number;
  source?: string;
  open?: boolean;
};

export const BUDGET_CHIPS_VND = [
  200_000, 300_000, 450_000, 650_000, 1_000_000,
] as const;

export const SHOP_BOT_OCCASIONS: ShopBotOccasion[] = [
  "birthday",
  "anniversary",
  "love",
  "congratulations",
  "apology",
  "other",
];

export const SHOP_BOT_INTENTS: ShopBotIntent[] = [
  "self",
  "gift",
  "hotel",
  "browse",
];
