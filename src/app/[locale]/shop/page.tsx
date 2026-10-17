import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  listPublishedProducts,
  parseCatalogSearchParams,
} from "@/lib/products";
import { listActiveCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.shop.title,
    description: t.shop.intro,
    pathWithoutLocale: "/shop",
  });
}

export default async function ShopPage({
  params,
  searchParams,
}: PageProps<"/[locale]/shop">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const raw = await searchParams;
  const query = parseCatalogSearchParams(raw);
  const [products, categories] = await Promise.all([
    listPublishedProducts(query),
    listActiveCategories(),
  ]);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(242,184,198,0.28),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
        <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
          {t.shop.kicker}
        </p>
        <h1 className="serif mt-3 max-w-2xl text-4xl text-forest sm:text-5xl">
          {t.shop.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-moss">{t.shop.intro}</p>

        <CatalogFilters
          locale={locale}
          dictionary={t}
          categories={categories}
          initial={query}
          resultCount={products.length}
        />

        {products.length === 0 ? (
          <p className="mt-12 text-sm text-moss">{t.shop.empty}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
