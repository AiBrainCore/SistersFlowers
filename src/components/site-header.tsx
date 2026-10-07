"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "@/context/cart-context";
import { LanguageSwitch } from "@/components/language-switch";

export function SiteHeader({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: `/${locale}/shop`, label: dictionary.nav.shop },
    { href: `/${locale}/custom`, label: dictionary.nav.custom },
    { href: `/${locale}/weddings`, label: dictionary.nav.weddings },
    { href: `/${locale}/hotels`, label: dictionary.nav.hotels },
    { href: `/${locale}/delivery`, label: dictionary.nav.delivery },
    { href: `/${locale}/about`, label: dictionary.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href={`/${locale}`} className="min-w-0">
          <p className="serif text-xl leading-none text-forest sm:text-2xl">
            {dictionary.brand}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.28em] text-moss uppercase">
            {dictionary.origin}
          </p>
        </Link>
        <nav className="hidden items-center gap-6 text-[12px] tracking-[0.16em] text-forest uppercase lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-rose">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitch locale={locale} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-forest/20 px-3 py-1.5 text-[11px] tracking-[0.16em] uppercase"
          >
            {dictionary.cart.title}
            {count > 0 ? ` · ${count}` : ""}
          </button>
          <button
            type="button"
            className="lg:hidden text-[11px] tracking-[0.16em] uppercase"
            onClick={() => setMenuOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="flex flex-col gap-3 border-t border-forest/10 px-5 py-4 text-[12px] tracking-[0.16em] uppercase lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
