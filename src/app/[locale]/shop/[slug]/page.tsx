import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { getProductBySlug, listPublishedProducts } from "@/lib/products";
import { listActiveAddons } from "@/lib/addons";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

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

  return (
    <div>
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[52vh] lg:min-h-screen">
          <Image
            src={product.image}
            alt={product.names[locale]}
            fill
            className="object-cover object-center"
            sizes="50vw"
            priority
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-16 sm:px-14">
          <p className="text-[11px] tracking-[0.24em] text-rose uppercase">
            {t.product.handmade}
          </p>
          <h1 className="serif mt-3 text-5xl text-forest">
            {product.names[locale]}
          </h1>
          <p className="mt-3 text-xs tracking-[0.14em] text-moss uppercase">
            {product.tags[locale]}
          </p>
          <p className="serif mt-6 text-3xl">{formatVnd(product.price, locale)}</p>
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
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="serif text-3xl text-forest">{t.product.more}</h2>
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
          {others.map((item) => (
            <ProductCard key={item.slug} product={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
