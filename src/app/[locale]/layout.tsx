import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { listActiveCategories } from "@/lib/categories";
import { getActiveCity, listCities } from "@/lib/locations";
import { CartProvider } from "@/context/cart-context";
import { LocationProvider } from "@/context/location-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { LocationBanner } from "@/components/location-banner";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "vi" }];
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale as Locale);
  const [categories, cities, activeCity] = await Promise.all([
    listActiveCategories(),
    listCities(),
    getActiveCity(),
  ]);

  return (
    <CartProvider>
      <LocationProvider cities={cities} activeCity={activeCity}>
        <div className="flex min-h-full flex-col">
          <SiteHeader
            locale={locale as Locale}
            dictionary={dictionary}
            occasions={categories}
          />
          <LocationBanner
            locale={locale as Locale}
            dictionary={dictionary}
          />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale as Locale} dictionary={dictionary} />
          <CartDrawer locale={locale as Locale} dictionary={dictionary} />
        </div>
      </LocationProvider>
    </CartProvider>
  );
}
