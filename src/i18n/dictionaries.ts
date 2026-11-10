import type { Locale } from "./config";
import { en } from "./messages/en";
import { vi } from "./messages/vi";

export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, vi };

const cityCache = new Map<string, Dictionary>();

function applyCityPlaceholders(value: unknown, cityName: string): unknown {
  if (typeof value === "string") {
    return value.replaceAll("{city}", cityName);
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyCityPlaceholders(item, cityName));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = applyCityPlaceholders(nested, cityName);
    }
    return out;
  }
  return value;
}

/** Pass `cityName` so every `{city}` token matches the active studio. */
export function getDictionary(locale: Locale, cityName?: string): Dictionary {
  const base = dictionaries[locale];
  if (!cityName) return base;
  const key = `${locale}:${cityName}`;
  const hit = cityCache.get(key);
  if (hit) return hit;
  const next = applyCityPlaceholders(base, cityName) as Dictionary;
  cityCache.set(key, next);
  return next;
}
