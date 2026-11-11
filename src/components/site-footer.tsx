import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { StudioCard } from "@/components/studio-card";
import { BRAND } from "@/lib/brand";
import type { StudioContact } from "@/lib/studio-contacts";

const BRAND_SINCE = 2020;

export function SiteFooter({
  locale,
  dictionary,
  studios,
  whatsappDigits,
}: {
  locale: Locale;
  dictionary: Dictionary;
  studios: StudioContact[];
  whatsappDigits: string;
}) {
  const t = dictionary.footer;
  const year = new Date().getFullYear();
  const yearsLabel = year > BRAND_SINCE ? `${BRAND_SINCE}–${year}` : `${BRAND_SINCE}`;
  const rights = t.rights.replace("{years}", yearsLabel);

  return (
    <footer
      data-sf-site-footer
      className="border-t border-forest/10 bg-cream/55"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
        <div className="max-w-xl">
          <Link
            href={`/${locale}`}
            aria-label={BRAND.name}
            className="inline-flex"
          >
            <Image
              src={BRAND.wordmarkStackedBlack}
              alt={BRAND.name}
              width={160}
              height={98}
              className="h-14 w-auto sm:h-16"
            />
          </Link>
          <p className="serif mt-8 text-2xl text-forest sm:text-3xl">
            {t.studios}
          </p>
          <p className="mt-3 text-sm leading-7 text-moss">{t.line}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {studios.map((studio) => (
            <StudioCard
              key={studio.slug}
              studio={studio}
              locale={locale}
              directionsLabel={t.directions}
              callLabel={t.call}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-[11px] tracking-[0.14em] text-forest uppercase">
          <Link
            href={`/${locale}/shop`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.shop}
          </Link>
          <Link
            href={`/${locale}/custom`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.custom}
          </Link>
          <Link
            href={`/${locale}/weddings`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.servicesWeddings}
          </Link>
          <Link
            href={`/${locale}/hotels`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.servicesHotels}
          </Link>
          <Link
            href={`/${locale}/delivery`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.delivery}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.about}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.contact}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
          >
            {dictionary.nav.terms}
          </Link>
          <a
            href={`https://wa.me/${whatsappDigits}`}
            className="min-h-11 inline-flex items-center hover:text-citrus"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>
      <p className="border-t border-forest/10 px-5 py-4 text-center text-[11px] leading-5 tracking-[0.08em] text-moss">
        {rights}
      </p>
    </footer>
  );
}
