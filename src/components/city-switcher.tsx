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

  return (
    <div className={`relative ${isHero ? "" : "mt-1"}`}>
      <div
        role="group"
        aria-label={t.chooseCity}
        className={
          isHero
            ? "inline-flex max-w-full flex-wrap items-baseline gap-x-3 gap-y-1"
            : "inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] tracking-[0.16em] uppercase"
        }
      >
        {cities.map((city, index) => {
          const name = locale === "vi" ? city.nameVi : city.nameEn;
          const selected = city.slug === activeCity.slug;
          const disabled = pending || city.status !== "open";
          return (
            <span
              key={city.slug}
              className={
                isHero
                  ? "inline-flex items-baseline gap-x-2.5"
                  : "inline-flex items-center gap-x-1.5"
              }
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={
                    isHero
                      ? "serif text-2xl text-moss/35 sm:text-3xl"
                      : onBrand
                        ? "text-white/45"
                        : "text-moss/45"
                  }
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
                className={
                  isHero
                    ? `inline-flex min-h-12 items-baseline gap-1.5 rounded-sm transition disabled:opacity-45 ${
                        selected
                          ? "serif text-[2.15rem] leading-none font-normal text-citrus sm:text-[2.75rem]"
                          : "serif text-[1.55rem] leading-none text-moss/40 hover:text-citrus sm:text-[2rem]"
                      }`
                    : `inline-flex min-h-8 items-center gap-1 rounded-sm px-0.5 transition disabled:opacity-45 ${
                        selected
                          ? onBrand
                            ? "font-semibold text-white"
                            : "font-semibold text-citrus"
                          : onBrand
                            ? "font-medium text-white/65 hover:text-white"
                            : "font-medium text-moss/65 hover:text-citrus"
                      }`
                }
              >
                {selected ? (
                  <IconPin
                    className={
                      isHero
                        ? "mb-0.5 h-3.5 w-3.5 shrink-0 self-center text-citrus sm:h-4 sm:w-4"
                        : onBrand
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

      {pendingSlug && pendingCity ? (
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
      ) : null}
    </div>
  );
}
