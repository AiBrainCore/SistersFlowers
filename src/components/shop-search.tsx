"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CatalogQuery } from "@/lib/products";

/** Inline shop search — keeps other catalog filters when submitting. */
export function ShopSearch({
  locale,
  dictionary,
  initial,
}: {
  locale: Locale;
  dictionary: Dictionary;
  initial: CatalogQuery;
}) {
  const router = useRouter();
  const t = dictionary.shop;
  const [q, setQ] = useState(initial.q || "");

  useEffect(() => {
    setQ(initial.q || "");
  }, [initial.q]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const next = q.trim();
    if (next) params.set("q", next);
    if (initial.category) params.set("category", initial.category);
    if (initial.productType) params.set("type", initial.productType);
    if (initial.sort && initial.sort !== "featured") {
      params.set("sort", initial.sort);
    }
    if (initial.size) params.set("size", initial.size);
    if (initial.accent) params.set("accent", initial.accent);
    if (initial.style) params.set("style", initial.style);
    const qs = params.toString();
    router.push(`/${locale}/shop${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md lg:max-w-lg"
      role="search"
    >
      <label className="sr-only" htmlFor="shop-search">
        {t.search}
      </label>
      <input
        id="shop-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="min-h-10 w-full min-w-0 rounded-full border border-forest/12 bg-white px-3.5 text-sm outline-none focus:border-citrus"
      />
      <button
        type="submit"
        className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-citrus px-4 text-[11px] tracking-[0.12em] text-ivory uppercase"
      >
        {t.search}
      </button>
    </form>
  );
}
