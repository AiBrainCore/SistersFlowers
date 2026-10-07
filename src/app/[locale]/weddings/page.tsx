import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { InquiryForm } from "@/components/inquiry-form";

const image = "/bouquets/b-11.jpg";

export default async function WeddingsPage({
  params,
}: PageProps<"/[locale]/weddings">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <section className="relative h-[48vh] min-h-[320px]">
        <Image src={image} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-forest/45" />
        <div className="relative mx-auto flex h-full max-w-6xl items-end px-5 pb-10 text-ivory">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase">{t.weddings.kicker}</p>
            <h1 className="serif mt-3 max-w-2xl text-4xl sm:text-6xl">
              {t.weddings.title}
            </h1>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2">
        <p className="max-w-md text-sm leading-7 text-moss">{t.weddings.intro}</p>
        <InquiryForm dictionary={t} variant="wedding" />
      </section>
    </div>
  );
}
