"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useLocation } from "@/context/location-context";

/** Soft notice when the active city does not accept orders yet. */
export function LocationBanner({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { activeCity, acceptsOrders, setCity, cities } = useLocation();
  if (acceptsOrders) return null;

  const t = dictionary.location;
  const cityName =
    locale === "vi" ? activeCity.nameVi : activeCity.nameEn;
  const openCity = cities.find((c) => c.acceptsOrders);

  return (
    <div className="border-b border-citrus/20 bg-citrus/8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm leading-6 text-forest">
          <span className="font-medium">{cityName}</span>
          {" — "}
          {t.comingSoonBody}
        </p>
        {openCity ? (
          <button
            type="button"
            onClick={() => void setCity(openCity.slug)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-forest px-5 text-[11px] tracking-[0.14em] text-ivory uppercase"
          >
            {t.orderFrom.replace(
              "{city}",
              locale === "vi" ? openCity.nameVi : openCity.nameEn,
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
