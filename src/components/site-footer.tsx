import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function SiteFooter({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <footer className="border-t border-forest/10 bg-cream/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="serif text-3xl text-forest">{dictionary.brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-moss">
            {dictionary.footer.line}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.16em] text-forest/70 uppercase">
            {dictionary.home.dalatName}
            <span className="mx-2 text-rose">·</span>
            {dictionary.home.danangName}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] tracking-[0.14em] text-forest uppercase">
          <Link href={`/${locale}/shop`}>{dictionary.nav.shop}</Link>
          <Link href={`/${locale}/custom`}>{dictionary.nav.custom}</Link>
          <Link href={`/${locale}/delivery`}>{dictionary.nav.delivery}</Link>
          <Link href={`/${locale}/about`}>{dictionary.nav.about}</Link>
        </div>
      </div>
      <p className="border-t border-forest/10 px-5 py-4 text-center text-[11px] tracking-[0.12em] text-moss">
        {dictionary.footer.rights}
      </p>
    </footer>
  );
}
