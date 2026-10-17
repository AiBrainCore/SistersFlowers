import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { listPublishedProducts } from "@/lib/products";
import { listActiveCategories } from "@/lib/categories";
import { FEATURED_CATEGORY_SLUGS } from "@/lib/category-constants";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

const heroImage = "/bouquets/b-16.jpg";
const studioImage = "/bouquets/b-12.jpg";
const personalImage = "/bouquets/b-08.jpg";

const occasionTints = [
  "bg-petal/45",
  "bg-blush/55",
  "bg-pollen/50",
  "bg-mist/70",
  "bg-sky/55",
];

export const dynamic = "force-dynamic";

/** Previous full-bleed homepage — preserved for comparison; not for indexing. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/classic">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
  return {
    title: `${t.brand} · ${t.origin}`,
    description: t.hero.subtitle,
    robots: { index: false, follow: false },
  };
}

export default async function ClassicHomePage({
  params,
}: PageProps<"/[locale]/classic">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [products, categories] = await Promise.all([
    listPublishedProducts(),
    listActiveCategories(),
  ]);
  const featured = products.slice(0, 8);
  const occasions = FEATURED_CATEGORY_SLUGS.map((slug) =>
    categories.find((c) => c.slug === slug && (c.productCount ?? 0) > 0),
  ).filter(Boolean) as typeof categories;

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-[center_30%] scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/35 to-forest/10" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-28 text-ivory sm:px-5 sm:pb-20">
          <div className="hero-copy max-w-2xl">
            <p className="serif text-3xl leading-none sm:text-4xl">
              {t.hero.brand}
            </p>
            <p className="mt-4 text-[11px] tracking-[0.32em] text-citrus-soft uppercase">
              {t.hero.kicker}
            </p>
            <h1 className="serif mt-4 text-[2.65rem] leading-[1.02] sm:text-6xl lg:text-7xl">
              {t.hero.titleBefore}
              <span className="italic text-citrus">{t.hero.titleAccent}</span>
              {t.hero.titleAfter}
            </h1>
            <p className="mt-5 max-w-lg text-base font-light leading-relaxed text-ivory/90 sm:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/shop`}
                className="inline-flex min-h-12 items-center rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-ivory uppercase transition hover:bg-citrus/90"
              >
                {t.hero.shop}
              </Link>
              <Link
                href={`/${locale}/custom`}
                className="inline-flex min-h-12 items-center rounded-full border border-ivory/55 px-6 text-[12px] tracking-[0.16em] uppercase transition hover:bg-ivory/10"
              >
                {t.hero.custom}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <Reveal>
          <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.home.occasionsKicker}
          </p>
          <h2 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
            {t.home.occasionsTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-moss">
            {t.home.occasionsBody}
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {occasions.map((cat, index) => (
            <Reveal key={cat.slug} delay={(index % 3) as 0 | 1 | 2 | 3}>
              <Link
                href={`/${locale}/shop?category=${cat.slug}`}
                className={`group flex min-h-[7.5rem] flex-col justify-end rounded-[1.4rem] p-4 transition duration-500 hover:-translate-y-1 ${occasionTints[index % occasionTints.length]}`}
              >
                <span className="serif text-xl leading-tight text-forest sm:text-2xl">
                  {locale === "vi" ? cat.nameVi : cat.nameEn}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

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
          <div className="relative flex flex-col justify-center bg-forest px-6 py-14 text-ivory sm:px-12 sm:py-20">
            <Reveal>
              <p className="text-[11px] tracking-[0.28em] text-citrus-soft uppercase">
                {t.origin}
              </p>
              <h2 className="serif mt-4 text-4xl sm:text-5xl">
                {t.home.fieldTitle}
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-ivory/80">
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
              <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
                {t.home.personalKicker}
              </p>
              <h2 className="serif mt-3 text-3xl text-forest sm:text-4xl">
                {t.home.personalTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-moss">
                {t.home.personalBody}
              </p>
              <Link
                href={`/${locale}/custom`}
                className="mt-7 inline-flex min-h-12 items-center rounded-full bg-citrus px-5 text-[12px] tracking-[0.16em] text-ivory uppercase"
              >
                {t.home.personalCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
