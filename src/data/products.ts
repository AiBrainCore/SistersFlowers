import type { CategoryPublic } from "@/lib/categories";

export type Product = {
  id?: string;
  slug: string;
  price: number;
  image: string;
  accent: string;
  names: { en: string; vi: string };
  tags: { en: string; vi: string };
  blurb: { en: string; vi: string };
  story: { en: string; vi: string };
  published?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  categories?: CategoryPublic[];
};

export type ProductRecord = {
  id: string;
  slug: string;
  price: number;
  image: string;
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
};

export function toProduct(record: ProductRecord): Product {
  return {
    id: record.id,
    slug: record.slug,
    price: record.price,
    image: record.image,
    accent: record.accent,
    names: { en: record.nameEn, vi: record.nameVi },
    tags: { en: record.tagEn, vi: record.tagVi },
    blurb: { en: record.blurbEn, vi: record.blurbVi },
    story: { en: record.storyEn, vi: record.storyVi },
    published: record.published,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    categories: record.categories?.map((link) => link.category),
  };
}

export function formatVnd(amount: number, locale: "en" | "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
