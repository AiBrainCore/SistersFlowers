import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { BouquetBuilder } from "@/components/bouquet-builder";
import { buildPageMetadata } from "@/lib/seo";
import { DEFAULT_BUILDER_LOCATION } from "@/data/bouquet-builder";

const image = "/bouquets/shown/w-06.jpg";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/custom">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
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
  const t = getDictionary(locale);

  return (
    <div>
      <section className="relative min-h-[34vh] overflow-hidden sm:min-h-[38vh]">
        <Image
          src={image}
          alt=""
          fill
          priority
          className="object-cover object-[center_35%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/55 to-paper/10" />
        <div className="relative mx-auto flex min-h-[34vh] max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:min-h-[38vh] sm:px-5 sm:pb-12">
          <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.custom.kicker}
          </p>
          <h1 className="serif mt-3 max-w-2xl text-4xl text-forest sm:text-5xl lg:text-6xl">
            {t.custom.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-moss">
            {t.custom.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-5 sm:pb-20">
        <BouquetBuilder
          locale={locale}
          dictionary={t}
          locationId={DEFAULT_BUILDER_LOCATION}
        />
      </section>
    </div>
  );
}
