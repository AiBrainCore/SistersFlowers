"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  SHOP_OCCASION_CHIP_SLUGS,
  type CategoryPublic,
} from "@/lib/category-constants";
import type {
  CatalogQuery,
  CatalogSizeBand,
  CatalogStyle,
} from "@/lib/products";

const SIZE_OPTIONS: CatalogSizeBand[] = ["mini", "classic", "grand", "luxury"];
const STYLE_OPTIONS: CatalogStyle[] = [
  "rose",
  "mix",
  "garden",
  "ribbon",
  "wrapped",
];
const ACCENT_OPTIONS = [
  { id: "blush", swatch: "#f0d5d2" },
  { id: "rose", swatch: "#9b3d45" },
  { id: "ivory", swatch: "#f6f0e6" },
  { id: "sage", swatch: "#8b9a7d" },
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
  const [sort, setSort] = useState(initial.sort || "featured");
  const [size, setSize] = useState(initial.size || "");
  const [accent, setAccent] = useState(initial.accent || "");
  const [style, setStyle] = useState(initial.style || "");

  const chipOccasions = useMemo(() => {
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    return SHOP_OCCASION_CHIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
      Boolean,
    ) as CategoryPublic[];
  }, [categories]);

  function buildUrl(next?: {
    q?: string;
    category?: string;
    sort?: string;
    size?: string;
    accent?: string;
    style?: string;
  }) {
    const params = new URLSearchParams();
    const qv = next?.q ?? q;
    const cat = next?.category ?? category;
    const sv = next?.sort ?? sort;
    const sizeV = next?.size ?? size;
    const accentV = next?.accent ?? accent;
    const styleV = next?.style ?? style;
    if (qv.trim()) params.set("q", qv.trim());
    if (cat) params.set("category", cat);
    if (initial.productType) params.set("type", initial.productType);
    if (sv && sv !== "featured") params.set("sort", sv);
    if (sizeV) params.set("size", sizeV);
    if (accentV) params.set("accent", accentV);
    if (styleV) params.set("style", styleV);
    const qs = params.toString();
    return `/${locale}/shop${qs ? `?${qs}` : ""}`;
  }

  function apply(next?: Parameters<typeof buildUrl>[0]) {
    router.push(buildUrl(next));
    setPanelOpen(false);
  }

  function clearAll() {
    setQ("");
    setCategory("");
    setSort("featured");
    setSize("");
    setAccent("");
    setStyle("");
    router.push(`/${locale}/shop`);
    setPanelOpen(false);
  }

  /** Badge counts panel filters only — search lives on the shop toolbar. */
  const activeCount = [
    initial.category,
    initial.size,
    initial.accent,
    initial.style,
    initial.sort && initial.sort !== "featured" ? initial.sort : "",
  ].filter(Boolean).length;

  const hasActiveChips = Boolean(
    initial.q ||
      initial.category ||
      initial.size ||
      initial.accent ||
      initial.style ||
      (initial.sort && initial.sort !== "featured"),
  );

  const checkClass = (on: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
      on
        ? "border-citrus/45 bg-citrus/10 text-forest"
        : "border-forest/12 bg-white text-moss hover:border-citrus/30"
    }`;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-forest">
          {t.results.replace("{count}", String(resultCount))}
        </p>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[11px] tracking-[0.14em] uppercase transition ${
            activeCount
              ? "border-citrus/50 bg-citrus/10 text-citrus"
              : "border-forest/15 bg-white text-forest hover:border-citrus/35"
          }`}
        >
          {t.filters}
          {activeCount ? ` · ${activeCount}` : ""}
        </button>
      </div>

      {hasActiveChips ? (
        <div className="flex flex-wrap items-center gap-2">
          {initial.q ? (
            <ActiveChip
              label={`“${initial.q}”`}
              onClear={() => {
                setQ("");
                apply({ q: "" });
              }}
            />
          ) : null}
          {initial.category ? (
            <ActiveChip
              label={
                chipOccasions.find((c) => c.slug === initial.category)
                  ? locale === "vi"
                    ? chipOccasions.find((c) => c.slug === initial.category)!
                        .nameVi
                    : chipOccasions.find((c) => c.slug === initial.category)!
                        .nameEn
                  : initial.category
              }
              onClear={() => {
                setCategory("");
                apply({ category: "" });
              }}
            />
          ) : null}
          {initial.size ? (
            <ActiveChip
              label={t.sizes[initial.size]}
              onClear={() => {
                setSize("");
                apply({ size: "" });
              }}
            />
          ) : null}
          {initial.accent ? (
            <ActiveChip
              label={t.accents[initial.accent as keyof typeof t.accents] || initial.accent}
              onClear={() => {
                setAccent("");
                apply({ accent: "" });
              }}
            />
          ) : null}
          {initial.style ? (
            <ActiveChip
              label={t.styles[initial.style]}
              onClear={() => {
                setStyle("");
                apply({ style: "" });
              }}
            />
          ) : null}
          <button
            type="button"
            onClick={clearAll}
            className="min-h-9 px-2 text-[11px] tracking-[0.12em] text-citrus uppercase"
          >
            {t.clear}
          </button>
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
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[1.75rem] bg-paper p-5 shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.75rem]">
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

            <div className="mt-5">
              <FilterGroup title={t.sort} flush>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["featured", t.sortFeatured],
                      ["newest", t.sortNewest],
                      ["price-asc", t.sortPriceAsc],
                      ["price-desc", t.sortPriceDesc],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSort(value)}
                      className={checkClass(sort === value)}
                    >
                      <Mark on={sort === value} />
                      {label}
                    </button>
                  ))}
                </div>
              </FilterGroup>
            </div>

            <FilterGroup title={t.categories}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className={checkClass(!category)}
                >
                  <Mark on={!category} />
                  {t.allCategories}
                </button>
                {chipOccasions.map((cat) => {
                  const on = category === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(on ? "" : cat.slug)}
                      className={checkClass(on)}
                    >
                      <Mark on={on} />
                      {locale === "vi" ? cat.nameVi : cat.nameEn}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title={t.sizeLabel}>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((id) => {
                  const on = size === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSize(on ? "" : id)}
                      className={checkClass(on)}
                    >
                      <Mark on={on} />
                      {t.sizes[id]}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title={t.colorMoodLabel}>
              <div className="flex flex-wrap gap-2">
                {ACCENT_OPTIONS.map((item) => {
                  const on = accent === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccent(on ? "" : item.id)}
                      className={checkClass(on)}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-forest/10"
                        style={{ background: item.swatch }}
                      />
                      {t.accents[item.id]}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title={t.styleLabel}>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((id) => {
                  const on = style === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStyle(on ? "" : id)}
                      className={checkClass(on)}
                    >
                      <Mark on={on} />
                      {t.styles[id]}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <p className="mt-6 rounded-2xl bg-cream/80 px-4 py-3 text-sm leading-6 text-moss">
              {t.customHint}{" "}
              <Link
                href={`/${locale}/custom`}
                className="font-medium text-citrus underline-offset-2 hover:underline"
                onClick={() => setPanelOpen(false)}
              >
                {dictionary.nav.custom}
              </Link>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="min-h-12 rounded-full border border-forest/20 text-[11px] tracking-[0.14em] uppercase"
              >
                {t.clear}
              </button>
              <button
                type="button"
                onClick={() => apply()}
                className="min-h-12 rounded-full bg-citrus text-[11px] tracking-[0.14em] text-ivory uppercase"
              >
                {t.showResults.replace("{count}", String(resultCount))}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({
  title,
  children,
  flush = false,
}: {
  title: string;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={flush ? undefined : "mt-6"}>
      <p className="mb-2.5 text-[11px] tracking-[0.14em] text-moss uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function Mark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${
        on
          ? "border-citrus bg-citrus text-white"
          : "border-forest/20 bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

function ActiveChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-forest/10 bg-cream/80 px-3 text-xs text-forest"
    >
      <span>{label}</span>
      <span aria-hidden>×</span>
    </button>
  );
}
