import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { listPublishedProducts } from "@/lib/products";
import { listActiveCategories } from "@/lib/categories";
import { listAvailableProductIdsForCity } from "@/lib/locations";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { ImmersiveHero } from "@/components/immersive-hero";
import { ShopByOccasion } from "@/components/shop-by-occasion";
import { StudiosSection } from "@/components/studios-section";
import {
  buildPageMetadata,
  homepageProductListJsonLd,
  organizationJsonLd,
} from "@/lib/seo";
import { HERO_BOUQUETS, type HeroBouquetItem } from "@/lib/hero-bouquets";
import { STUDIO_CONTACTS } from "@/lib/studio-contacts";

const studioImage = "/bouquets/b-12.jpg";
const personalImage = "/bouquets/b-08.jpg";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.home.seoTitle,
    description: t.home.seoDescription,
    pathWithoutLocale: "",
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t, activeCity } = await getStorefrontDictionary(locale);
  const cityProductIds = await listAvailableProductIdsForCity(activeCity.id);
  const [products, categories] = await Promise.all([
    listPublishedProducts({ cityProductIds }),
    listActiveCategories(),
  ]);
  const featured = products.slice(0, 8);

  const heroBouquets: HeroBouquetItem[] = HERO_BOUQUETS.map((entry) => {
    const product = products.find((p) => p.slug === entry.slug);
    return {
      slug: product ? product.slug : null,
      image: entry.image,
      name: locale === "vi" ? entry.nameVi : entry.nameEn,
    };
  });

  const orgLd = organizationJsonLd(locale);
  const listLd = homepageProductListJsonLd(
    locale,
    featured.map((product) => ({
      name: product.names[locale],
      description: product.blurb[locale],
      image: product.image,
      price: product.price,
      slug: product.slug,
    })),
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
      />
      <ImmersiveHero
        locale={locale}
        dictionary={t}
        bouquets={heroBouquets}
      />

      <ShopByOccasion
        locale={locale}
        dictionary={t}
        categories={categories}
      />

      <section className="relative overflow-hidden">
        <div className="grid items-stretch lg:grid-cols-2">
          <div className="relative min-h-[380px] sm:min-h-[480px]">
            <Image
              src={studioImage}
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="brand-band relative flex flex-col justify-center px-6 py-14 sm:px-12 sm:py-20">
            <Reveal>
              <h2 className="serif text-4xl text-white sm:text-5xl">
                {t.home.fieldTitle}
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                {t.home.fieldBody}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <Reveal>
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="serif text-4xl text-forest sm:text-5xl">
              {t.home.featured}
            </h2>
            <Link
              href={`/${locale}/shop`}
              className="min-h-11 text-[12px] tracking-[0.16em] text-citrus uppercase border-b border-citrus/50"
            >
              {t.home.viewAll}
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={personalImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-forest/45" />
        </div>
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl items-end px-4 py-14 sm:px-5 sm:py-20">
          <Reveal>
            <div className="glass max-w-md rounded-[1.75rem] p-6 sm:p-8">
              <h2 className="serif text-3xl text-forest sm:text-4xl">
                {t.home.personalTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-moss">
                {t.home.personalBody}
              </p>
              <Link
                href={`/${locale}/custom`}
                className="mt-7 inline-flex min-h-12 items-center rounded-full bg-citrus px-6 text-sm tracking-[0.08em] text-ivory uppercase"
              >
                {t.home.personalCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <Reveal>
            <h2 className="serif text-4xl text-forest sm:text-5xl">
              {t.home.deliveryTitle}
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-moss">
              {t.home.deliveryBody}
            </p>
            <Link
              href={`/${locale}/delivery`}
              className="mt-6 inline-flex min-h-11 items-center text-sm tracking-[0.08em] text-citrus uppercase border-b border-citrus/50"
            >
              {t.nav.delivery}
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={1}>
              <Link
                href={`/${locale}/weddings`}
                className="group flex min-h-[11rem] flex-col justify-end rounded-[1.5rem] bg-wood/15 p-6 transition duration-500 hover:-translate-y-1"
              >
                <h3 className="serif text-2xl text-forest">
                  {t.home.weddingTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-moss">
                  {t.home.weddingBody}
                </p>
              </Link>
            </Reveal>
            <Reveal delay={2}>
              <Link
                href={`/${locale}/hotels`}
                className="group flex min-h-[11rem] flex-col justify-end overflow-hidden rounded-[1.5rem]"
              >
                <div className="relative flex-1 min-h-[5rem] bg-mist">
                  <Image
                    src="/bouquets/b-01.jpg"
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="40vw"
                  />
                </div>
                <div className="bg-cream/90 p-5">
                  <h3 className="serif text-2xl text-forest">
                    {t.home.hotelTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-moss">
                    {t.home.hotelBody}
                  </p>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <StudiosSection
        locale={locale}
        dictionary={t}
        studios={STUDIO_CONTACTS}
      />
    </div>
  );
}
