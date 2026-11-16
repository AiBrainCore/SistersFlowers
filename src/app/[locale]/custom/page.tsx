import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { BouquetBuilder } from "@/components/bouquet-builder";
import { buildPageMetadata } from "@/lib/seo";
import { DEFAULT_BUILDER_LOCATION } from "@/data/bouquet-builder";
import { getBuilderCatalog } from "@/lib/builder-settings";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/custom">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.custom.title,
    description: t.custom.intro,
    pathWithoutLocale: "/custom",
  });
}

export default async function CustomPage({
  params,
}: PageProps<"/[locale]/custom">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const catalog = await getBuilderCatalog();

  return (
    <div>
      <section className="border-b border-forest/8 bg-[linear-gradient(180deg,#fff7f0_0%,#f7efe6_100%)]">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 sm:px-5 sm:pb-10 sm:pt-28">
          <h1 className="serif text-3xl text-forest sm:text-4xl lg:text-5xl">
            {t.custom.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-moss sm:text-[15px] sm:leading-7">
            {t.custom.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-5 sm:pb-20 sm:pt-10">
        <BouquetBuilder
          locale={locale}
          dictionary={t}
          catalog={catalog}
          locationId={DEFAULT_BUILDER_LOCATION}
        />
      </section>
    </div>
  );
}
