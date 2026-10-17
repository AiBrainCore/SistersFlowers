import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  listPublishedProducts,
  parseCatalogSearchParams,
} from "@/lib/products";
import { listActiveCategories } from "@/lib/categories";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";

export const dynamic = "force-dynamic";

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
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {t.shop.kicker}
      </p>
      <h1 className="serif mt-3 max-w-2xl text-5xl text-forest">{t.shop.title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-moss">{t.shop.intro}</p>

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
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
