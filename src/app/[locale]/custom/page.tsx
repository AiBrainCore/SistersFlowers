import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { BouquetBuilder } from "@/components/bouquet-builder";
import { buildPageMetadata } from "@/lib/seo";
import { DEFAULT_BUILDER_LOCATION } from "@/data/bouquet-builder";

const image = "/bouquets/shown/w-06.jpg";

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

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/70 to-paper/25" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-20 sm:px-5 sm:pb-8 sm:pt-24">
          <h1 className="serif text-3xl text-forest sm:text-4xl lg:text-5xl">
            {t.custom.title}
          </h1>
          <p className="mt-3 max-w-none text-sm leading-6 text-moss sm:text-[15px] sm:leading-7">
            {t.custom.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-5 sm:pb-20 sm:pt-5">
        <BouquetBuilder
          locale={locale}
          dictionary={t}
          locationId={DEFAULT_BUILDER_LOCATION}
        />
      </section>
    </div>
  );
}
