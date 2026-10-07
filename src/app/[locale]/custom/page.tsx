import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { BouquetBuilder } from "@/components/bouquet-builder";

const image = "/bouquets/b-12.jpg";

export default async function CustomPage({
  params,
}: PageProps<"/[locale]/custom">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <section className="relative min-h-[42vh] overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[42vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-24">
          <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
            {t.custom.kicker}
          </p>
          <h1 className="serif mt-3 max-w-2xl text-5xl text-forest sm:text-6xl">
            {t.custom.title}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-moss">
            {t.custom.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <BouquetBuilder locale={locale} dictionary={t} />
      </section>
    </div>
  );
}
