import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { DeliveryCalculator } from "@/components/delivery-calculator";
import {
  getDeliveryConfig,
  listActiveDeliveryZones,
} from "@/lib/delivery-settings";
import { formatVnd } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function DeliveryPage({
  params,
}: PageProps<"/[locale]/delivery">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [config, zones] = await Promise.all([
    getDeliveryConfig(),
    listActiveDeliveryZones(),
  ]);

  const guide = [
    {
      range: `0–${config.includedKm} km`,
      price: formatVnd(config.baseFee, locale),
      note: t.delivery.guideNear,
    },
    {
      range: `${config.includedKm}–${config.midKm} km`,
      price: formatVnd(config.midFee, locale),
      note: t.delivery.guideMid,
    },
    {
      range: `${config.midKm}–${config.maxKm} km`,
      price: formatVnd(config.maxFee, locale),
      note: t.delivery.guideFar,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {t.delivery.kicker}
      </p>
      <h1 className="serif mt-3 max-w-3xl text-5xl text-forest">
        {t.delivery.title}
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-moss">{t.delivery.intro}</p>

      <div className="mt-12">
        <DeliveryCalculator
          locale={locale}
          dictionary={t}
          config={config}
          zones={zones}
        />
      </div>

      <div className="mt-14 grid gap-6 border-t border-forest/10 pt-12 md:grid-cols-3">
        {guide.map((item) => (
          <div key={item.range}>
            <p className="text-[11px] tracking-[0.18em] text-moss uppercase">
              {item.range}
            </p>
            <p className="serif mt-2 text-2xl text-forest">{item.price}</p>
            <p className="mt-2 text-sm leading-7 text-moss">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href={`/${locale}/shop`}
          className="rounded-full bg-forest px-6 py-3 text-[12px] tracking-[0.16em] text-ivory uppercase"
        >
          {t.delivery.shopCta}
        </Link>
        <Link
          href={`/${locale}/checkout`}
          className="rounded-full border border-forest/25 px-6 py-3 text-[12px] tracking-[0.16em] uppercase"
        >
          {t.delivery.checkoutCta}
        </Link>
      </div>
    </div>
  );
}
