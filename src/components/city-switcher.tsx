"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";
import { useLocation } from "@/context/location-context";
import { IconPin } from "@/components/nav-icons";

export function CitySwitcher({
  locale,
  dictionary,
  align = "left",
}: {
  locale: Locale;
  dictionary: Dictionary;
  align?: "left" | "right";
}) {
  const { cities, activeCity, setCity, pending } = useLocation();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = dictionary.location;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPendingSlug(null);
        setOpen(false);
      }
    }
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPendingSlug(null);
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

  async function applyCity(slug: string) {
    setPendingSlug(null);
    setOpen(false);
    await setCity(slug);
  }

  function requestCity(slug: string) {
    if (slug === activeCity.slug) {
      setOpen(false);
      return;
    }
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.chooseCity}: ${cityName}`}
        disabled={pending}
        onClick={() => {
          setPendingSlug(null);
          setOpen((v) => !v);
        }}
        className="group mt-1 inline-flex max-w-[11rem] items-center gap-1 rounded-md py-0.5 text-left text-[10px] tracking-[0.18em] text-moss uppercase transition hover:text-citrus disabled:opacity-60 sm:max-w-none"
      >
        <IconPin className="h-2.5 w-2.5 shrink-0 text-citrus/80 group-hover:text-citrus" />
        <span className="truncate font-medium">{cityName}</span>
        <span
          aria-hidden
          className="text-[8px] tracking-normal text-moss/80 group-hover:text-citrus"
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className={`glass-menu absolute top-full z-50 mt-2 min-w-[15rem] rounded-2xl p-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {pendingSlug && pendingCity ? (
            <div className="space-y-3 px-2 py-2">
              <p className="text-[10px] tracking-[0.16em] text-moss uppercase">
                {t.switchConfirmTitle}
              </p>
              <p className="text-sm leading-5 text-forest normal-case tracking-normal">
                {t.switchConfirmBody
                  .replace("{count}", String(count))
                  .replace("{city}", pendingName)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
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
          ) : (
            <>
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
                    onClick={() => requestCity(city.slug)}
                    className={`flex w-full min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm normal-case tracking-normal transition ${
                      selected
                        ? "bg-citrus/12 text-forest"
                        : "text-forest hover:bg-cream/70"
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
              <p className="mt-1 border-t border-forest/10 px-3 pt-2 pb-1 text-[11px] leading-4 text-moss normal-case tracking-normal">
                {t.switchNote}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
