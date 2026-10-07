import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { listPublishedProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

const fieldImage = "/bouquets/b-16.jpg";
const mistImage = "/bouquets/b-12.jpg";
const hotelImage = "/bouquets/b-01.jpg";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const featured = (await listPublishedProducts()).slice(0, 8);

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={fieldImage}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/25 to-black/10" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 text-ivory">
          <p className="text-[11px] tracking-[0.32em] uppercase">{t.hero.kicker}</p>
          <h1 className="serif mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light">{t.hero.subtitle}</p>
          <p className="mt-4 max-w-lg text-sm leading-7 text-ivory/85">{t.hero.body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/shop`}
              className="rounded-full bg-ivory px-6 py-3 text-[12px] tracking-[0.16em] text-forest uppercase"
            >
              {t.hero.shop}
            </Link>
            <Link
              href={`/${locale}/custom`}
              className="rounded-full border border-ivory/70 px-6 py-3 text-[12px] tracking-[0.16em] uppercase"
            >
              {t.hero.custom}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-3">
        {[
          { href: "shop", title: t.paths.shopTitle, body: t.paths.shopBody },
          { href: "custom", title: t.paths.customTitle, body: t.paths.customBody },
          {
            href: "weddings",
            title: t.paths.occasionTitle,
            body: t.paths.occasionBody,
          },
        ].map((path) => (
          <Link
            key={path.href}
            href={`/${locale}/${path.href}`}
            className="rounded-[2rem] bg-cream/70 p-8 transition hover:-translate-y-1 hover:bg-blush/40"
          >
            <h2 className="serif text-3xl text-forest">{path.title}</h2>
            <p className="mt-3 text-sm leading-7 text-moss">{path.body}</p>
          </Link>
        ))}
      </section>

      <section className="grid items-stretch lg:grid-cols-2">
        <div className="relative min-h-[420px]">
          <Image src={mistImage} alt="" fill className="object-cover" sizes="50vw" />
        </div>
        <div className="flex flex-col justify-center bg-forest px-8 py-16 text-ivory sm:px-16">
          <p className="text-[11px] tracking-[0.28em] uppercase">{t.origin}</p>
          <h2 className="serif mt-4 text-4xl sm:text-5xl">{t.home.fieldTitle}</h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-ivory/80">
            {t.home.fieldBody}
          </p>
          <ul className="mt-8 grid gap-2 text-[12px] tracking-[0.14em] uppercase">
            <li>{t.home.fresh}</li>
            <li>{t.home.handmade}</li>
            <li>{t.home.gifting}</li>
            <li>{t.home.local}</li>
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-forest/10 bg-[linear-gradient(135deg,#efe4d4_0%,#fbf7f0_45%,#e7c6c4_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
            {t.home.networkKicker}
          </p>
          <h2 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
            {t.home.networkTitle}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-moss">
            {t.home.networkBody}
          </p>

          <div className="relative mt-14 grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-0">
            <article className="network-city">
              <p className="text-[11px] tracking-[0.2em] text-moss uppercase">
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
                className="mt-8 inline-block rounded-full bg-forest px-6 py-3 text-[12px] tracking-[0.16em] text-ivory uppercase"
              >
                {t.home.dalatCta}
              </Link>
            </article>

            <div
              className="hidden items-center px-8 md:flex"
              aria-hidden="true"
            >
              <div className="network-line h-px w-24 bg-forest/35" />
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

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="serif text-4xl text-forest">{t.home.featured}</h2>
          <Link
            href={`/${locale}/shop`}
            className="text-[12px] tracking-[0.16em] uppercase border-b border-rose"
          >
            {t.home.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      </section>

      <section className="bg-cream/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
          <div>
            <h2 className="serif text-4xl text-forest">{t.home.deliveryTitle}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-moss">
              {t.home.deliveryBody}
            </p>
            <Link
              href={`/${locale}/delivery`}
              className="mt-6 inline-block text-[12px] tracking-[0.16em] uppercase border-b border-forest"
            >
              {t.nav.delivery}
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link href={`/${locale}/hotels`} className="group overflow-hidden rounded-[1.8rem]">
              <div className="relative h-52">
                <Image
                  src={hotelImage}
                  alt=""
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="40vw"
                />
              </div>
              <div className="bg-paper p-5">
                <h3 className="serif text-2xl">{t.home.hotelTitle}</h3>
                <p className="mt-2 text-sm text-moss">{t.home.hotelBody}</p>
              </div>
            </Link>
            <Link
              href={`/${locale}/weddings`}
              className="flex flex-col justify-end rounded-[1.8rem] bg-blush/50 p-6"
            >
              <h3 className="serif text-2xl text-forest">{t.home.weddingTitle}</h3>
              <p className="mt-2 text-sm text-moss">{t.home.weddingBody}</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
