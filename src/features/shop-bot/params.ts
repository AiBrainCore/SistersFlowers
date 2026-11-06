import {
  BUDGET_CHIPS_VND,
  SHOP_BOT_INTENTS,
  SHOP_BOT_OCCASIONS,
  type ShopBotDeepLink,
  type ShopBotIntent,
  type ShopBotOccasion,
} from "./types";

const OCCASION_ALIASES: Record<string, ShopBotOccasion> = {
  birthday: "birthday",
  "sinh-nhat": "birthday",
  sinhnhat: "birthday",
  anniversary: "anniversary",
  "ky-niem": "anniversary",
  love: "love",
  romance: "love",
  langman: "love",
  "lang-man": "love",
  congratulations: "congratulations",
  chucmung: "congratulations",
  "chuc-mung": "congratulations",
  graduation: "congratulations",
  apology: "apology",
  other: "other",
};

const INTENT_ALIASES: Record<string, ShopBotIntent> = {
  self: "self",
  gift: "gift",
  hotel: "hotel",
  browse: "browse",
};

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseIntent(raw: string | undefined): ShopBotIntent | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  const mapped = INTENT_ALIASES[key];
  if (mapped && SHOP_BOT_INTENTS.includes(mapped)) return mapped;
  return undefined;
}

function parseOccasion(raw: string | undefined): ShopBotOccasion | undefined {
  if (!raw) return undefined;
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const mapped = OCCASION_ALIASES[key] ?? OCCASION_ALIASES[raw.trim().toLowerCase()];
  if (mapped && SHOP_BOT_OCCASIONS.includes(mapped)) return mapped;
  return undefined;
}

function parseBudget(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 50_000 || n > 20_000_000) return undefined;
  return Math.round(n);
}

function parseSource(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().slice(0, 40).replace(/[^\w.-]/g, "");
  return cleaned || undefined;
}

/** Whitelist + sanitize assistant deep-link query params. Never keep PII. */
export function parseShopBotParams(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
): ShopBotDeepLink {
  const get = (key: string) => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    return firstString(searchParams[key]);
  };

  const openRaw = get("open");
  return {
    intent: parseIntent(get("intent")),
    occasion: parseOccasion(get("occasion")),
    budgetMaxVnd: parseBudget(get("budget")),
    source: parseSource(get("source")),
    open:
      openRaw === "1" ||
      openRaw === "true" ||
      Boolean(parseIntent(get("intent"))) ||
      Boolean(parseBudget(get("budget"))) ||
      Boolean(parseOccasion(get("occasion"))),
  };
}

export function budgetBandLabel(budgetMaxVnd: number): string {
  const known = BUDGET_CHIPS_VND.find((v) => v === budgetMaxVnd);
  if (known) return String(known);
  if (budgetMaxVnd <= 250_000) return "under-250k";
  if (budgetMaxVnd <= 400_000) return "250-400k";
  if (budgetMaxVnd <= 700_000) return "400-700k";
  if (budgetMaxVnd <= 1_200_000) return "700k-1.2m";
  return "over-1.2m";
}

export function buildAssistantPath(
  locale: "en" | "vi",
  params: Partial<ShopBotDeepLink> = {},
): string {
  const q = new URLSearchParams();
  if (params.intent) q.set("intent", params.intent);
  if (params.occasion) q.set("occasion", params.occasion);
  if (params.budgetMaxVnd) q.set("budget", String(params.budgetMaxVnd));
  if (params.source) q.set("source", params.source);
  const qs = q.toString();
  return qs ? `/${locale}/assistant?${qs}` : `/${locale}/assistant`;
}

/** Studio paste-ready social deep links (manual / native auto-reply only). */
export function socialDeepLinkExamples(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    vi: {
      budget300: `${base}${buildAssistantPath("vi", { budgetMaxVnd: 300_000, source: "zalo" })}`,
      shop: `${base}/vi/shop`,
      custom: `${base}/vi/custom`,
      vouchers: `${base}${buildAssistantPath("vi", { intent: "gift", source: "zalo-voucher" })}`,
    },
    en: {
      budget300: `${base}${buildAssistantPath("en", { budgetMaxVnd: 300_000, source: "whatsapp" })}`,
      shop: `${base}/en/shop`,
      custom: `${base}/en/custom`,
      vouchers: `${base}${buildAssistantPath("en", { intent: "gift", source: "wa-voucher" })}`,
    },
  };
}
