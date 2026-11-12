"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";
import { useLocation } from "@/context/location-context";
import { IconPin } from "@/components/nav-icons";

/**
 * Explicit delivery-city control — not a nav menu item.
 * Used on shop / checkout so testers understand city = where flowers are delivered.
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
  const [open, setOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const t = dictionary.location;
  const cityName = locale === "vi" ? activeCity.nameVi : activeCity.nameEn;

  async function applyCity(slug: string) {
    setPendingSlug(null);
    setOpen(false);
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
    <div className="relative mt-5 rounded-2xl border border-forest/10 bg-cream/70 px-4 py-2.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-forest">
          <span className="text-[11px] tracking-[0.16em] text-citrus uppercase">
            {t.deliveringIn}
          </span>
          <IconPin className="h-3.5 w-3.5 shrink-0 text-citrus" />
          <span className="serif text-lg leading-none">{cityName}</span>
        </p>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-forest/15 bg-white px-4 text-[11px] tracking-[0.14em] text-forest uppercase transition hover:border-citrus/40"
        >
          {t.chooseCity}
        </button>
      </div>

      {open ? (
        <div
          role="group"
          aria-label={t.chooseCity}
          className="mt-3 grid gap-2 sm:grid-cols-2"
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
                className={`flex min-h-12 items-center justify-between rounded-xl px-3.5 text-left text-sm transition disabled:opacity-45 ${
                  selected
                    ? "bg-citrus text-white"
                    : "border border-forest/10 bg-white text-forest hover:border-citrus/35"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <IconPin
                    className={`h-3.5 w-3.5 ${selected ? "text-white" : "text-citrus"}`}
                  />
                  {name}
                </span>
                {selected ? <span aria-hidden>✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {pendingSlug && pendingCity ? (
        <div className="glass-menu mt-3 rounded-2xl p-3">
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
