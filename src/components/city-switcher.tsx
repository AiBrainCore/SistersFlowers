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
  variant = "compact",
  tone = "default",
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** Kept for call-site compat; unused with the inline switcher */
  align?: "left" | "right";
  /** compact = header under logo; hero = large city names in the homepage hero */
  variant?: "compact" | "hero";
  /** onBrand = white type for the citrus glass header */
  tone?: "default" | "onBrand";
}) {
  const { cities, activeCity, setCity, pending } = useLocation();
  const { count } = useCart();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const t = dictionary.location;
  const isHero = variant === "hero";
  const onBrand = tone === "onBrand" && !isHero;

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

  const confirmPanel =
    pendingSlug && pendingCity ? (
      <div
        className={`glass-menu absolute z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl p-3 ${
          isHero ? "top-full left-0" : "top-full left-0"
        }`}
      >
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
    ) : null;

  if (isHero) {
    return (
      <div className="relative w-full max-w-lg">
        <div
          role="group"
          aria-label={t.chooseCity}
          className="grid grid-cols-2 gap-2.5 sm:gap-3"
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
                aria-current={selected ? "true" : undefined}
                disabled={disabled}
                onClick={() => requestCity(city.slug)}
                className={`relative flex min-h-12 items-center rounded-2xl px-3.5 py-3 text-left transition disabled:opacity-45 sm:min-h-[3.25rem] sm:rounded-[1.25rem] sm:px-4 ${
                  selected
                    ? "bg-citrus text-white shadow-[0_10px_28px_rgba(176,84,44,0.28)]"
                    : "border border-white/70 bg-white/80 text-forest shadow-[0_8px_24px_rgba(44,41,38,0.06)] hover:bg-white"
                }`}
              >
                <span className="inline-flex items-center gap-1.5 pr-6">
                  <IconPin
                    className={`h-3.5 w-3.5 shrink-0 ${selected ? "text-white" : "text-citrus"}`}
                  />
                  <span className="serif text-lg leading-none sm:text-xl">
                    {name}
                  </span>
                </span>
                {selected ? (
                  <span
                    className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-citrus"
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {confirmPanel}
      </div>
    );
  }

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
            <span
              key={city.slug}
              className="inline-flex items-center gap-x-1.5"
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={onBrand ? "text-white/45" : "text-moss/45"}
                >
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
                    ? onBrand
                      ? "font-semibold text-white"
                      : "font-semibold text-citrus"
                    : onBrand
                      ? "font-medium text-white/65 hover:text-white"
                      : "font-medium text-moss/65 hover:text-citrus"
                }`}
              >
                {selected ? (
                  <IconPin
                    className={
                      onBrand
                        ? "h-2.5 w-2.5 shrink-0 text-white"
                        : "h-2.5 w-2.5 shrink-0 text-citrus"
                    }
                    aria-hidden
                  />
                ) : null}
                {name}
              </button>
            </span>
          );
        })}
      </div>
      {confirmPanel}
    </div>
  );
}
