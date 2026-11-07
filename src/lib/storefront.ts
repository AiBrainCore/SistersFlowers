import type { Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { getActiveCity, type CityPublic } from "@/lib/locations";

export function cityDisplayName(city: CityPublic, locale: Locale) {
  return locale === "vi" ? city.nameVi : city.nameEn;
}

/** Dictionary with `{city}` filled from the active studio. */
export async function getStorefrontDictionary(locale: Locale): Promise<{
  dictionary: Dictionary;
  activeCity: CityPublic;
  cityName: string;
}> {
  const activeCity = await getActiveCity();
  const cityName = cityDisplayName(activeCity, locale);
  return {
    dictionary: getDictionary(locale, cityName),
    activeCity,
    cityName,
  };
}
