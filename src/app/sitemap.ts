import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listPublishedJournalPosts } from "@/lib/journal";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { listPublishedProducts } from "@/lib/products";
import { siteUrl } from "@/lib/seo";

/** Keep sitemap fresh for Search Console without full rebuild. */
export const revalidate = 3600;

/**
 * Indexable marketing + catalog URLs only.
 * Skip account/checkout/admin/tools that should not compete in search.
 */
const staticPaths: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.95 },
  { path: "/custom", changeFrequency: "weekly", priority: 0.75 },
  { path: "/weddings", changeFrequency: "weekly", priority: 0.75 },
  { path: "/hotels", changeFrequency: "weekly", priority: 0.7 },
  { path: "/delivery", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.65 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/return-policy", changeFrequency: "yearly", priority: 0.4 },
];

function languageAlternates(pathWithoutLocale: string) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = siteUrl(`/${locale}${pathWithoutLocale}`);
  }
  // Prefer Vietnamese as default market for x-default.
  languages["x-default"] = siteUrl(`/vi${pathWithoutLocale}`);
  return languages;
}

function entry(opts: {
  pathWithoutLocale: string;
  locale: string;
  lastModified: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  images?: string[];
}): MetadataRoute.Sitemap[number] {
  const path = opts.pathWithoutLocale;
  return {
    url: siteUrl(`/${opts.locale}${path}`),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: languageAlternates(path),
    },
    ...(opts.images?.length ? { images: opts.images } : {}),
  };
}

function absoluteImage(src: string | undefined | null) {
  if (!src?.trim()) return undefined;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return siteUrl(src.startsWith("/") ? src : `/${src}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([
    listPublishedProducts(),
    listPublishedJournalPosts(),
  ]);
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const item of staticPaths) {
      pages.push(
        entry({
          locale,
          pathWithoutLocale: item.path,
          lastModified: now,
          changeFrequency: item.changeFrequency,
          priority: item.priority,
        }),
      );
    }

    // Product-type hubs (canonical shop page accepts ?type=).
    for (const type of PRODUCT_TYPES) {
      pages.push(
        entry({
          locale,
          pathWithoutLocale: `/shop?type=${type.slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.85,
        }),
      );
    }

    for (const product of products) {
      if (!product.slug || product.published === false) continue;
      const image = absoluteImage(product.image);
      const lastModified =
        product.updatedAt || product.createdAt || now;
      pages.push(
        entry({
          locale,
          pathWithoutLocale: `/shop/${product.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.8,
          images: image ? [image] : undefined,
        }),
      );
    }

    for (const post of posts) {
      if (!post.slug) continue;
      pages.push(
        entry({
          locale,
          pathWithoutLocale: `/journal/${post.slug}`,
          lastModified: post.updatedAt || now,
          changeFrequency: "monthly",
          priority: 0.65,
        }),
      );
    }
  }

  return pages;
}
