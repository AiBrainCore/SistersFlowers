import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { parseShopBotParams } from "@/features/shop-bot/params";
import { ShopBotFlow } from "@/components/shop-bot/ShopBotFlow";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  params,
  searchParams,
}: PageProps<"/[locale]/assistant">) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const { dictionary } = await getStorefrontDictionary(locale);
  const query = await searchParams;
  const deepLink = parseShopBotParams(query);
  const t = dictionary.shopBot;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
      <div>
        <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
          {t.pageKicker}
        </p>
        <h1 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
          {t.pageTitle}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-moss">{t.pageIntro}</p>
        <p className="mt-6 text-xs leading-6 text-moss">{t.confirmNote}</p>
        <Link
          href={`/${locale}/shop`}
          className="mt-6 inline-flex min-h-11 items-center border-b border-forest pb-0.5 text-[11px] tracking-[0.14em] uppercase"
        >
          {t.pageFallback}
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-forest/10 bg-paper/90 shadow-[0_18px_50px_rgba(36,53,42,0.08)]">
        <div className="h-[min(78dvh,720px)]">
          <ShopBotFlow
            key={`${locale}-page-${deepLink.intent}-${deepLink.budgetMaxVnd}-${deepLink.occasion}-${deepLink.source}`}
            locale={locale}
            dictionary={dictionary}
            deepLink={deepLink}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
