import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { buildPageMetadata } from "@/lib/seo";
import { STUDIO_CONTACTS, STUDIO_PHONE_DIGITS } from "@/lib/locations";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5 sm:py-16">
      <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
        {t.contact.kicker}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
        {t.contact.title}
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-moss">{t.contact.intro}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {STUDIO_CONTACTS.map((studio) => {
          const name = locale === "vi" ? studio.nameVi : studio.nameEn;
          const address =
            locale === "vi" ? studio.addressVi : studio.addressEn;
          return (
            <article
              key={studio.slug}
              className="rounded-2xl border border-citrus/15 bg-white/60 px-5 py-5"
            >
              <h2 className="serif text-2xl text-citrus">{name}</h2>
              <p className="mt-3 text-sm leading-6 text-forest">{address}</p>
              <ul className="mt-4 space-y-1">
                {studio.phones.map((phone) => (
                  <li key={phone.digits}>
                    <a
                      href={`tel:+${phone.digits}`}
                      className="inline-flex min-h-11 items-center text-sm font-medium text-forest hover:text-citrus"
                    >
                      {phone.display}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <a
        href={`https://wa.me/${STUDIO_PHONE_DIGITS}`}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-ivory uppercase"
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>

      <p className="mt-10 text-sm text-moss">
        <Link href={`/${locale}/about`} className="underline hover:text-citrus">
          {t.nav.about}
        </Link>
        {" · "}
        <Link href={`/${locale}/shop`} className="underline hover:text-citrus">
          {t.nav.shop}
        </Link>
      </p>
    </div>
  );
}
