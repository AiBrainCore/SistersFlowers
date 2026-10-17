"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CategoryPublic } from "@/lib/categories";
import type { CatalogQuery } from "@/lib/products";

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
  const [q, setQ] = useState(initial.q || "");
  const [category, setCategory] = useState(initial.category || "");
  const [minPrice, setMinPrice] = useState(
    initial.minPrice != null ? String(initial.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initial.maxPrice != null ? String(initial.maxPrice) : "",
  );
  const [sort, setSort] = useState(initial.sort || "featured");

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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(buildUrl({}));
    setOpen(false);
  }

  function clearAll() {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("featured");
    router.push(`/${locale}/shop`);
    setOpen(false);
  }

  const hasFilters = Boolean(
    initial.q ||
      initial.category ||
      initial.minPrice != null ||
      initial.maxPrice != null ||
      (initial.sort && initial.sort !== "featured"),
  );

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-moss">
          {t.results.replace("{count}", String(resultCount))}
        </p>
        <button
          type="button"
          className="rounded-full border border-forest/20 px-4 py-2 text-[11px] tracking-[0.14em] uppercase md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {t.filters}
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className={`rounded-[1.5rem] border border-forest/10 bg-cream/40 p-4 sm:p-5 ${
          open ? "block" : "hidden md:block"
        }`}
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.7fr_0.7fr_auto] lg:items-end">
          <label className="grid gap-1.5 text-sm">
            <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
              {t.search}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="rounded-full border border-forest/15 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-rose"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
              {t.categories}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-full border border-forest/15 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-rose"
            >
              <option value="">{t.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {locale === "vi" ? cat.nameVi : cat.nameEn}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1.5 text-sm">
              <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
                {t.minPrice}
              </span>
              <input
                type="number"
                min={0}
                step={10000}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="rounded-full border border-forest/15 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
                {t.maxPrice}
              </span>
              <input
                type="number"
                min={0}
                step={10000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="—"
                className="rounded-full border border-forest/15 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
              {t.sort}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-full border border-forest/15 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-rose"
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="newest">{t.sortNewest}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2 lg:pb-0.5">
            <button
              type="submit"
              className="rounded-full bg-forest px-5 py-2.5 text-[11px] tracking-[0.14em] text-ivory uppercase"
            >
              {t.apply}
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full border border-forest/20 px-5 py-2.5 text-[11px] tracking-[0.14em] uppercase"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
          <button
            type="button"
            onClick={() => {
              setCategory("");
              router.push(buildUrl({ category: "" }));
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase ${
              !category
                ? "bg-forest text-ivory"
                : "border border-forest/15 text-moss"
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => {
            const active = category === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.slug);
                  router.push(buildUrl({ category: cat.slug }));
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase ${
                  active
                    ? "bg-forest text-ivory"
                    : "border border-forest/15 text-moss"
                }`}
              >
                {locale === "vi" ? cat.nameVi : cat.nameEn}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
