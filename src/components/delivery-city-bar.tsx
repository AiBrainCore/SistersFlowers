"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";
import { useLocation } from "@/context/location-context";
import { IconPin } from "@/components/nav-icons";

/**
 * Compact studio/city switcher — two shops stay visually clear, without a tall empty bar.
 */
export function DeliveryCityBar({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { cities, activeCity, setCity, pending } = useLocation();
  const { count } = useCart();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const t = dictionary.location;

  async function applyCity(slug: string) {
    setPendingSlug(null);
    await setCity(slug);
  }

  function requestCity(slug: string) {
    if (slug === activeCity.slug || pending) return;
    if (count > 0) {
      setPendingSlug(slug);
      return;
    }
    void applyCity(slug);
  }

  const pendingCity = cities.find((c) => c.slug === pendingSlug);
  const pendingName = pendingCity
    ? locale === "vi"
      ? pendingCity.nameVi
      : pendingCity.nameEn
    : "";

  return (
    <div className="relative mt-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[11px] tracking-[0.16em] text-citrus uppercase">
          {t.deliveringIn}
        </span>
        <div
          role="group"
          aria-label={t.chooseCity}
          className="inline-flex rounded-full border border-forest/12 bg-white p-1 shadow-[0_6px_20px_rgba(44,58,48,0.05)]"
        >
          {cities.map((city) => {
            const name = locale === "vi" ? city.nameVi : city.nameEn;
            const selected = city.slug === activeCity.slug;
            const disabled = pending || city.status !== "open";
            return (
              <button
                key={city.slug}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => requestCity(city.slug)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm transition disabled:opacity-45 ${
                  selected
                    ? "bg-citrus text-white"
                    : "text-forest hover:bg-cream/90"
                }`}
              >
                <IconPin
                  className={`h-3.5 w-3.5 ${selected ? "text-white" : "text-citrus"}`}
                />
                <span className={selected ? "font-medium" : ""}>{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pendingSlug && pendingCity ? (
        <div className="glass-menu mt-3 max-w-md rounded-2xl p-3">
          <p className="text-[10px] tracking-[0.16em] text-moss uppercase">
            {t.switchConfirmTitle}
          </p>
          <p className="mt-2 text-sm leading-5 text-forest">
            {t.switchConfirmBody
              .replace("{count}", String(count))
              .replace("{city}", pendingName)}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setPendingSlug(null)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-forest/15 px-3 text-[11px] tracking-[0.12em] uppercase"
            >
              {t.switchConfirmKeep}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void applyCity(pendingSlug)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-forest px-3 text-[11px] tracking-[0.12em] text-ivory uppercase disabled:opacity-60"
            >
              {t.switchConfirmClear}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
