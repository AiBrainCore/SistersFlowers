"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useLocation } from "@/context/location-context";

export function CitySwitcher({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { cities, activeCity, setCity, pending } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = dictionary.location;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const cityName =
    locale === "vi" ? activeCity.nameVi : activeCity.nameEn;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 max-w-[11rem] items-center gap-1.5 rounded-full border border-forest/15 bg-white/70 px-3 text-[11px] tracking-[0.08em] text-forest transition hover:border-citrus/40 disabled:opacity-60 sm:max-w-none"
      >
        <span className="truncate">
          <span className="hidden text-moss sm:inline">{t.deliveringIn} </span>
          <span className="font-medium">{cityName}</span>
        </span>
        <span aria-hidden className="text-[9px] text-moss">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1 min-w-[14rem] rounded-2xl border border-forest/10 bg-paper p-2 shadow-[0_16px_40px_rgba(36,53,42,0.12)]"
        >
          <p className="px-3 py-2 text-[10px] tracking-[0.16em] text-moss uppercase">
            {t.chooseCity}
          </p>
          {cities.map((city) => {
            const name = locale === "vi" ? city.nameVi : city.nameEn;
            const selected = city.slug === activeCity.slug;
            const statusLabel =
              city.status === "open"
                ? t.openNow
                : city.status === "coming_soon"
                  ? t.comingSoon
                  : t.inactive;
            return (
              <button
                key={city.slug}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  void setCity(city.slug);
                }}
                className={`flex w-full min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-citrus/10 text-forest"
                    : "text-forest hover:bg-cream/80"
                }`}
              >
                <span>{name}</span>
                <span
                  className={`shrink-0 text-[10px] tracking-[0.12em] uppercase ${
                    city.status === "open" ? "text-meadow" : "text-moss/70"
                  }`}
                >
                  {statusLabel}
                </span>
              </button>
            );
          })}
          <p className="mt-1 border-t border-forest/10 px-3 pt-2 pb-1 text-[11px] leading-4 text-moss">
            {t.switchNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
