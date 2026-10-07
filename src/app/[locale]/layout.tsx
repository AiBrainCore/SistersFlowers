import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CartProvider } from "@/context/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";

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

  return (
    <CartProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader locale={locale as Locale} dictionary={dictionary} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale as Locale} dictionary={dictionary} />
        <CartDrawer locale={locale as Locale} dictionary={dictionary} />
      </div>
    </CartProvider>
  );
}
