"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { IconSearch } from "@/components/nav-icons";

type Variant = "desktop" | "mobileBar" | "mobileMenu";

/**
 * Site-wide catalog search in the header.
 * Always opens /shop?q=… (fresh query — does not keep shop filters).
 */
export function HeaderSearch({
  locale,
  dictionary,
  variant,
  onNavigated,
}: {
  locale: Locale;
  dictionary: Dictionary;
  variant: Variant;
  onNavigated?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const onShop = pathname?.includes("/shop") ?? false;
  const urlQ = onShop ? searchParams.get("q") || "" : "";

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (open && variant === "mobileBar") {
      inputRef.current?.focus();
    }
  }, [open, variant]);

  useEffect(() => {
    if (!open || variant !== "mobileBar") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, variant]);

  function go(event: FormEvent) {
    event.preventDefault();
    const trimmed = q.trim();
    const href = trimmed
      ? `/${locale}/shop?q=${encodeURIComponent(trimmed)}`
      : `/${locale}/shop`;
    router.push(href);
    setOpen(false);
    onNavigated?.();
  }

  const t = dictionary.shop;
  const aria = dictionary.nav.searchAria || t.search;

  if (variant === "mobileBar") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={aria}
          title={aria}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white transition hover:bg-white/25 sm:h-11 sm:w-11 min-[1200px]:hidden"
        >
          <IconSearch className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        {open ? (
          <div
            className="fixed inset-x-0 top-0 z-[70] border-b border-citrus/20 bg-citrus px-3 py-2.5 shadow-lg min-[1200px]:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={aria}
          >
            <form
              onSubmit={go}
              className="mx-auto flex max-w-6xl items-center gap-2"
              role="search"
            >
              <label className="sr-only" htmlFor={inputId}>
                {t.search}
              </label>
              <div className="relative min-w-0 flex-1">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-citrus/80" />
                <input
                  ref={inputRef}
                  id={inputId}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="min-h-11 w-full rounded-full border-0 bg-cream pl-10 pr-3 text-sm text-forest outline-none ring-2 ring-white/40 placeholder:text-moss/70 focus:ring-white"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-4 text-[11px] font-medium tracking-[0.12em] text-citrus uppercase"
              >
                {t.search}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dictionary.nav.searchClose || dictionary.nav.close}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-white"
              >
                ✕
              </button>
            </form>
          </div>
        ) : null}
      </>
    );
  }

  if (variant === "mobileMenu") {
    return (
      <form
        onSubmit={go}
        className="mb-4"
        role="search"
      >
        <label className="sr-only" htmlFor={inputId}>
          {t.search}
        </label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-citrus" />
          <input
            id={inputId}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-12 w-full rounded-full border border-forest/12 bg-cream pl-11 pr-24 text-sm text-forest outline-none placeholder:text-moss/70 focus:border-citrus"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 inline-flex min-h-9 items-center rounded-full bg-citrus px-3.5 text-[11px] tracking-[0.12em] text-ivory uppercase"
          >
            {t.search}
          </button>
        </div>
      </form>
    );
  }

  // desktop
  return (
    <form
      onSubmit={go}
      className="hidden min-w-0 flex-1 max-w-[18rem] xl:max-w-[22rem] min-[1200px]:block"
      role="search"
    >
      <label className="sr-only" htmlFor={inputId}>
        {t.search}
      </label>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-citrus/85" />
        <input
          id={inputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-10 w-full rounded-full border border-white/25 bg-white/95 pl-9 pr-3 text-[13px] text-forest shadow-[0_1px_0_rgba(255,255,255,0.35)] outline-none placeholder:text-moss/65 transition focus:border-white focus:bg-white focus:ring-2 focus:ring-white/50"
        />
      </div>
    </form>
  );
}
