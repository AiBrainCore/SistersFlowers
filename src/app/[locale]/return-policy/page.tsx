import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/return-policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.returnPolicy.title,
    description: t.returnPolicy.intro,
    pathWithoutLocale: "/return-policy",
  });
}

export default async function ReturnPolicyPage({
  params,
}: PageProps<"/[locale]/return-policy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const p = t.returnPolicy;

  const sections = [
    { title: p.noReturnsTitle, body: p.noReturnsBody },
    { title: p.confirmTitle, body: p.confirmBody },
    { title: p.perishableTitle, body: p.perishableBody },
    { title: p.studioErrorTitle, body: p.studioErrorBody },
    { title: p.contactTitle, body: p.contactBody },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-5 sm:py-16">
      <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
        {p.kicker}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">{p.title}</h1>
      <p className="mt-5 text-sm leading-7 text-moss">{p.intro}</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-forest">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="serif text-2xl text-forest">{section.title}</h2>
            <p className="mt-2 text-moss">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/${locale}/contact`}
          className="inline-flex min-h-11 items-center rounded-full bg-citrus px-5 text-[12px] tracking-[0.12em] text-ivory uppercase transition hover:bg-citrus/90"
        >
          {p.contactCta}
        </Link>
        <Link
          href={`/${locale}/terms`}
          className="inline-flex min-h-11 items-center text-moss underline decoration-citrus/40 underline-offset-4 hover:text-citrus"
        >
          {t.nav.terms}
        </Link>
      </div>
    </div>
  );
}
