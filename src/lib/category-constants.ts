export type CategoryPublic = {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  sortOrder: number;
  productCount?: number;
};

/** Occasions dropdown — stable IA on every page (no Premium / Hotel gifts / All flowers). */
export const OCCASION_NAV_SLUGS = [
  "birthday",
  "romance",
  "graduation",
  "wedding",
  "condolences",
  "everyday",
] as const;

/** Shop chip row — primary occasions + All. */
export const SHOP_OCCASION_CHIP_SLUGS = [
  "birthday",
  "romance",
  "graduation",
  "wedding",
  "condolences",
] as const;

/** @deprecated use SHOP_OCCASION_CHIP_SLUGS / OCCASION_NAV_SLUGS */
export const FEATURED_CATEGORY_SLUGS = SHOP_OCCASION_CHIP_SLUGS;
