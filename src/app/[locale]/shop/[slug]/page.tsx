import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { getProductBySlug, listPublishedProducts } from "@/lib/products";
import { listActiveAddons } from "@/lib/addons";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { buildPageMetadata, productJsonLd, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = product.names[locale];
  const description =
    product.blurb?.[locale] ||
    product.story?.[locale] ||
    `${name} · Sisters Flowers Da Lat`;
  return buildPageMetadata({
    locale: locale as Locale,
    title: name,
    description: description.slice(0, 160),
    pathWithoutLocale: `/shop/${slug}`,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/shop/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const t = getDictionary(locale);
  const [others, addons] = await Promise.all([
    listPublishedProducts().then((rows) =>
      rows.filter((item) => item.slug !== slug).slice(0, 8),
    ),
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
          <Image
            src={product.image}
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
            <p className="serif mt-6 text-3xl text-citrus">
              {formatVnd(product.price, locale)}
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-moss">
              {product.story[locale]}
            </p>
            <p className="mt-4 text-xs text-moss">{t.product.deliveryNote}</p>
            <ProductPurchase
              product={product}
              locale={locale}
              dictionary={t}
              addons={addons}
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
