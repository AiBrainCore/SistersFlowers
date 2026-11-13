import type { CategoryPublic } from "@/lib/categories";
import type { CityStockPublic } from "@/lib/product-city";

export type Product = {
  id?: string;
  slug: string;
  /** Network / default price (VND). City overrides live in cityStock. */
  price: number;
  image: string;
  /** JPEG (or other) fallback when WebP is unsupported. */
  imageFallback?: string;
  productType?: string;
  accent: string;
  names: { en: string; vi: string };
  tags: { en: string; vi: string };
  blurb: { en: string; vi: string };
  story: { en: string; vi: string };
  published?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  categories?: CategoryPublic[];
  cityStock?: CityStockPublic[];
};

export type ProductRecord = {
  id: string;
  slug: string;
  price: number;
  image: string;
  imageFallback?: string | null;
  productType?: string | null;
  accent: string;
  nameEn: string;
  nameVi: string;
  tagEn: string;
  tagVi: string;
  blurbEn: string;
  blurbVi: string;
  storyEn: string;
  storyVi: string;
  published: boolean;
  sortOrder: number;
  createdAt?: Date;
  categories?: { category: CategoryPublic }[];
  cityStock?: {
    available: boolean;
    priceOverride: number | null;
    city: {
      id: string;
      slug: string;
      nameEn: string;
      nameVi: string;
    };
  }[];
};

export function toProduct(record: ProductRecord): Product {
  return {
    id: record.id,
    slug: record.slug,
    price: record.price,
    image: record.image,
    imageFallback: record.imageFallback || "",
    productType: record.productType || "bouquet",
    accent: record.accent,
    names: { en: record.nameEn, vi: record.nameVi },
    tags: { en: record.tagEn, vi: record.tagVi },
    blurb: { en: record.blurbEn, vi: record.blurbVi },
    story: { en: record.storyEn, vi: record.storyVi },
    published: record.published,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    categories: record.categories?.map((link) => link.category),
    cityStock: record.cityStock?.map((row) => ({
      cityId: row.city.id,
      citySlug: row.city.slug,
      cityNameEn: row.city.nameEn,
      cityNameVi: row.city.nameVi,
      available: row.available,
      priceOverride: row.priceOverride,
    })),
  };
}

export function formatVnd(amount: number, locale: "en" | "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
