import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { buildPageMetadata } from "@/lib/seo";
import { StudioCard } from "@/components/studio-card";
import { STUDIO_CONTACTS } from "@/lib/studio-contacts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.contact.title,
    description: t.contact.intro,
    pathWithoutLocale: "/contact",
  });
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const c = t.contact;

  return (
    <div>
      <section className="border-b border-forest/10 bg-[linear-gradient(168deg,#fff8f2_0%,#ffe9dc_48%,#f7d7c6_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-16">
          <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
            {c.kicker}
          </p>
          <h1 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-moss">
            {c.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {STUDIO_CONTACTS.map((studio) => (
            <StudioCard
              key={studio.slug}
              studio={studio}
              locale={locale}
              directionsLabel={t.footer.directions}
              callLabel={t.footer.call}
              emphasize
              socialLabels={{
                phones: c.phonesLabel,
                social: c.socialLabel,
                chatHint: c.chatHint,
                facebook: c.facebook,
                messenger: c.messenger,
                tiktok: c.tiktok,
                whatsapp: c.whatsapp,
                zalo: c.zalo,
              }}
            />
          ))}
        </div>

        <p className="mt-12 text-sm text-moss">
          <Link
            href={`/${locale}/about`}
            className="underline decoration-citrus/40 underline-offset-4 hover:text-citrus"
          >
            {t.nav.about}
          </Link>
          {" · "}
          <Link
            href={`/${locale}/shop`}
            className="underline decoration-citrus/40 underline-offset-4 hover:text-citrus"
          >
            {t.nav.shop}
          </Link>
          {" · "}
          <Link
            href={`/${locale}/delivery`}
            className="underline decoration-citrus/40 underline-offset-4 hover:text-citrus"
          >
            {t.nav.delivery}
          </Link>
        </p>
      </section>
    </div>
  );
}
