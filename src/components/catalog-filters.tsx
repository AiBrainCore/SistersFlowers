"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  FEATURED_CATEGORY_SLUGS,
  type CategoryPublic,
} from "@/lib/category-constants";
import type { CatalogQuery } from "@/lib/products";

const PRICE_PRESETS = [
  { id: "u500", min: 0, max: 500000 },
  { id: "500-800", min: 500000, max: 800000 },
  { id: "800-1200", min: 800000, max: 1200000 },
  { id: "1200p", min: 1200000, max: undefined },
] as const;

export function CatalogFilters({
  locale,
  dictionary,
  categories,
  initial,
  resultCount,
}: {
  locale: Locale;
  dictionary: Dictionary;
  categories: CategoryPublic[];
  initial: CatalogQuery;
  resultCount: number;
}) {
  const router = useRouter();
  const t = dictionary.shop;
  const [open, setOpen] = useState(false);
  const [showAllOccasions, setShowAllOccasions] = useState(
    Boolean(
      initial.category &&
        !FEATURED_CATEGORY_SLUGS.includes(
          initial.category as (typeof FEATURED_CATEGORY_SLUGS)[number],
        ),
    ),
  );
  const [q, setQ] = useState(initial.q || "");
  const [category, setCategory] = useState(initial.category || "");
  const [minPrice, setMinPrice] = useState(
    initial.minPrice != null ? String(initial.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initial.maxPrice != null ? String(initial.maxPrice) : "",
  );
  const [sort, setSort] = useState(initial.sort || "featured");

  const withProducts = useMemo(
    () => categories.filter((c) => (c.productCount ?? 0) > 0),
    [categories],
  );

  const featured = useMemo(
    () =>
      FEATURED_CATEGORY_SLUGS.map((slug) =>
        withProducts.find((c) => c.slug === slug),
      ).filter(Boolean) as CategoryPublic[],
    [withProducts],
  );

  const moreOccasions = useMemo(
    () =>
      withProducts.filter(
        (c) =>
          !FEATURED_CATEGORY_SLUGS.includes(
            c.slug as (typeof FEATURED_CATEGORY_SLUGS)[number],
          ),
    ),
    [withProducts],
  );

  function buildUrl(next: {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const qv = next.q ?? q;
    const cat = next.category ?? category;
    const min = next.min ?? minPrice;
    const max = next.max ?? maxPrice;
    const sv = next.sort ?? sort;
    if (qv.trim()) params.set("q", qv.trim());
    if (cat) params.set("category", cat);
    if (min.trim()) params.set("min", min.trim());
    if (max.trim()) params.set("max", max.trim());
    if (sv && sv !== "featured") params.set("sort", sv);
    const qs = params.toString();
    return `/${locale}/shop${qs ? `?${qs}` : ""}`;
  }

  function apply(next?: Parameters<typeof buildUrl>[0]) {
    router.push(buildUrl(next || {}));
    setOpen(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply();
  }

  function clearAll() {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("featured");
    setShowAllOccasions(false);
    router.push(`/${locale}/shop`);
    setOpen(false);
  }

  function selectPreset(min?: number, max?: number) {
    const minS = min != null ? String(min) : "";
    const maxS = max != null ? String(max) : "";
    setMinPrice(minS);
    setMaxPrice(maxS);
    apply({ min: minS, max: maxS });
  }

  const hasFilters = Boolean(
    initial.q ||
      initial.category ||
      initial.minPrice != null ||
      initial.maxPrice != null ||
      (initial.sort && initial.sort !== "featured"),
  );

  const activePreset = PRICE_PRESETS.find((preset) => {
    const minOk =
      (preset.min ?? 0) === (initial.minPrice ?? 0) ||
      (preset.min === 0 && initial.minPrice == null);
    const maxOk =
      (preset.max ?? null) === (initial.maxPrice ?? null);
    return (
      minOk &&
      maxOk &&
      (initial.minPrice != null || initial.maxPrice != null)
    );
  });

  const chipClass = (active: boolean) =>
    `min-h-11 shrink-0 rounded-full px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase transition ${
      active
        ? "bg-citrus text-ivory"
        : "border border-forest/15 bg-white/70 text-moss hover:border-citrus/40"
    }`;

  const visibleChips = showAllOccasions
    ? [...featured, ...moreOccasions]
    : featured;

  const filterFields = (
    <>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
          {t.search}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="min-h-11 rounded-full border border-forest/15 bg-white px-5 text-base outline-none focus:border-citrus sm:text-sm"
        />
      </label>

      <div className="grid gap-2">
        <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
          {t.price}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRICE_PRESETS.map((preset) => {
            const label =
              preset.id === "u500"
                ? t.priceUnder500
                : preset.id === "500-800"
                  ? t.price500to800
                  : preset.id === "800-1200"
                    ? t.price800to1200
                    : t.priceOver1200;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.min, preset.max)}
                className={chipClass(activePreset?.id === preset.id)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={10000}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={t.minPrice}
            className="min-h-11 rounded-full border border-forest/15 bg-white px-4 text-sm outline-none focus:border-citrus"
          />
          <input
            type="number"
            min={0}
            step={10000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={t.maxPrice}
            className="min-h-11 rounded-full border border-forest/15 bg-white px-4 text-sm outline-none focus:border-citrus"
          />
        </div>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
          {t.sort}
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="min-h-11 rounded-full border border-forest/15 bg-white px-4 text-sm outline-none focus:border-citrus"
        >
          <option value="featured">{t.sortFeatured}</option>
          <option value="newest">{t.sortNewest}</option>
          <option value="price-asc">{t.sortPriceAsc}</option>
          <option value="price-desc">{t.sortPriceDesc}</option>
        </select>
      </label>
    </>
  );

  return (
    <div className="mt-8 space-y-5">
      <div className="relative">
        <label className="sr-only" htmlFor="catalog-search">
          {t.search}
        </label>
        <input
          id="catalog-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply({ q });
            }
          }}
          placeholder={t.searchPlaceholder}
          className="w-full min-h-12 rounded-full border border-forest/15 bg-white px-5 pr-28 text-base shadow-[0_8px_30px_rgba(44,58,48,0.06)] outline-none focus:border-citrus sm:text-sm"
        />
        <button
          type="button"
          onClick={() => apply({ q })}
          className="absolute top-1/2 right-2 min-h-10 -translate-y-1/2 rounded-full bg-citrus px-4 text-[11px] tracking-[0.14em] text-ivory uppercase"
        >
          {t.search}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-moss">
          <span className="font-medium text-forest">
            {t.results.replace("{count}", String(resultCount))}
          </span>
        </p>
        <button
          type="button"
          className="min-h-11 rounded-full border border-forest/20 px-4 text-[11px] tracking-[0.14em] uppercase md:hidden"
          onClick={() => setOpen(true)}
        >
          {t.filters}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => {
            setCategory("");
            apply({ category: "" });
          }}
          className={chipClass(!category)}
        >
          {t.allCategories}
        </button>
        {visibleChips.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setCategory(cat.slug);
              apply({ category: cat.slug });
            }}
            className={chipClass(category === cat.slug)}
          >
            {locale === "vi" ? cat.nameVi : cat.nameEn}
          </button>
        ))}
        {moreOccasions.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllOccasions((v) => !v)}
            className="min-h-11 shrink-0 rounded-full border border-dashed border-citrus/50 px-4 py-2.5 text-[11px] tracking-[0.12em] text-citrus uppercase"
          >
            {showAllOccasions ? t.fewerOccasions : t.allOccasions}
          </button>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="hidden rounded-[1.5rem] border border-forest/10 bg-cream/35 p-5 md:block"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr_0.7fr_auto] lg:items-end">
          {filterFields}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-full bg-forest px-5 text-[11px] tracking-[0.14em] text-ivory uppercase"
            >
              {t.apply}
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="min-h-11 rounded-full border border-forest/20 px-5 text-[11px] tracking-[0.14em] uppercase"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
        </div>
      </form>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-forest/35"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-forest/20" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="serif text-2xl text-forest">{t.filters}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-full px-3 text-[11px] tracking-[0.14em] uppercase text-moss"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="mt-5 space-y-5">
              {filterFields}
              <div className="sticky bottom-0 grid grid-cols-2 gap-2 bg-paper pt-3 pb-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-12 rounded-full border border-forest/20 text-[11px] tracking-[0.14em] uppercase"
                >
                  {t.clear}
                </button>
                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-citrus text-[11px] tracking-[0.14em] text-ivory uppercase"
                >
                  {t.showResults.replace("{count}", String(resultCount))}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
