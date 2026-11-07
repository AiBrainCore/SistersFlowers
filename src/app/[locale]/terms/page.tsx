import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.terms.title,
    description: t.terms.intro,
    pathWithoutLocale: "/terms",
  });
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-5 sm:py-16">
      <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
        {t.terms.kicker}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
        {t.terms.title}
      </h1>
      <p className="mt-5 text-sm leading-7 text-moss">{t.terms.intro}</p>
      <div className="mt-8 space-y-6 text-sm leading-7 text-forest">
        <section>
          <h2 className="serif text-2xl">{t.terms.ordersTitle}</h2>
          <p className="mt-2 text-moss">{t.terms.ordersBody}</p>
        </section>
        <section>
          <h2 className="serif text-2xl">{t.terms.deliveryTitle}</h2>
          <p className="mt-2 text-moss">{t.terms.deliveryBody}</p>
        </section>
        <section>
          <h2 className="serif text-2xl">{t.terms.privacyTitle}</h2>
          <p className="mt-2 text-moss">{t.terms.privacyBody}</p>
        </section>
      </div>
      <p className="mt-10 text-sm text-moss">
        <Link
          href={`/${locale}/contact`}
          className="underline hover:text-citrus"
        >
          {t.nav.contact}
        </Link>
      </p>
    </div>
  );
}
