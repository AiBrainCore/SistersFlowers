import type { ShopBotHotelHints } from "./types";

export const SHOP_BOT_CHECKOUT_HINTS_KEY = "sf-shop-bot-checkout-hints";

export type ShopBotCheckoutHints = {
  hotelName?: string;
  recipientName?: string;
  notes?: string;
};

/** Client-only handoff into existing checkout fields. Not for URLs or analytics. */
export function saveCheckoutHints(hints: ShopBotCheckoutHints) {
  if (typeof window === "undefined") return;
  try {
    const clean: ShopBotCheckoutHints = {};
    if (hints.hotelName?.trim()) clean.hotelName = hints.hotelName.trim().slice(0, 120);
    if (hints.recipientName?.trim()) {
      clean.recipientName = hints.recipientName.trim().slice(0, 120);
    }
    if (hints.notes?.trim()) clean.notes = hints.notes.trim().slice(0, 400);
    if (!clean.hotelName && !clean.recipientName && !clean.notes) {
      window.sessionStorage.removeItem(SHOP_BOT_CHECKOUT_HINTS_KEY);
      return;
    }
    window.sessionStorage.setItem(
      SHOP_BOT_CHECKOUT_HINTS_KEY,
      JSON.stringify(clean),
    );
  } catch {
    // ignore
  }
}

export function readCheckoutHints(): ShopBotCheckoutHints | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SHOP_BOT_CHECKOUT_HINTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShopBotCheckoutHints;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutHints() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SHOP_BOT_CHECKOUT_HINTS_KEY);
  } catch {
    // ignore
  }
}

export function hotelHintsToCheckout(
  hotel: ShopBotHotelHints,
): ShopBotCheckoutHints {
  return {
    hotelName: hotel.name,
    recipientName: hotel.recipient,
    notes: hotel.note,
  };
}
