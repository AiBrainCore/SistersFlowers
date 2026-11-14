/** Bouquet size tiers (same photo/name, different price). */
export const PRODUCT_SIZES = [
  { id: "sm", labelEn: "Small", labelVi: "Nhỏ", short: "S" },
  { id: "md", labelEn: "Medium", labelVi: "Vừa", short: "M" },
  { id: "lg", labelEn: "Large", labelVi: "Lớn", short: "L" },
  { id: "grand", labelEn: "Grand / XL", labelVi: "Grand / XL", short: "XL" },
] as const;

export type ProductSizeId = (typeof PRODUCT_SIZES)[number]["id"];

export type SizePriceMap = Partial<Record<ProductSizeId, number | null>>;

export function isProductSizeId(value: string): value is ProductSizeId {
  return PRODUCT_SIZES.some((s) => s.id === value);
}

export function sizeLabel(
  size: ProductSizeId,
  locale: "en" | "vi",
): string {
  const row = PRODUCT_SIZES.find((s) => s.id === size);
  if (!row) return size;
  return locale === "vi" ? row.labelVi : row.labelEn;
}

/** Network base size prices from product columns. */
export function baseSizePrices(input: {
  priceSm?: number | null;
  priceMd?: number | null;
  priceLg?: number | null;
  priceGrand?: number | null;
}): SizePriceMap {
  return {
    sm: input.priceSm ?? null,
    md: input.priceMd ?? null,
    lg: input.priceLg ?? null,
    grand: input.priceGrand ?? null,
  };
}

export function citySizePrices(input: {
  priceSm?: number | null;
  priceMd?: number | null;
  priceLg?: number | null;
  priceGrand?: number | null;
}): SizePriceMap {
  return baseSizePrices(input);
}

export function hasAnySizePrice(map: SizePriceMap | undefined): boolean {
  if (!map) return false;
  return PRODUCT_SIZES.some((s) => {
    const v = map[s.id];
    return v != null && Number.isFinite(v) && v > 0;
  });
}

/** Offered sizes for a city (city override wins; else base). */
export function offeredSizes(
  base: SizePriceMap | undefined,
  city: SizePriceMap | undefined,
): ProductSizeId[] {
  return PRODUCT_SIZES.map((s) => s.id).filter((id) => {
    const cityPrice = city?.[id];
    if (cityPrice != null && cityPrice > 0) return true;
    const basePrice = base?.[id];
    return basePrice != null && basePrice > 0;
  });
}

export function resolveSizePrice(
  size: ProductSizeId,
  base: SizePriceMap | undefined,
  city: SizePriceMap | undefined,
  fallbackPrice: number,
): number {
  const cityPrice = city?.[size];
  if (cityPrice != null && cityPrice > 0) return cityPrice;
  const basePrice = base?.[size];
  if (basePrice != null && basePrice > 0) return basePrice;
  return fallbackPrice;
}

/** Lowest offered size price for cards ("from …"); else fallback. */
export function minOfferedPrice(
  base: SizePriceMap | undefined,
  city: SizePriceMap | undefined,
  fallbackPrice: number,
): number {
  const sizes = offeredSizes(base, city);
  if (!sizes.length) return fallbackPrice;
  return Math.min(
    ...sizes.map((size) => resolveSizePrice(size, base, city, fallbackPrice)),
  );
}

/** Prefer Medium, else first offered, for default PDP selection. */
export function defaultSize(
  base: SizePriceMap | undefined,
  city: SizePriceMap | undefined,
): ProductSizeId | null {
  const sizes = offeredSizes(base, city);
  if (!sizes.length) return null;
  if (sizes.includes("md")) return "md";
  return sizes[0];
}

/** Sync Product.price for sorting/filters when size matrix is set. */
export function syncListPrice(
  base: SizePriceMap,
  legacyPrice: number,
): number {
  if (!hasAnySizePrice(base)) return legacyPrice;
  return minOfferedPrice(base, undefined, legacyPrice);
}

/** Network compare-at (“was”) prices from product columns. */
export function baseCompareAtPrices(input: {
  compareAtSm?: number | null;
  compareAtMd?: number | null;
  compareAtLg?: number | null;
  compareAtGrand?: number | null;
}): SizePriceMap {
  return {
    sm: input.compareAtSm ?? null,
    md: input.compareAtMd ?? null,
    lg: input.compareAtLg ?? null,
    grand: input.compareAtGrand ?? null,
  };
}

export function resolveCompareAt(
  size: ProductSizeId | null | undefined,
  compareAts: SizePriceMap | undefined,
  fallbackCompareAt?: number | null,
): number | null {
  if (size) {
    const sized = compareAts?.[size];
    if (sized != null && sized > 0) return sized;
  }
  if (fallbackCompareAt != null && fallbackCompareAt > 0) return fallbackCompareAt;
  return null;
}

export function isOnSale(price: number, compareAt: number | null | undefined) {
  return compareAt != null && compareAt > price && price > 0;
}

/** Compare-at paired with the lowest current size price (for cards). */
export function minPriceCompareAt(
  base: SizePriceMap | undefined,
  city: SizePriceMap | undefined,
  compareAts: SizePriceMap | undefined,
  fallbackPrice: number,
  fallbackCompareAt?: number | null,
): { price: number; compareAt: number | null } {
  const sizes = offeredSizes(base, city);
  if (!sizes.length) {
    return {
      price: fallbackPrice,
      compareAt: resolveCompareAt(null, compareAts, fallbackCompareAt),
    };
  }
  let bestSize = sizes[0]!;
  let bestPrice = resolveSizePrice(bestSize, base, city, fallbackPrice);
  for (const size of sizes.slice(1)) {
    const price = resolveSizePrice(size, base, city, fallbackPrice);
    if (price < bestPrice) {
      bestPrice = price;
      bestSize = size;
    }
  }
  return {
    price: bestPrice,
    compareAt: resolveCompareAt(bestSize, compareAts, fallbackCompareAt),
  };
}
