import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BRAND } from "@/lib/brand";

const BRAND_SINCE = 2020;

export function SiteFooter({
  locale,
  dictionary,
  whatsappDigits,
}: {
  locale: Locale;
  dictionary: Dictionary;
  whatsappDigits: string;
}) {
  const t = dictionary.footer;
  const nav = dictionary.nav;
  const year = new Date().getFullYear();
  const yearsLabel = year > BRAND_SINCE ? `${BRAND_SINCE}–${year}` : `${BRAND_SINCE}`;
  const rights = t.rights.replace("{years}", yearsLabel);

  const shopLinks = [
    { href: `/${locale}/shop`, label: nav.shop },
    { href: `/${locale}/custom`, label: nav.custom },
    { href: `/${locale}/weddings`, label: nav.servicesWeddings },
    { href: `/${locale}/hotels`, label: nav.servicesHotels },
    { href: `/${locale}/delivery`, label: nav.delivery },
  ];

  const studioLinks = [
    { href: `/${locale}/about`, label: nav.about },
    { href: `/${locale}/contact`, label: nav.contact },
    { href: `/${locale}/account`, label: nav.account },
    {
      href: `https://wa.me/${whatsappDigits}`,
      label: "WhatsApp",
      external: true,
    },
  ];

  const legalLinks = [
    { href: `/${locale}/terms`, label: nav.terms },
    { href: `/${locale}/contact`, label: t.legalContact },
  ];

  return (
    <footer className="border-t border-forest/10 bg-[#f7efe6]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <div className="max-w-md">
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
            <p className="mt-5 text-sm leading-7 text-forest/80">{t.seo}</p>
            <p className="mt-3 text-sm leading-7 text-moss">{t.seoExtra}</p>
          </div>

          <FooterColumn title={t.colShop}>
            {shopLinks.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t.colStudio}>
            {studioLinks.map((item) =>
              "external" in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-10 inline-flex items-center text-sm text-forest/80 transition hover:text-citrus"
                >
                  {item.label}
                </a>
              ) : (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ),
            )}
          </FooterColumn>

          <FooterColumn title={t.colLegal}>
            <p className="mb-3 text-sm leading-6 text-moss">{t.legalBlurb}</p>
            {legalLinks.map((item) => (
              <FooterLink key={`${item.href}-${item.label}`} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>
      </div>

      <p className="border-t border-forest/10 px-5 py-4 text-center text-[11px] leading-5 tracking-[0.08em] text-moss">
        {rights}
      </p>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] text-citrus uppercase">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="min-h-10 inline-flex items-center text-sm text-forest/80 transition hover:text-citrus"
    >
      {children}
    </Link>
  );
}
