import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
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

export default async function HomePage({ params }: PageProps<"/[locale]">) {
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
                <span className="mt-2 text-[10px] tracking-[0.16em] text-moss uppercase opacity-0 transition group-hover:opacity-100">
                  →
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
              <ul className="mt-8 grid gap-3 text-[12px] tracking-[0.12em] uppercase sm:grid-cols-2">
                <li className="rounded-full border border-ivory/15 px-4 py-2.5 text-center">
                  {t.home.fresh}
                </li>
                <li className="rounded-full border border-ivory/15 px-4 py-2.5 text-center">
                  {t.home.handmade}
                </li>
                <li className="rounded-full border border-ivory/15 px-4 py-2.5 text-center">
                  {t.home.gifting}
                </li>
                <li className="rounded-full border border-ivory/15 px-4 py-2.5 text-center">
                  {t.home.local}
                </li>
              </ul>
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

      <section className="border-y border-forest/10 bg-[linear-gradient(135deg,#efe4d4_0%,#fbf7f0_40%,#f0d4cc_78%,#dfe9e6_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
          <Reveal>
            <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
              {t.home.networkKicker}
            </p>
            <h2 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
              {t.home.networkTitle}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-moss">
              {t.home.networkBody}
            </p>
          </Reveal>

          <div className="relative mt-12 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-0">
            <article className="network-city">
              <p className="text-[11px] tracking-[0.2em] text-meadow uppercase">
                {t.home.dalatStatus}
              </p>
              <h3 className="serif mt-2 text-4xl text-forest sm:text-5xl">
                {t.home.dalatName}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-moss">
                {t.home.dalatNote}
              </p>
              <Link
                href={`/${locale}/shop`}
                className="mt-8 inline-flex min-h-12 items-center rounded-full bg-forest px-6 text-[12px] tracking-[0.16em] text-ivory uppercase"
              >
                {t.home.dalatCta}
              </Link>
            </article>

            <div
              className="hidden items-center px-8 md:flex"
              aria-hidden="true"
            >
              <div className="network-line h-px w-24 bg-citrus/50" />
            </div>

            <article className="network-city border-t border-forest/15 pt-10 md:border-t-0 md:pt-0 md:text-right">
              <p className="text-[11px] tracking-[0.2em] text-rose/80 uppercase">
                {t.home.danangStatus}
              </p>
              <h3 className="serif mt-2 text-4xl text-forest/55 sm:text-5xl">
                {t.home.danangName}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-moss md:ml-auto">
                {t.home.danangNote}
              </p>
              <p className="mt-8 inline-block text-[12px] tracking-[0.16em] text-moss/70 uppercase">
                {t.home.danangCta}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <Reveal>
            <h2 className="serif text-4xl text-forest sm:text-5xl">
              {t.home.deliveryTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-moss">
              {t.home.deliveryBody}
            </p>
            <Link
              href={`/${locale}/delivery`}
              className="mt-6 inline-flex min-h-11 items-center text-[12px] tracking-[0.16em] text-citrus uppercase border-b border-citrus/50"
            >
              {t.nav.delivery}
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={1}>
              <Link
                href={`/${locale}/weddings`}
                className="group flex min-h-[11rem] flex-col justify-end rounded-[1.5rem] bg-petal/40 p-6 transition duration-500 hover:-translate-y-1"
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
    </div>
  );
}
