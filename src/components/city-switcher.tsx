"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";
import { useLocation } from "@/context/location-context";
import { IconPin } from "@/components/nav-icons";

export function CitySwitcher({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** Kept for call-site compat; unused with the inline switcher */
  align?: "left" | "right";
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
    <div className="relative mt-1">
      <div
        role="group"
        aria-label={t.chooseCity}
        className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] tracking-[0.16em] uppercase"
      >
        {cities.map((city, index) => {
          const name = locale === "vi" ? city.nameVi : city.nameEn;
          const selected = city.slug === activeCity.slug;
          const disabled = pending || city.status !== "open";
          return (
            <span key={city.slug} className="inline-flex items-center gap-x-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-moss/45">
                  ·
                </span>
              ) : null}
              <button
                type="button"
                aria-pressed={selected}
                aria-current={selected ? "true" : undefined}
                disabled={disabled}
                onClick={() => requestCity(city.slug)}
                className={`inline-flex min-h-8 items-center gap-1 rounded-sm px-0.5 transition disabled:opacity-45 ${
                  selected
                    ? "font-semibold text-citrus"
                    : "font-medium text-moss/65 hover:text-citrus"
                }`}
              >
                {selected ? (
                  <IconPin
                    className="h-2.5 w-2.5 shrink-0 text-citrus"
                    aria-hidden
                  />
                ) : null}
                {name}
              </button>
            </span>
          );
        })}
      </div>

      {pendingSlug && pendingCity ? (
        <div className="glass-menu absolute top-full left-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl p-3">
          <p className="text-[10px] tracking-[0.16em] text-moss uppercase">
            {t.switchConfirmTitle}
          </p>
          <p className="mt-2 text-sm leading-5 text-forest normal-case tracking-normal">
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
