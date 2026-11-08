import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  STUDIO_CONTACTS,
  STUDIO_PHONE_DIGITS,
} from "@/lib/locations";

const BRAND_SINCE = 2020;

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.footer;
  const year = new Date().getFullYear();
  const yearsLabel = year > BRAND_SINCE ? `${BRAND_SINCE}–${year}` : `${BRAND_SINCE}`;
  const rights = t.rights.replace("{years}", yearsLabel);

  return (
    <footer className="border-t border-forest/10 bg-cream/55">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
        <div className="max-w-xl">
          <p className="serif text-2xl text-forest sm:text-3xl">{t.studios}</p>
          <p className="mt-3 text-sm leading-7 text-moss">{t.line}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STUDIO_CONTACTS.map((studio) => {
            const name = locale === "vi" ? studio.nameVi : studio.nameEn;
            const address =
              locale === "vi" ? studio.addressVi : studio.addressEn;
            return (
              <article
                key={studio.slug}
                className="rounded-2xl border border-citrus/15 bg-white/55 px-5 py-5"
              >
                <h3 className="serif text-2xl text-citrus">{name}</h3>
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
            href={`https://wa.me/${STUDIO_PHONE_DIGITS}`}
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
