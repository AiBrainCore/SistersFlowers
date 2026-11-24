import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import {
  getProductBySlug,
  listRelatedProducts,
} from "@/lib/products";
import { listActiveAddons } from "@/lib/addons";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { SalePrice } from "@/components/sale-price";
import { buildPageMetadata, productJsonLd, siteUrl } from "@/lib/seo";
import { hasAnySizePrice } from "@/lib/product-sizes";

/** City cookie still forces dynamic; data paths below are short-cached. */
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
    listRelatedProducts({
      excludeSlug: slug,
      productType: product.productType,
      cityId: activeCity.id,
      citySlug: activeCity.slug,
      take: 4,
    }),
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
      <section className="grid lg:grid-cols-2 lg:items-start">
        <ProductGallery
          images={[
            {
              src: product.image,
              fallback: product.imageFallback,
              alt:
                product.imageAlt?.[locale]?.trim() || product.names[locale],
            },
          ]}
        />
        <div className="relative flex justify-center bg-[linear-gradient(160deg,rgba(251,249,245,0.96)_0%,rgba(243,235,224,0.88)_55%,rgba(240,212,204,0.45)_100%)] px-5 py-8 sm:px-8 sm:py-10 lg:justify-start lg:px-10 lg:py-10">
          <div className="glass w-full max-w-md rounded-[1.5rem] p-5 sm:p-6 lg:max-w-lg">
            <p className="text-[11px] tracking-[0.24em] text-citrus uppercase">
              {t.product.handmade}
            </p>
            <h1 className="serif mt-2 text-3xl text-forest sm:text-4xl">
              {product.names[locale]}
            </h1>
            {product.sku ? (
              <p className="mt-2 text-[11px] tracking-[0.12em] text-moss/80">
                {t.product.skuLabel}{" "}
                <span className="font-semibold tracking-[0.06em] text-forest">
                  {product.sku}
                </span>
              </p>
            ) : null}
            {(() => {
              const tag = product.tags[locale]?.trim() || "";
              const name = product.names[locale]?.trim() || "";
              // Skip tags that repeat the product title (e.g. “Romantic Rose Bouquet”).
              const fold = (value: string) =>
                value
                  .normalize("NFD")
                  .replace(/\p{M}/gu, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9\s]/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
              const tagFold = fold(tag);
              const nameFold = fold(name);
              const looksLikeSecondTitle =
                /\b(bouquet|bó hoa|bo hoa)\b/i.test(tag) ||
                tagFold === nameFold ||
                (tagFold.length > 0 &&
                  (nameFold.includes(tagFold) || tagFold.includes(nameFold)));
              if (!tag || looksLikeSecondTitle) return null;
              return (
                <p className="mt-3 text-xs tracking-[0.14em] text-moss uppercase">
                  {tag}
                </p>
              );
            })()}
            <p className="mt-4 max-w-md text-sm leading-6 text-moss line-clamp-4 sm:line-clamp-5">
              {product.story[locale]}
            </p>
            <p className="mt-3 text-xs text-moss">{t.product.deliveryNote}</p>
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
      {others.length ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-16">
          <h2 className="serif text-3xl text-forest sm:text-4xl">
            {t.product.more}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4">
            {others.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                locale={locale}
                citySlug={activeCity.slug}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
