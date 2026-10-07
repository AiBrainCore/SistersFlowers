import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { InquiryForm } from "@/components/inquiry-form";

const image = "/bouquets/b-14.jpg";

export default async function HotelsPage({
  params,
}: PageProps<"/[locale]/hotels">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
          {t.hotels.kicker}
        </p>
        <h1 className="serif mt-3 text-5xl text-forest">{t.hotels.title}</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-moss">{t.hotels.intro}</p>
        <div className="relative mt-10 h-80 overflow-hidden rounded-[2.5rem]">
          <Image src={image} alt="" fill className="object-cover" sizes="50vw" />
        </div>
      </div>
      <InquiryForm dictionary={t} variant="hotel" />
    </div>
  );
}
