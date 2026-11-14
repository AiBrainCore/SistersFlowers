import type { CategoryPublic } from "@/lib/categories";
import type { CityStockPublic } from "@/lib/product-city";
import {
  baseSizePrices,
  citySizePrices,
  type SizePriceMap,
} from "@/lib/product-sizes";

export type ProductAttributePublic = {
  slug: string;
  kind: string;
  nameEn: string;
  nameVi: string;
  confidence?: number;
};

export type Product = {
  id?: string;
  slug: string;
  /** Display / list price (min size or legacy). */
  price: number;
  sizePrices?: SizePriceMap;
  image: string;
  /** JPEG (or other) fallback when WebP is unsupported. */
  imageFallback?: string;
  productType?: string;
  accent: string;
  names: { en: string; vi: string };
  tags: { en: string; vi: string };
  blurb: { en: string; vi: string };
  story: { en: string; vi: string };
  seoTitle?: { en: string; vi: string };
  seoDescription?: { en: string; vi: string };
  imageAlt?: { en: string; vi: string };
  sizeNotes?: {
    sm?: { en: string; vi: string };
    md?: { en: string; vi: string };
    lg?: { en: string; vi: string };
    grand?: { en: string; vi: string };
  };
  contentSource?: string;
  contentLocked?: boolean;
  aiStatus?: string;
  attributes?: ProductAttributePublic[];
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
  priceSm?: number | null;
  priceMd?: number | null;
  priceLg?: number | null;
  priceGrand?: number | null;
  sizeNoteSmEn?: string | null;
  sizeNoteSmVi?: string | null;
  sizeNoteMdEn?: string | null;
  sizeNoteMdVi?: string | null;
  sizeNoteLgEn?: string | null;
  sizeNoteLgVi?: string | null;
  sizeNoteGrandEn?: string | null;
  sizeNoteGrandVi?: string | null;
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
  seoTitleEn?: string | null;
  seoTitleVi?: string | null;
  seoDescriptionEn?: string | null;
  seoDescriptionVi?: string | null;
  imageAltEn?: string | null;
  imageAltVi?: string | null;
  contentSource?: string | null;
  contentLocked?: boolean | null;
  aiStatus?: string | null;
  published: boolean;
  sortOrder: number;
  createdAt?: Date;
  categories?: { category: CategoryPublic }[];
  attributes?: {
    confidence?: number;
    attribute: {
      slug: string;
      kind: string;
      nameEn: string;
      nameVi: string;
    };
  }[];
  cityStock?: {
    available: boolean;
    priceOverride: number | null;
    priceSm?: number | null;
    priceMd?: number | null;
    priceLg?: number | null;
    priceGrand?: number | null;
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
    sizePrices: baseSizePrices(record),
    image: record.image,
    imageFallback: record.imageFallback || "",
    productType: record.productType || "bouquet",
    accent: record.accent,
    names: { en: record.nameEn, vi: record.nameVi },
    tags: { en: record.tagEn, vi: record.tagVi },
    blurb: { en: record.blurbEn, vi: record.blurbVi },
    story: { en: record.storyEn, vi: record.storyVi },
    seoTitle: {
      en: record.seoTitleEn || "",
      vi: record.seoTitleVi || "",
    },
    seoDescription: {
      en: record.seoDescriptionEn || "",
      vi: record.seoDescriptionVi || "",
    },
    imageAlt: {
      en: record.imageAltEn || "",
      vi: record.imageAltVi || "",
    },
    sizeNotes: {
      sm: {
        en: record.sizeNoteSmEn || "",
        vi: record.sizeNoteSmVi || "",
      },
      md: {
        en: record.sizeNoteMdEn || "",
        vi: record.sizeNoteMdVi || "",
      },
      lg: {
        en: record.sizeNoteLgEn || "",
        vi: record.sizeNoteLgVi || "",
      },
      grand: {
        en: record.sizeNoteGrandEn || "",
        vi: record.sizeNoteGrandVi || "",
      },
    },
    contentSource: record.contentSource || "import",
    contentLocked: Boolean(record.contentLocked),
    aiStatus: record.aiStatus || "pending",
    attributes: record.attributes?.map((row) => ({
      slug: row.attribute.slug,
      kind: row.attribute.kind,
      nameEn: row.attribute.nameEn,
      nameVi: row.attribute.nameVi,
      confidence: row.confidence,
    })),
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
      sizePrices: citySizePrices(row),
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
