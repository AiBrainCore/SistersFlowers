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
import { IconBag } from "@/components/nav-icons";

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

  const dropdownClass =
    "glass-menu absolute top-full left-0 z-50 mt-1.5 min-w-[14rem] rounded-2xl p-2";

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-paper/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3">
        {/* Brand + city (Variant A) */}
        <div className="min-w-0 shrink-0">
          <Link
            href={`/${locale}`}
            className="serif block text-xl leading-none text-forest sm:text-2xl"
            onClick={closeAll}
          >
            {dictionary.brand}
          </Link>
          <CitySwitcher locale={locale} dictionary={dictionary} align="left" />
        </div>

        {/* Centre nav — from 1200px to avoid cramped mid-widths */}
        <nav
          ref={navRef}
          className="hidden items-center gap-0.5 text-[11px] tracking-[0.14em] text-forest uppercase min-[1200px]:flex"
        >
          <Link
            href={`/${locale}/shop`}
            className="min-h-11 rounded-full px-2.5 py-2.5 transition hover:text-citrus lg:px-3"
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
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 py-2.5 transition hover:text-citrus lg:px-3"
            >
              {dictionary.nav.occasions}
              <span aria-hidden className="text-[9px]">
                ▾
              </span>
            </button>
            {openGroup === "occasions" ? (
              <div className={dropdownClass}>
                {occasionList.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/${locale}/shop?category=${item.slug}`}
                    onClick={closeAll}
                    className="block min-h-11 rounded-xl px-3 py-2.5 normal-case tracking-normal hover:bg-cream/70"
                  >
                    {label(item)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href={`/${locale}/custom`}
            className="min-h-11 rounded-full px-2.5 py-2.5 transition hover:text-citrus lg:px-3"
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
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 py-2.5 transition hover:text-citrus lg:px-3"
            >
              {dictionary.nav.services}
              <span aria-hidden className="text-[9px]">
                ▾
              </span>
            </button>
            {openGroup === "services" ? (
              <div className={`${dropdownClass} min-w-[15rem]`}>
                {servicesLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className="block min-h-11 rounded-xl px-3 py-2.5 normal-case tracking-normal hover:bg-cream/70"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href={`/${locale}/delivery`}
            className="min-h-11 rounded-full px-2.5 py-2.5 transition hover:text-citrus lg:px-3"
          >
            {dictionary.nav.delivery}
          </Link>
        </nav>

        {/* Right: language (desktop) + bag + hamburger */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden min-[1200px]:block">
            <LanguageSwitch locale={locale} dictionary={dictionary} />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={dictionary.cart.openAria}
            title={dictionary.cart.openAria}
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-forest/12 bg-white/55 text-forest transition hover:border-citrus/35 hover:text-citrus"
          >
            <IconBag />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-citrus px-1 text-[10px] font-medium text-ivory">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-forest/12 text-[13px] text-forest min-[1200px]:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? dictionary.nav.close : dictionary.nav.menu}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 top-[62px] z-40 bg-paper/96 backdrop-blur-sm min-[1200px]:hidden">
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
              className="flex min-h-12 items-center border-b border-forest/10 text-[13px] tracking-[0.16em] uppercase"
            >
              {dictionary.nav.about}
            </Link>

            <div className="mt-4 border-t border-forest/10 pt-4">
              <LanguageSwitch
                locale={locale}
                dictionary={dictionary}
                variant="panel"
              />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
