"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CategoryPublic } from "@/lib/category-constants";
import { OCCASION_NAV_SLUGS } from "@/lib/category-constants";
import { useCart } from "@/context/cart-context";
import { LanguageSwitch } from "@/components/language-switch";
import { CitySwitcher } from "@/components/city-switcher";

type OccasionLink = Pick<
  CategoryPublic,
  "slug" | "nameEn" | "nameVi" | "productCount"
>;

const OCCASION_FALLBACK: Record<
  (typeof OCCASION_NAV_SLUGS)[number],
  { en: string; vi: string }
> = {
  birthday: { en: "Birthday", vi: "Sinh nhật" },
  romance: { en: "Romance", vi: "Lãng mạn" },
  graduation: { en: "Graduation", vi: "Tốt nghiệp" },
  wedding: { en: "Wedding", vi: "Cưới hỏi" },
  condolences: { en: "Condolences", vi: "Chia buồn" },
  everyday: { en: "Everyday", vi: "Hàng ngày" },
};

export function SiteHeader({
  locale,
  dictionary,
  occasions,
}: {
  locale: Locale;
  dictionary: Dictionary;
  occasions: OccasionLink[];
}) {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<"occasions" | "services" | null>(
    null,
  );
  const [mobileOccasions, setMobileOccasions] = useState(true);
  const [mobileServices, setMobileServices] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const occasionList = useMemo(() => {
    const bySlug = new Map(occasions.map((o) => [o.slug, o]));
    return OCCASION_NAV_SLUGS.map((slug) => {
      const found = bySlug.get(slug);
      if (found) return found;
      const fb = OCCASION_FALLBACK[slug];
      return {
        slug,
        nameEn: fb.en,
        nameVi: fb.vi,
        productCount: 0,
      } satisfies OccasionLink;
    });
  }, [occasions]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setOpenGroup(null);
      }
    }
    function onClick(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const label = (item: OccasionLink) =>
    locale === "vi" ? item.nameVi : item.nameEn;

  const closeAll = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  const servicesLinks = [
    {
      href: `/${locale}/weddings`,
      label: dictionary.nav.servicesWeddings,
    },
    {
      href: `/${locale}/hotels`,
      label: dictionary.nav.servicesHotels,
    },
    {
      href: `/${locale}/delivery`,
      label: dictionary.nav.delivery,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <Link href={`/${locale}`} className="min-w-0" onClick={closeAll}>
          <p className="serif text-xl leading-none text-forest sm:text-2xl">
            {dictionary.brand}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.28em] text-moss uppercase">
            {dictionary.origin}
          </p>
        </Link>

        <nav
          ref={navRef}
          className="hidden items-center gap-1 text-[11px] tracking-[0.14em] text-forest uppercase xl:flex"
        >
          <Link
            href={`/${locale}/shop`}
            className="min-h-11 rounded-full px-3 py-2.5 transition hover:text-citrus"
          >
            {dictionary.nav.shop}
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-expanded={openGroup === "occasions"}
              onClick={() =>
                setOpenGroup((g) => (g === "occasions" ? null : "occasions"))
              }
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2.5 transition hover:text-citrus"
            >
              {dictionary.nav.occasions}
              <span aria-hidden className="text-[9px]">
                ▾
              </span>
            </button>
            {openGroup === "occasions" ? (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[14rem] rounded-2xl border border-forest/10 bg-paper p-2 shadow-[0_16px_40px_rgba(36,53,42,0.12)]">
                {occasionList.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/${locale}/shop?category=${item.slug}`}
                    onClick={closeAll}
                    className="block min-h-11 rounded-xl px-3 py-2.5 normal-case tracking-normal hover:bg-cream/80"
                  >
                    {label(item)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href={`/${locale}/custom`}
            className="min-h-11 rounded-full px-3 py-2.5 transition hover:text-citrus"
          >
            {dictionary.nav.custom}
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-expanded={openGroup === "services"}
              onClick={() =>
                setOpenGroup((g) => (g === "services" ? null : "services"))
              }
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-2.5 transition hover:text-citrus"
            >
              {dictionary.nav.services}
              <span aria-hidden className="text-[9px]">
                ▾
              </span>
            </button>
            {openGroup === "services" ? (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[15rem] rounded-2xl border border-forest/10 bg-paper p-2 shadow-[0_16px_40px_rgba(36,53,42,0.12)]">
                {servicesLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className="block min-h-11 rounded-xl px-3 py-2.5 normal-case tracking-normal hover:bg-cream/80"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href={`/${locale}/delivery`}
            className="min-h-11 rounded-full px-3 py-2.5 transition hover:text-citrus"
          >
            {dictionary.nav.delivery}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <CitySwitcher locale={locale} dictionary={dictionary} />
          <LanguageSwitch locale={locale} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 rounded-full border border-forest/15 bg-white/70 px-3.5 text-[11px] tracking-[0.14em] uppercase transition hover:border-citrus/40"
          >
            {dictionary.cart.title}
            {count > 0 ? ` · ${count}` : ""}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-forest/15 text-[11px] tracking-[0.14em] uppercase xl:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? dictionary.nav.close : dictionary.nav.menu}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 top-[65px] z-40 bg-paper xl:hidden">
          <nav className="mx-auto flex h-full max-w-6xl flex-col gap-1 overflow-y-auto px-4 py-5 sm:px-5">
            <Link
              href={`/${locale}/shop`}
              onClick={closeAll}
              className="flex min-h-12 items-center border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.shop}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOccasions((v) => !v)}
              className="flex min-h-12 items-center justify-between border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.occasions}
              <span aria-hidden>{mobileOccasions ? "−" : "+"}</span>
            </button>
            {mobileOccasions ? (
              <div className="mb-2 space-y-1 border-b border-forest/10 pb-3 pl-3">
                {occasionList.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/${locale}/shop?category=${item.slug}`}
                    onClick={closeAll}
                    className="flex min-h-11 items-center text-sm text-moss"
                  >
                    {label(item)}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link
              href={`/${locale}/custom`}
              onClick={closeAll}
              className="flex min-h-12 items-center border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.custom}
            </Link>

            <button
              type="button"
              onClick={() => setMobileServices((v) => !v)}
              className="flex min-h-12 items-center justify-between border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.services}
              <span aria-hidden>{mobileServices ? "−" : "+"}</span>
            </button>
            {mobileServices ? (
              <div className="mb-2 space-y-1 border-b border-forest/10 pb-3 pl-3">
                {servicesLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className="flex min-h-11 items-center text-sm text-moss"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link
              href={`/${locale}/delivery`}
              onClick={closeAll}
              className="flex min-h-12 items-center border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.delivery}
            </Link>
            <Link
              href={`/${locale}/about`}
              onClick={closeAll}
              className="flex min-h-12 items-center text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.about}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
