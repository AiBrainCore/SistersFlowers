import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listPublishedProducts } from "@/lib/products";
import { siteUrl } from "@/lib/seo";

const staticPaths = [
  "",
  "/shop",
  "/custom",
  "/weddings",
  "/hotels",
  "/delivery",
  "/about",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listPublishedProducts();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      pages.push({
        url: siteUrl(`/${locale}${path}`),
        lastModified: now,
        changeFrequency: path === "" || path === "/shop" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, siteUrl(`/${l}${path}`)]),
          ),
        },
      });
    }

    for (const product of products) {
      pages.push({
        url: siteUrl(`/${locale}/shop/${product.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, siteUrl(`/${l}/shop/${product.slug}`)]),
          ),
        },
      });
    }
  }

  return pages;
}
