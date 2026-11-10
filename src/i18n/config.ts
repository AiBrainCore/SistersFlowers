export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

/** First visit / bare `/` opens Vietnamese; English is opt-in via the switcher. */
export const defaultLocale: Locale = "vi";

/** Remembers last chosen language when landing on `/`. */
export const LOCALE_COOKIE = "sf_locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
