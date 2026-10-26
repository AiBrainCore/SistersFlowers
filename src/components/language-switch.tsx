"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { IconGlobe } from "@/components/nav-icons";

const LOCALE_LABEL: Record<Locale, keyof Dictionary["language"]> = {
  en: "en",
  vi: "vi",
};

export function LanguageSwitch({
  locale,
  dictionary,
  variant = "desktop",
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** desktop = compact globe trigger; panel = full list for mobile drawer */
  variant?: "desktop" | "panel";
}) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");
  const hrefFor = (item: Locale) => `/${item}${rest ? `/${rest}` : ""}`;
  const t = dictionary.language;

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

  return <LanguageDropdown locale={locale} dictionary={dictionary} />;
}

function LanguageDropdown({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
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
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-forest/12 bg-white/55 px-2 text-[11px] tracking-[0.1em] text-forest uppercase transition hover:border-citrus/35 sm:min-w-0 sm:gap-1.5 sm:px-2.5"
      >
        <IconGlobe className="h-3.5 w-3.5 shrink-0 text-moss" />
        <span className="font-medium">{locale}</span>
        <span aria-hidden className="hidden text-[9px] text-moss sm:inline">
          ▾
        </span>
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
                onClick={() => setOpen(false)}
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
