import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { getProductBySlug, listPublishedProducts } from "@/lib/products";
import { listActiveAddons } from "@/lib/addons";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { SalePrice } from "@/components/sale-price";
import { buildPageMetadata, productJsonLd, siteUrl } from "@/lib/seo";
import { hasAnySizePrice } from "@/lib/product-sizes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { activeCity } = await getStorefrontDictionary(locale as Locale);
  const product = await getProductBySlug(slug, {
    cityId: activeCity.id,
    citySlug: activeCity.slug,
  });
  if (!product) return {};
  const name = product.names[locale];
  const seoTitle = product.seoTitle?.[locale]?.trim() || name;
  const description = (
    product.seoDescription?.[locale]?.trim() ||
    product.blurb?.[locale] ||
    product.story?.[locale] ||
    `${name} · Sisters Flowers`
  ).slice(0, 160);
  const meta = buildPageMetadata({
    locale: locale as Locale,
    title: seoTitle,
    description,
    pathWithoutLocale: `/shop/${slug}`,
  });
  const alt = product.imageAlt?.[locale]?.trim() || name;
  if (product.image) {
    meta.openGraph = {
      ...meta.openGraph,
      images: [
        {
          url: product.image.startsWith("http")
            ? product.image
            : siteUrl(product.image),
          alt,
        },
      ],
    };
  }
  return meta;
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/shop/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t, activeCity } = await getStorefrontDictionary(locale);
  const product = await getProductBySlug(slug, {
    cityId: activeCity.id,
    citySlug: activeCity.slug,
  });
  if (!product) notFound();
  const [others, addons] = await Promise.all([
    listPublishedProducts({
      cityId: activeCity.id,
      citySlug: activeCity.slug,
    }).then((rows) => rows.filter((item) => item.slug !== slug).slice(0, 8)),
    listActiveAddons(),
  ]);

  const pageUrl = siteUrl(`/${locale}/shop/${slug}`);
  const jsonLd = productJsonLd({
    locale,
    name: product.names[locale],
    description: product.story[locale],
    image: product.image,
    price: product.price,
    url: pageUrl,
  });

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[52vh] overflow-hidden lg:min-h-[calc(100vh-4.5rem)]">
          <ProductImage
            src={product.image}
            fallback={product.imageFallback}
            alt={product.names[locale]}
            fill
            className="object-cover object-center transition duration-700 hover:scale-[1.02] motion-reduce:hover:scale-100"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
        <div className="relative flex flex-col justify-center bg-[linear-gradient(160deg,rgba(251,249,245,0.96)_0%,rgba(243,235,224,0.88)_55%,rgba(240,212,204,0.45)_100%)] px-4 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="glass max-w-lg rounded-[1.75rem] p-6 sm:p-8">
            <p className="text-[11px] tracking-[0.24em] text-citrus uppercase">
              {t.product.handmade}
            </p>
            <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
              {product.names[locale]}
            </h1>
            <p className="mt-3 text-xs tracking-[0.14em] text-moss uppercase">
              {product.tags[locale]}
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-moss">
              {product.story[locale]}
            </p>
            <p className="mt-4 text-xs text-moss">{t.product.deliveryNote}</p>
            {!hasAnySizePrice(product.sizePrices) ? (
              <div className="mt-6">
                <SalePrice
                  price={product.price}
                  compareAt={product.compareAtPrice}
                  locale={locale}
                  size="lg"
                />
              </div>
            ) : null}
            <ProductPurchase
              product={product}
              locale={locale}
              dictionary={t}
              addons={addons}
              citySlug={activeCity.slug}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-16">
        <h2 className="serif text-3xl text-forest sm:text-4xl">{t.product.more}</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {others.map((item) => (
            <ProductCard key={item.slug} product={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
