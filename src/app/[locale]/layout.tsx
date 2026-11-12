import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { listActiveCategories } from "@/lib/categories";
import { listCities } from "@/lib/locations";
import { getStorefrontDictionary } from "@/lib/storefront";
import { CartProvider } from "@/context/cart-context";
import { LocationProvider } from "@/context/location-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { LocationBanner } from "@/components/location-banner";
import { LocaleHtmlLang } from "@/components/locale-html-lang";
import { ShopBotRoot } from "@/components/shop-bot/ShopBotRoot";
import { WebMcpTools } from "@/components/webmcp-tools";
import { STUDIO_PHONE_DIGITS } from "@/lib/studio-contacts";

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [{ dictionary, activeCity }, categories, cities] = await Promise.all([
    getStorefrontDictionary(locale as Locale),
    listActiveCategories(),
    listCities(),
  ]);

  return (
    <CartProvider>
      <LocationProvider cities={cities} activeCity={activeCity}>
        <LocaleHtmlLang locale={locale as Locale} />
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
          <SiteFooter
            locale={locale as Locale}
            dictionary={dictionary}
            whatsappDigits={STUDIO_PHONE_DIGITS}
          />
          <CartDrawer locale={locale as Locale} dictionary={dictionary} />
          <ShopBotRoot locale={locale as Locale} dictionary={dictionary} />
          <WebMcpTools locale={locale as Locale} />
        </div>
      </LocationProvider>
    </CartProvider>
  );
}
