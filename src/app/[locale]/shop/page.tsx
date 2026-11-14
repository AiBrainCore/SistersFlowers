import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import {
  listPublishedProducts,
  parseCatalogSearchParams,
} from "@/lib/products";
import { listActiveCategories } from "@/lib/categories";
import { listAttributesForFilterChips } from "@/lib/catalog-attributes";
import { listAvailableProductIdsForCity } from "@/lib/locations";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import { DeliveryCityBar } from "@/components/delivery-city-bar";
import { ShopSearch } from "@/components/shop-search";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
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
  const { dictionary: t, activeCity } = await getStorefrontDictionary(locale);
  const raw = await searchParams;
  const query = parseCatalogSearchParams(
    raw as {
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
    },
  );
  const cityProductIds = await listAvailableProductIdsForCity(activeCity.id);
  const [products, categories, flowerAttrs, colorAttrs] = await Promise.all([
    listPublishedProducts({
      ...query,
      cityProductIds,
      cityId: activeCity.id,
      citySlug: activeCity.slug,
    }),
    listActiveCategories(),
    listAttributesForFilterChips("flower"),
    listAttributesForFilterChips("color"),
  ]);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(176,84,44,0.08),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <h1 className="serif text-3xl text-forest sm:text-4xl">
          {t.shop.title}
        </h1>
        <p className="mt-1.5 text-sm leading-5 text-moss whitespace-nowrap overflow-x-auto">
          {t.shop.intro}
        </p>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <DeliveryCityBar locale={locale} dictionary={t} />
          <ShopSearch locale={locale} dictionary={t} initial={query} />
        </div>

        <CatalogFilters
          locale={locale}
          dictionary={t}
          categories={categories}
          flowerAttrs={flowerAttrs}
          colorAttrs={colorAttrs}
          initial={query}
          resultCount={products.length}
        />

        {products.length === 0 ? (
          <p className="mt-8 text-sm text-moss">{t.shop.empty}</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
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
