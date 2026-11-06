import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  STUDIO_PHONE_DIGITS,
  STUDIO_PHONE_DISPLAY,
} from "@/lib/locations";

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.footer;
  const danangAddress =
    locale === "vi"
      ? "53 Lương Nhữ Hộc, Hòa Cường Bắc, Hải Châu, Đà Nẵng"
      : "53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau, Da Nang";
  const dalatAddress =
    locale === "vi"
      ? "Số 04 Chi Lăng, P. 9, TP. Đà Lạt, Lâm Đồng"
      : "04 Chi Lang, Ward 9, Da Lat, Lam Dong";

  return (
    <footer className="border-t border-forest/10 bg-cream/55">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="serif text-3xl text-citrus">{dictionary.brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-moss">{t.line}</p>
          <p className="mt-5 text-[11px] tracking-[0.16em] text-moss uppercase">
            {t.phone}
          </p>
          <a
            href={`tel:+${STUDIO_PHONE_DIGITS}`}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-forest hover:text-citrus"
          >
            {STUDIO_PHONE_DISPLAY}
          </a>
          <p className="mt-5 text-[11px] tracking-[0.16em] text-moss uppercase">
            {t.address}
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-forest">
            <li>
              <span className="font-medium text-citrus">
                {dictionary.home.danangName}
              </span>
              <br />
              {danangAddress}
            </li>
            <li>
              <span className="font-medium text-citrus">
                {dictionary.home.dalatName}
              </span>
              <br />
              {dalatAddress}
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] tracking-[0.14em] text-forest uppercase">
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
      <p className="border-t border-forest/10 px-5 py-4 text-center text-[11px] tracking-[0.12em] text-moss">
        {t.rights}
      </p>
    </footer>
  );
}
