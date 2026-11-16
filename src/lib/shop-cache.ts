import { revalidateTag } from "next/cache";

/** Tags for short-lived shop catalog caches (see listShopCatalogPage). */
export const SHOP_CATALOG_TAG = "shop-catalog";
export const SHOP_CATEGORIES_TAG = "shop-categories";
export const SHOP_ATTRS_TAG = "shop-attrs";

/** Call from admin product/category mutations after writes. */
export function bumpShopCatalogCache() {
  // Next 16: profile required — 'max' = stale-while-revalidate (fine for catalog).
  revalidateTag(SHOP_CATALOG_TAG, "max");
  revalidateTag(SHOP_CATEGORIES_TAG, "max");
  revalidateTag(SHOP_ATTRS_TAG, "max");
}
