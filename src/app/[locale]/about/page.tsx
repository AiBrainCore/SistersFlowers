import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

const image = "/bouquets/b-20.jpg";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.about.title,
    description: t.about.p1.slice(0, 160),
    pathWithoutLocale: "/about",
  });
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <section className="relative h-[46vh] min-h-[300px]">
        <Image src={image} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/10 to-transparent" />
      </section>
      <article className="mx-auto max-w-2xl px-4 py-14 sm:px-5 sm:py-16">
        <div className="glass rounded-[1.75rem] p-6 sm:p-10">
          <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.about.kicker}
          </p>
          <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
            {t.about.title}
          </h1>
          <div className="mt-8 space-y-6 text-sm leading-8 text-moss">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
            <p>{t.about.p3}</p>
            <p>{t.about.p4}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
