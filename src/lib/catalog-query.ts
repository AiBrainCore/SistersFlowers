/**
 * Client-safe catalog URL/query helpers.
 * Keep this free of prisma / next/headers so Client Components can import it.
 */

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "featured";

/** Shop filter bands aligned to S / M / L ladder (~450 / 600 / 850k). */
export type CatalogSizeBand = "mini" | "classic" | "grand";
export type CatalogStyle = "rose" | "mix" | "garden" | "ribbon" | "wrapped";

export type CatalogQuery = {
  q?: string;
  /** Occasion slugs (OR). */
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  /** Colour moods from product.accent (OR). */
  accents?: string[];
  /** Bouquet styles matched from tags (OR). */
  styles?: CatalogStyle[];
  /** Size bands approximated from price (OR). */
  sizes?: CatalogSizeBand[];
  /** CatalogAttribute flower slugs (OR). */
  flowers?: string[];
  /** CatalogAttribute color slugs (OR). */
  colors?: string[];
  /** CatalogAttribute style slugs (OR). */
  attrStyles?: string[];
  /** When set, apply city assortment (null list = all published). */
  cityProductIds?: string[] | null;
  /** Apply city/size prices after fetch. */
  cityId?: string;
  citySlug?: string;
  /** Product kind: bouquet | flower-basket | stand-* */
  productType?: string;
};

/** @deprecated singular accessors for older call sites — prefer plural arrays. */
export function catalogFirstCategory(query: CatalogQuery) {
  return query.categories?.[0];
}

export function parseCatalogSearchParams(input: {
  q?: string | string[];
  category?: string | string[];
  type?: string | string[];
  min?: string | string[];
  max?: string | string[];
  sort?: string | string[];
  accent?: string | string[];
  style?: string | string[];
  size?: string | string[];
  flower?: string | string[];
  color?: string | string[];
  attrStyle?: string | string[];
}): CatalogQuery {
  const one = (v?: string | string[]) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const many = (v?: string | string[]) => {
    const parts = Array.isArray(v) ? v : v != null ? [v] : [];
    const out: string[] = [];
    for (const part of parts) {
      for (const piece of String(part).split(",")) {
        const t = piece.trim();
        if (t && !out.includes(t)) out.push(t);
      }
    }
    return out;
  };

  const q = one(input.q)?.trim() || undefined;
  const categories = many(input.category);
  const productType = one(input.type)?.trim() || undefined;
  const minRaw = one(input.min);
  const maxRaw = one(input.max);
  const sortRaw = one(input.sort);
  const accents = many(input.accent);
  const styleRaw = many(input.style);
  const sizeRaw = many(input.size);
  const flowers = many(input.flower);
  const colors = many(input.color);
  const attrStyles = many(input.attrStyle);

  const minPrice = minRaw != null && minRaw !== "" ? Number(minRaw) : undefined;
  const maxPrice = maxRaw != null && maxRaw !== "" ? Number(maxRaw) : undefined;

  const sort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "newest" ||
    sortRaw === "featured"
      ? sortRaw
      : "featured";

  const styles = styleRaw.filter(
    (s): s is CatalogStyle =>
      s === "rose" ||
      s === "mix" ||
      s === "garden" ||
      s === "ribbon" ||
      s === "wrapped",
  );

  const sizes = sizeRaw.filter(
    (s): s is CatalogSizeBand =>
      s === "mini" || s === "classic" || s === "grand",
  );

  return {
    q,
    categories: categories.length ? categories : undefined,
    productType,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort,
    accents: accents.length ? accents : undefined,
    styles: styles.length ? styles : undefined,
    sizes: sizes.length ? sizes : undefined,
    flowers: flowers.length ? flowers : undefined,
    colors: colors.length ? colors : undefined,
    attrStyles: attrStyles.length ? attrStyles : undefined,
  };
}

/** Build shop query-string from a CatalogQuery (multi values as comma lists). */
export function catalogQueryToSearchParams(
  query: CatalogQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.categories?.length) {
    params.set("category", query.categories.join(","));
  }
  if (query.productType) params.set("type", query.productType);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  if (query.sizes?.length) params.set("size", query.sizes.join(","));
  if (query.accents?.length) params.set("accent", query.accents.join(","));
  if (query.styles?.length) params.set("style", query.styles.join(","));
  if (query.flowers?.length) params.set("flower", query.flowers.join(","));
  if (query.colors?.length) params.set("color", query.colors.join(","));
  if (query.attrStyles?.length) {
    params.set("attrStyle", query.attrStyles.join(","));
  }
  if (query.minPrice != null) params.set("min", String(query.minPrice));
  if (query.maxPrice != null) params.set("max", String(query.maxPrice));
  return params;
}
