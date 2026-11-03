import type {
  ShopBotDeepLink,
  ShopBotIntent,
  ShopBotOccasion,
  ShopBotState,
  ShopBotStep,
} from "./types";

export function createInitialShopBotState(
  locale: "en" | "vi",
  deepLink: ShopBotDeepLink = {},
): ShopBotState {
  const state: ShopBotState = {
    step: "greeting",
    locale,
    city: "dalat",
    selectedAddonIds: [],
    hotel: {},
    source: deepLink.source,
    intent: deepLink.intent,
    occasion: deepLink.occasion,
    budgetMaxVnd: deepLink.budgetMaxVnd,
  };

  // Skip ahead when deep link already answered early questions.
  if (deepLink.intent === "browse") {
    state.step = "recommendations";
    return state;
  }
  if (deepLink.intent && deepLink.budgetMaxVnd) {
    state.step = "recommendations";
    return state;
  }
  if (deepLink.intent && deepLink.occasion) {
    state.step = "budget";
    return state;
  }
  if (deepLink.intent) {
    state.step = "occasion";
    return state;
  }
  if (deepLink.budgetMaxVnd || deepLink.occasion) {
    state.step = "intent";
  }
  return state;
}

export function restartShopBot(locale: "en" | "vi", source?: string): ShopBotState {
  return {
    step: "greeting",
    locale,
    city: "dalat",
    selectedAddonIds: [],
    hotel: {},
    source,
  };
}

function clearSelection(state: ShopBotState): ShopBotState {
  return {
    ...state,
    selectedProductId: undefined,
    selectedAddonIds: [],
    filtersRelaxed: undefined,
  };
}

export function shopBotBack(state: ShopBotState): ShopBotState {
  switch (state.step) {
    case "intent":
      return { ...state, step: "greeting" };
    case "occasion":
      return { ...state, step: "intent" };
    case "budget":
      return { ...state, step: "occasion" };
    case "recommendations":
      if (state.intent === "browse") return { ...state, step: "intent" };
      return { ...state, step: "budget" };
    case "product":
      return { ...state, step: "recommendations", selectedProductId: undefined };
    case "extras":
      return { ...state, step: "product" };
    case "review":
      return { ...state, step: "extras" };
    case "handoff":
      return { ...state, step: "review" };
    default:
      return state;
  }
}

export function selectIntent(
  state: ShopBotState,
  intent: ShopBotIntent,
): ShopBotState {
  const next = clearSelection({ ...state, intent });
  if (intent === "browse") {
    return { ...next, step: "recommendations", occasion: undefined, budgetMaxVnd: undefined };
  }
  return { ...next, step: "occasion" };
}

export function selectOccasion(
  state: ShopBotState,
  occasion: ShopBotOccasion | "skip",
): ShopBotState {
  return {
    ...clearSelection(state),
    occasion: occasion === "skip" ? undefined : occasion,
    step: "budget",
  };
}

export function selectBudget(
  state: ShopBotState,
  budgetMaxVnd: number | "skip",
): ShopBotState {
  return {
    ...clearSelection(state),
    budgetMaxVnd: budgetMaxVnd === "skip" ? undefined : budgetMaxVnd,
    step: "recommendations",
  };
}

export function selectProduct(
  state: ShopBotState,
  productId: string,
): ShopBotState {
  return {
    ...state,
    selectedProductId: productId,
    selectedAddonIds: [],
    step: "product",
  };
}

export function confirmProduct(state: ShopBotState): ShopBotState {
  if (!state.selectedProductId) return state;
  return { ...state, step: "extras" };
}

export function toggleAddon(state: ShopBotState, addonId: string): ShopBotState {
  const has = state.selectedAddonIds.includes(addonId);
  return {
    ...state,
    selectedAddonIds: has
      ? state.selectedAddonIds.filter((id) => id !== addonId)
      : [...state.selectedAddonIds, addonId],
  };
}

export function skipExtras(state: ShopBotState): ShopBotState {
  return { ...state, selectedAddonIds: [], step: "review" };
}

export function confirmExtras(state: ShopBotState): ShopBotState {
  return { ...state, step: "review" };
}

export function markHandoff(state: ShopBotState): ShopBotState {
  return { ...state, step: "handoff" };
}

export function setHotelHints(
  state: ShopBotState,
  hotel: ShopBotState["hotel"],
): ShopBotState {
  return {
    ...state,
    hotel: {
      name: hotel.name?.trim().slice(0, 120) || undefined,
      recipient: hotel.recipient?.trim().slice(0, 120) || undefined,
      note: hotel.note?.trim().slice(0, 400) || undefined,
    },
  };
}

export function setFiltersRelaxed(
  state: ShopBotState,
  filtersRelaxed: boolean,
): ShopBotState {
  return { ...state, filtersRelaxed };
}

/** Soft progress for optional early steps (intent → checkout). */
export function shopBotProgress(step: ShopBotStep): { current: number; total: number } {
  const order: ShopBotStep[] = [
    "greeting",
    "intent",
    "occasion",
    "budget",
    "recommendations",
    "product",
    "extras",
    "review",
    "handoff",
  ];
  const idx = Math.max(0, order.indexOf(step));
  return { current: Math.min(idx + 1, 8), total: 8 };
}
