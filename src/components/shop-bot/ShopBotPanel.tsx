"use client";

import { useEffect, useId, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ShopBotDeepLink } from "@/features/shop-bot/types";
import { trackClosed } from "@/features/shop-bot/analytics";
import { ShopBotFlow } from "./ShopBotFlow";

export function ShopBotPanel({
  locale,
  dictionary,
  open,
  onClose,
  deepLink,
}: {
  locale: Locale;
  dictionary: Dictionary;
  open: boolean;
  onClose: () => void;
  deepLink?: ShopBotDeepLink;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        trackClosed("greeting");
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label={dictionary.shopBot.close}
        className="absolute inset-0 bg-forest/35"
        onClick={() => {
          trackClosed("greeting");
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[min(92dvh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl sm:h-full sm:rounded-none sm:rounded-l-3xl"
      >
        <span id={titleId} className="sr-only">
          {dictionary.shopBot.pageTitle}
        </span>
        <button ref={closeRef} type="button" className="sr-only">
          {dictionary.shopBot.close}
        </button>
        <ShopBotFlow
          key={`${locale}-${deepLink?.source || "panel"}-${deepLink?.intent || ""}-${deepLink?.budgetMaxVnd || ""}`}
          locale={locale}
          dictionary={dictionary}
          deepLink={deepLink}
          onClose={() => {
            trackClosed("greeting");
            onClose();
          }}
        />
      </div>
    </div>
  );
}
