"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { IconGlobe } from "@/components/nav-icons";

const LOCALE_LABEL: Record<Locale, keyof Dictionary["language"]> = {
  en: "en",
  vi: "vi",
};

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LanguageSwitch({
  locale,
  dictionary,
  variant = "desktop",
  tone = "default",
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** desktop = compact globe trigger; panel = full list for mobile drawer */
  variant?: "desktop" | "panel";
  /** onBrand = white controls for the citrus glass header */
  tone?: "default" | "onBrand";
}) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");
  const hrefFor = (item: Locale) => `/${item}${rest ? `/${rest}` : ""}`;
  const t = dictionary.language;
  const [, startTransition] = useTransition();

  if (variant === "panel") {
    return (
      <div className="space-y-1">
        <p className="px-1 text-[10px] tracking-[0.16em] text-moss uppercase">
          {t.label}
        </p>
        <div className="flex flex-col gap-1">
          {locales.map((item) => {
            const selected = item === locale;
            return (
              <Link
                key={item}
                href={hrefFor(item)}
                prefetch
                onClick={() => {
                  rememberLocale(item);
                  startTransition(() => undefined);
                }}
                className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-sm transition ${
                  selected
                    ? "bg-citrus/12 text-forest"
                    : "text-forest hover:bg-cream/80"
                }`}
              >
                <span>{t[LOCALE_LABEL[item]]}</span>
                {selected ? (
                  <span className="text-citrus" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <LanguageDropdown
      locale={locale}
      dictionary={dictionary}
      tone={tone}
    />
  );
}

function LanguageDropdown({
  locale,
  dictionary,
  tone = "default",
}: {
  locale: Locale;
  dictionary: Dictionary;
  tone?: "default" | "onBrand";
}) {
  const onBrand = tone === "onBrand";
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = dictionary.language;

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t.label}
        title={t.label}
        onClick={() => setOpen((v) => !v)}
        className={
          onBrand
            ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white transition hover:bg-white/25"
            : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-forest/12 bg-white/55 text-forest transition hover:border-citrus/35"
        }
      >
        {/* Icon-only — matches bag / account; language names stay in the menu */}
        <IconGlobe className="h-5 w-5" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t.label}
          className="glass-menu absolute top-full right-0 z-50 mt-1.5 min-w-[11.5rem] rounded-2xl p-2"
        >
          {locales.map((item) => {
            const selected = item === locale;
            return (
              <Link
                key={item}
                role="option"
                aria-selected={selected}
                href={`/${item}${rest ? `/${rest}` : ""}`}
                prefetch
                onClick={() => {
                  rememberLocale(item);
                  setOpen(false);
                }}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm normal-case tracking-normal transition ${
                  selected
                    ? "bg-citrus/12 text-forest"
                    : "text-forest hover:bg-cream/70"
                }`}
              >
                <span>{t[LOCALE_LABEL[item]]}</span>
                {selected ? (
                  <span className="text-citrus" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
