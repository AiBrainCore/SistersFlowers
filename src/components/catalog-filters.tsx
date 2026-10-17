"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  SHOP_OCCASION_CHIP_SLUGS,
  type CategoryPublic,
} from "@/lib/category-constants";
import type { CatalogQuery } from "@/lib/products";
import { formatVnd } from "@/data/seed-products";

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
  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState(initial.q || "");
  const [category, setCategory] = useState(initial.category || "");
  const [minPrice, setMinPrice] = useState(
    initial.minPrice != null ? String(initial.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initial.maxPrice != null ? String(initial.maxPrice) : "",
  );
  const [sort, setSort] = useState(initial.sort || "featured");

  const chipOccasions = useMemo(() => {
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    return SHOP_OCCASION_CHIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
      Boolean,
    ) as CategoryPublic[];
  }, [categories]);

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
    setPanelOpen(false);
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    apply({ q });
  }

  function clearAll() {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("featured");
    router.push(`/${locale}/shop`);
    setPanelOpen(false);
  }

  function selectPreset(min?: number, max?: number) {
    const minS = min != null ? String(min) : "";
    const maxS = max != null ? String(max) : "";
    setMinPrice(minS);
    setMaxPrice(maxS);
    apply({ min: minS, max: maxS });
  }

  const activePreset = PRICE_PRESETS.find((preset) => {
    const minOk =
      (preset.min ?? 0) === (initial.minPrice ?? 0) ||
      (preset.min === 0 && initial.minPrice == null);
    const maxOk = (preset.max ?? null) === (initial.maxPrice ?? null);
    return (
      minOk &&
      maxOk &&
      (initial.minPrice != null || initial.maxPrice != null)
    );
  });

  const hasAdvanced =
    initial.minPrice != null ||
    initial.maxPrice != null ||
    (initial.sort && initial.sort !== "featured");

  const hasAnyFilter = Boolean(
    initial.q || initial.category || hasAdvanced,
  );

  const chipClass = (active: boolean) =>
    `min-h-11 rounded-full px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase transition ${
      active
        ? "bg-citrus text-ivory"
        : "border border-forest/15 bg-white/70 text-moss hover:border-citrus/40"
    }`;

  const tags: { key: string; label: string; clear: () => void }[] = [];
  if (initial.q) {
    tags.push({
      key: "q",
      label: `“${initial.q}”`,
      clear: () => {
        setQ("");
        apply({ q: "" });
      },
    });
  }
  if (initial.category) {
    const cat = categories.find((c) => c.slug === initial.category);
    tags.push({
      key: "cat",
      label: cat
        ? locale === "vi"
          ? cat.nameVi
          : cat.nameEn
        : initial.category,
      clear: () => {
        setCategory("");
        apply({ category: "" });
      },
    });
  }
  if (activePreset) {
    const label =
      activePreset.id === "u500"
        ? t.priceUnder500
        : activePreset.id === "500-800"
          ? t.price500to800
          : activePreset.id === "800-1200"
            ? t.price800to1200
            : t.priceOver1200;
    tags.push({
      key: "price",
      label,
      clear: () => {
        setMinPrice("");
        setMaxPrice("");
        apply({ min: "", max: "" });
      },
    });
  } else if (initial.minPrice != null || initial.maxPrice != null) {
    const min =
      initial.minPrice != null ? formatVnd(initial.minPrice, locale) : "…";
    const max =
      initial.maxPrice != null ? formatVnd(initial.maxPrice, locale) : "…";
    tags.push({
      key: "price",
      label: `${min} – ${max}`,
      clear: () => {
        setMinPrice("");
        setMaxPrice("");
        apply({ min: "", max: "" });
      },
    });
  }
  if (initial.sort && initial.sort !== "featured") {
    const sortLabel =
      initial.sort === "newest"
        ? t.sortNewest
        : initial.sort === "price-asc"
          ? t.sortPriceAsc
          : t.sortPriceDesc;
    tags.push({
      key: "sort",
      label: sortLabel,
      clear: () => {
        setSort("featured");
        apply({ sort: "featured" });
      },
    });
  }

  const pricePanel = (
    <div className="grid gap-3">
      <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
        {t.price}
      </span>
      <div className="grid grid-cols-2 gap-2">
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
      {(minPrice || maxPrice) && !activePreset ? (
        <button
          type="button"
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
            apply({ min: "", max: "" });
          }}
          className="justify-self-start text-[11px] tracking-[0.12em] text-citrus uppercase"
        >
          {t.clear}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="mt-8 space-y-5">
      <form onSubmit={onSearchSubmit} className="relative">
        <label className="sr-only" htmlFor="catalog-search">
          {t.search}
        </label>
        <input
          id="catalog-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full min-h-12 rounded-full border border-forest/15 bg-white px-5 pr-28 text-base shadow-[0_8px_30px_rgba(44,58,48,0.06)] outline-none focus:border-citrus sm:text-sm"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-2 min-h-10 -translate-y-1/2 rounded-full bg-citrus px-4 text-[11px] tracking-[0.14em] text-ivory uppercase"
        >
          {t.search}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
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
        {chipOccasions.map((cat) => (
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-moss">
          <span className="font-medium text-forest">
            {t.results.replace("{count}", String(resultCount))}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/15 bg-white/70 px-3 text-[11px] tracking-[0.12em] text-moss uppercase">
            <span className="sr-only sm:not-sr-only">{t.sort}</span>
            <select
              value={sort}
              onChange={(e) => {
                const next = e.target.value as typeof sort;
                setSort(next);
                apply({ sort: next });
              }}
              className="max-w-[10.5rem] bg-transparent py-2.5 text-[11px] tracking-[0.08em] text-forest outline-none normal-case sm:max-w-[12rem]"
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="newest">{t.sortNewest}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className={`min-h-11 rounded-full border px-4 text-[11px] tracking-[0.14em] uppercase transition ${
              initial.minPrice != null || initial.maxPrice != null
                ? "border-citrus/50 bg-citrus/10 text-citrus"
                : "border-forest/20 text-forest hover:border-citrus/40"
            }`}
          >
            {t.filters}
          </button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={tag.clear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-forest/10 bg-cream/80 px-3 text-xs text-forest transition hover:border-citrus/40"
            >
              <span>{tag.label}</span>
              <span aria-hidden className="text-moss">
                ×
              </span>
            </button>
          ))}
          {hasAnyFilter ? (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-9 px-2 text-[11px] tracking-[0.12em] text-citrus uppercase"
            >
              {t.clear}
            </button>
          ) : null}
        </div>
      ) : null}

      {panelOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-forest/35"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.75rem]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-forest/20 md:hidden" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="serif text-2xl text-forest">{t.filters}</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="min-h-11 rounded-full px-3 text-[11px] tracking-[0.14em] uppercase text-moss"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 space-y-6">
              {pricePanel}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-12 rounded-full border border-forest/20 text-[11px] tracking-[0.14em] uppercase"
                >
                  {t.clear}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="min-h-12 rounded-full bg-citrus text-[11px] tracking-[0.14em] text-ivory uppercase"
                >
                  {t.showResults.replace("{count}", String(resultCount))}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
