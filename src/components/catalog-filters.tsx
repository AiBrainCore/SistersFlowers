"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  SHOP_OCCASION_CHIP_SLUGS,
  type CategoryPublic,
} from "@/lib/category-constants";
import {
  catalogQueryToSearchParams,
  type CatalogQuery,
  type CatalogSizeBand,
  type CatalogStyle,
  type CatalogSort,
} from "@/lib/products";
import type { AttributePublic } from "@/lib/catalog-attributes";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { productUsesSizeLadder } from "@/lib/product-sizes";

const SIZE_OPTIONS: CatalogSizeBand[] = ["mini", "classic", "grand"];
const STYLE_OPTIONS: CatalogStyle[] = [
  "rose",
  "mix",
  "garden",
  "ribbon",
  "wrapped",
];
const TYPE_CHIPS = PRODUCT_TYPES.filter((t) =>
  ["bouquet", "flower-basket", "stand-congrats"].includes(t.slug),
);
const ACCENT_OPTIONS = [
  { id: "blush", swatch: "#f0d5d2" },
  { id: "rose", swatch: "#9b3d45" },
  { id: "ivory", swatch: "#f6f0e6" },
  { id: "sage", swatch: "#8b9a7d" },
] as const;

function toggleIn(list: string[], slug: string) {
  return list.includes(slug)
    ? list.filter((item) => item !== slug)
    : [...list, slug];
}

type Draft = {
  categories: string[];
  productType: string;
  sort: CatalogSort;
  sizes: CatalogSizeBand[];
  accents: string[];
  styles: CatalogStyle[];
  flowers: string[];
  colors: string[];
};

function draftFromQuery(initial: CatalogQuery): Draft {
  return {
    categories: initial.categories ? [...initial.categories] : [],
    productType: initial.productType || "",
    sort: initial.sort || "featured",
    sizes: initial.sizes ? [...initial.sizes] : [],
    accents: initial.accents ? [...initial.accents] : [],
    styles: initial.styles ? [...initial.styles] : [],
    flowers: initial.flowers ? [...initial.flowers] : [],
    colors: initial.colors ? [...initial.colors] : [],
  };
}

function draftToQuery(draft: Draft, q?: string): CatalogQuery {
  return {
    q: q?.trim() || undefined,
    categories: draft.categories.length ? draft.categories : undefined,
    productType: draft.productType || undefined,
    sort: draft.sort,
    sizes:
      draft.sizes.length && productUsesSizeLadder(draft.productType || "bouquet")
        ? draft.sizes
        : undefined,
    accents: draft.accents.length ? draft.accents : undefined,
    styles:
      draft.styles.length && productUsesSizeLadder(draft.productType || "bouquet")
        ? draft.styles
        : undefined,
    flowers: draft.flowers.length ? draft.flowers : undefined,
    colors: draft.colors.length ? draft.colors : undefined,
  };
}

export function CatalogFilters({
  locale,
  dictionary,
  categories,
  flowerAttrs = [],
  colorAttrs = [],
  initial,
  resultCount,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  categories: CategoryPublic[];
  flowerAttrs?: AttributePublic[];
  colorAttrs?: AttributePublic[];
  initial: CatalogQuery;
  resultCount: number;
  children?: ReactNode;
}) {
  const router = useRouter();
  const t = dictionary.shop;
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFromQuery(initial));
  const [previewCount, setPreviewCount] = useState(resultCount);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setDraft(draftFromQuery(initial));
    setPreviewCount(resultCount);
  }, [initial, resultCount]);

  const chipOccasions = useMemo(() => {
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    return SHOP_OCCASION_CHIP_SLUGS.map((slug) => bySlug.get(slug)).filter(
      Boolean,
    ) as CategoryPublic[];
  }, [categories]);

  const showBouquetFilters = productUsesSizeLadder(
    draft.productType || "bouquet",
  );

  function pushQuery(next: CatalogQuery) {
    const qs = catalogQueryToSearchParams(next).toString();
    router.push(`/${locale}/shop${qs ? `?${qs}` : ""}`);
  }

  function applyDraft(nextDraft: Draft = draft) {
    pushQuery(draftToQuery(nextDraft, initial.q));
    setPanelOpen(false);
  }

  function clearAll() {
    const empty: Draft = {
      categories: [],
      productType: "",
      sort: "featured",
      sizes: [],
      accents: [],
      styles: [],
      flowers: [],
      colors: [],
    };
    setDraft(empty);
    pushQuery({ q: initial.q, sort: "featured" });
    setPanelOpen(false);
  }

  /** Desktop: apply immediately. Mobile drawer: update draft only. */
  function patchDraft(
    patch: Partial<Draft> | ((current: Draft) => Draft),
    opts?: { immediate?: boolean },
  ) {
    setDraft((current) => {
      const next =
        typeof patch === "function" ? patch(current) : { ...current, ...patch };
      if (!productUsesSizeLadder(next.productType || "bouquet")) {
        next.sizes = [];
        next.styles = [];
      }
      if (opts?.immediate) {
        queueMicrotask(() => applyDraft(next));
      }
      return next;
    });
  }

  // Live preview count while the mobile drawer draft changes.
  useEffect(() => {
    if (!panelOpen) return;
    const params = catalogQueryToSearchParams(
      draftToQuery(draft, initial.q),
    );
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/shop/count?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setPreviewCount(data.count);
      } catch {
        /* aborted or network — keep last count */
      } finally {
        setPreviewLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draft, panelOpen, initial.q]);

  const activeCount = [
    ...(initial.categories || []),
    initial.productType,
    ...(initial.sizes || []),
    ...(initial.accents || []),
    ...(initial.styles || []),
    ...(initial.flowers || []),
    ...(initial.colors || []),
    initial.sort && initial.sort !== "featured" ? initial.sort : "",
  ].filter(Boolean).length;

  const hasActiveChips = Boolean(
    initial.q ||
      initial.categories?.length ||
      initial.productType ||
      initial.sizes?.length ||
      initial.accents?.length ||
      initial.styles?.length ||
      initial.flowers?.length ||
      initial.colors?.length ||
      (initial.sort && initial.sort !== "featured"),
  );

  const checkClass = (on: boolean) =>
    `inline-flex min-h-10 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm transition lg:min-h-9 ${
      on
        ? "border-citrus/45 bg-citrus/10 text-forest"
        : "border-forest/12 bg-white text-moss hover:border-citrus/30"
    }`;

  const chipClass = (on: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
      on
        ? "border-citrus/45 bg-citrus/10 text-forest"
        : "border-forest/12 bg-white text-moss hover:border-citrus/30"
    }`;

  const filterBody = (mode: "sidebar" | "drawer") => {
    const immediate = mode === "sidebar";
    return (
      <>
        <FilterGroup title={t.sort} flush>
          <div className="flex flex-col gap-1.5">
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
                onClick={() =>
                  patchDraft({ sort: value }, { immediate })
                }
                className={checkClass(draft.sort === value)}
              >
                <Mark on={draft.sort === value} radio />
                {label}
              </button>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title={t.categories}>
          <div className="flex flex-col gap-1.5">
            {chipOccasions.map((cat) => {
              const on = draft.categories.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    patchDraft(
                      (current) => ({
                        ...current,
                        categories: toggleIn(current.categories, cat.slug),
                      }),
                      { immediate },
                    )
                  }
                  className={checkClass(on)}
                >
                  <Mark on={on} />
                  {locale === "vi" ? cat.nameVi : cat.nameEn}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        {flowerAttrs.length ? (
          <FilterGroup title={t.flowerLabel}>
            <div className="flex flex-col gap-1.5">
              {flowerAttrs.map((attr) => {
                const on = draft.flowers.includes(attr.slug);
                return (
                  <button
                    key={attr.id}
                    type="button"
                    onClick={() =>
                      patchDraft(
                        (current) => ({
                          ...current,
                          flowers: toggleIn(current.flowers, attr.slug),
                        }),
                        { immediate },
                      )
                    }
                    className={checkClass(on)}
                  >
                    <Mark on={on} />
                    {locale === "vi" ? attr.nameVi : attr.nameEn}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

        {colorAttrs.length ? (
          <FilterGroup title={t.colorLabel}>
            <div className="flex flex-col gap-1.5">
              {colorAttrs.map((attr) => {
                const on = draft.colors.includes(attr.slug);
                return (
                  <button
                    key={attr.id}
                    type="button"
                    onClick={() =>
                      patchDraft(
                        (current) => ({
                          ...current,
                          colors: toggleIn(current.colors, attr.slug),
                        }),
                        { immediate },
                      )
                    }
                    className={checkClass(on)}
                  >
                    <Mark on={on} />
                    {locale === "vi" ? attr.nameVi : attr.nameEn}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

        <FilterGroup title={t.colorMoodLabel}>
          <div className="flex flex-col gap-1.5">
            {ACCENT_OPTIONS.map((item) => {
              const on = draft.accents.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    patchDraft(
                      (current) => ({
                        ...current,
                        accents: toggleIn(current.accents, item.id),
                      }),
                      { immediate },
                    )
                  }
                  className={checkClass(on)}
                >
                  <Mark on={on} />
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-forest/10"
                    style={{ background: item.swatch }}
                  />
                  {t.accents[item.id]}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        {showBouquetFilters ? (
          <FilterGroup title={t.sizeLabel}>
            <div className="flex flex-col gap-1.5">
              {SIZE_OPTIONS.map((id) => {
                const on = draft.sizes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      patchDraft(
                        (current) => ({
                          ...current,
                          sizes: toggleIn(
                            current.sizes,
                            id,
                          ) as CatalogSizeBand[],
                        }),
                        { immediate },
                      )
                    }
                    className={checkClass(on)}
                  >
                    <Mark on={on} />
                    {t.sizes[id]}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

        {showBouquetFilters ? (
          <FilterGroup title={t.styleLabel}>
            <div className="flex flex-col gap-1.5">
              {STYLE_OPTIONS.map((id) => {
                const on = draft.styles.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      patchDraft(
                        (current) => ({
                          ...current,
                          styles: toggleIn(
                            current.styles,
                            id,
                          ) as CatalogStyle[],
                        }),
                        { immediate },
                      )
                    }
                    className={checkClass(on)}
                  >
                    <Mark on={on} />
                    {t.styles[id]}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

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
      </>
    );
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const next = {
              ...draftFromQuery(initial),
              productType: "",
              sizes: [] as CatalogSizeBand[],
              styles: [] as CatalogStyle[],
            };
            setDraft(next);
            applyDraft(next);
          }}
          className={chipClass(!initial.productType)}
        >
          {t.typeAll}
        </button>
        {TYPE_CHIPS.map((row) => {
          const on = initial.productType === row.slug;
          return (
            <button
              key={row.slug}
              type="button"
              onClick={() => {
                const nextType = on ? "" : row.slug;
                const next = {
                  ...draftFromQuery(initial),
                  productType: nextType,
                  sizes: productUsesSizeLadder(nextType || "bouquet")
                    ? draftFromQuery(initial).sizes
                    : [],
                  styles: productUsesSizeLadder(nextType || "bouquet")
                    ? draftFromQuery(initial).styles
                    : [],
                };
                setDraft(next);
                applyDraft(next);
              }}
              className={chipClass(on)}
            >
              {locale === "vi" ? row.nameVi : row.nameEn}
            </button>
          );
        })}
      </div>

      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-forest/10 bg-white/70 p-4 lg:block">
          <div className="flex items-center justify-between gap-2">
            <h2 className="serif text-xl text-forest">{t.filters}</h2>
            {activeCount ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] tracking-[0.12em] text-citrus uppercase"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-moss">{t.filtersHint}</p>
          <div className="mt-4">{filterBody("sidebar")}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-forest">
              {t.results.replace("{count}", String(resultCount))}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraft(draftFromQuery(initial));
                setPreviewCount(resultCount);
                setPanelOpen(true);
              }}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[11px] tracking-[0.14em] uppercase transition lg:hidden ${
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {initial.q ? (
                <ActiveChip
                  label={`“${initial.q}”`}
                  onClear={() =>
                    pushQuery({ ...initial, q: undefined })
                  }
                />
              ) : null}
              {(initial.categories || []).map((slug) => (
                <ActiveChip
                  key={`cat-${slug}`}
                  label={
                    chipOccasions.find((c) => c.slug === slug)
                      ? locale === "vi"
                        ? chipOccasions.find((c) => c.slug === slug)!.nameVi
                        : chipOccasions.find((c) => c.slug === slug)!.nameEn
                      : slug
                  }
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      categories: (initial.categories || []).filter(
                        (s) => s !== slug,
                      ),
                    })
                  }
                />
              ))}
              {initial.productType ? (
                <ActiveChip
                  label={
                    TYPE_CHIPS.find((r) => r.slug === initial.productType)
                      ? locale === "vi"
                        ? TYPE_CHIPS.find(
                            (r) => r.slug === initial.productType,
                          )!.nameVi
                        : TYPE_CHIPS.find(
                            (r) => r.slug === initial.productType,
                          )!.nameEn
                      : initial.productType
                  }
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      productType: undefined,
                      sizes: undefined,
                      styles: undefined,
                    })
                  }
                />
              ) : null}
              {(initial.sizes || []).map((id) => (
                <ActiveChip
                  key={`size-${id}`}
                  label={t.sizes[id]}
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      sizes: (initial.sizes || []).filter((s) => s !== id),
                    })
                  }
                />
              ))}
              {(initial.accents || []).map((id) => (
                <ActiveChip
                  key={`accent-${id}`}
                  label={
                    t.accents[id as keyof typeof t.accents] || id
                  }
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      accents: (initial.accents || []).filter((s) => s !== id),
                    })
                  }
                />
              ))}
              {(initial.styles || []).map((id) => (
                <ActiveChip
                  key={`style-${id}`}
                  label={t.styles[id]}
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      styles: (initial.styles || []).filter((s) => s !== id),
                    })
                  }
                />
              ))}
              {(initial.flowers || []).map((slug) => (
                <ActiveChip
                  key={`flower-${slug}`}
                  label={
                    flowerAttrs.find((a) => a.slug === slug)
                      ? locale === "vi"
                        ? flowerAttrs.find((a) => a.slug === slug)!.nameVi
                        : flowerAttrs.find((a) => a.slug === slug)!.nameEn
                      : slug
                  }
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      flowers: (initial.flowers || []).filter((s) => s !== slug),
                    })
                  }
                />
              ))}
              {(initial.colors || []).map((slug) => (
                <ActiveChip
                  key={`color-${slug}`}
                  label={
                    colorAttrs.find((a) => a.slug === slug)
                      ? locale === "vi"
                        ? colorAttrs.find((a) => a.slug === slug)!.nameVi
                        : colorAttrs.find((a) => a.slug === slug)!.nameEn
                      : slug
                  }
                  onClear={() =>
                    pushQuery({
                      ...initial,
                      colors: (initial.colors || []).filter((s) => s !== slug),
                    })
                  }
                />
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="min-h-9 px-2 text-[11px] tracking-[0.12em] text-citrus uppercase"
              >
                {t.clear}
              </button>
            </div>
          ) : null}

          {children}
        </div>
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-forest/35"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-paper shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-forest/10 px-4 py-4">
              <h2 className="serif text-2xl text-forest">{t.filters}</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="min-h-11 rounded-full px-3 text-[11px] tracking-[0.14em] uppercase text-moss"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {filterBody("drawer")}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-forest/10 p-4">
              <button
                type="button"
                onClick={clearAll}
                className="min-h-12 rounded-full border border-forest/20 text-[11px] tracking-[0.14em] uppercase"
              >
                {t.clear}
              </button>
              <button
                type="button"
                onClick={() => applyDraft()}
                className="min-h-12 rounded-full bg-citrus text-[11px] tracking-[0.14em] text-ivory uppercase disabled:opacity-70"
                disabled={previewLoading}
              >
                {t.showResults.replace("{count}", String(previewCount))}
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

function Mark({ on, radio = false }: { on: boolean; radio?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-4 w-4 shrink-0 place-items-center border text-[10px] ${
        radio ? "rounded-full" : "rounded"
      } ${
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
