import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { CheckoutForm } from "@/components/checkout-form";
import {
  getDeliveryConfig,
  listActiveDeliveryZones,
} from "@/lib/delivery-settings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const [deliveryConfig, zones] = await Promise.all([
    getDeliveryConfig(),
    listActiveDeliveryZones(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {t.checkout.kicker}
      </p>
      <h1 className="serif mt-3 max-w-2xl text-5xl text-forest">{t.checkout.title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-moss">{t.checkout.intro}</p>
      <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
        <li className="text-sm text-forest before:mr-2 before:text-citrus before:content-['·']">
          {t.checkout.promisePhoto}
        </li>
        <li className="text-sm text-forest before:mr-2 before:text-citrus before:content-['·']">
          {t.checkout.promiseSameDay}
        </li>
        <li className="text-sm text-forest before:mr-2 before:text-citrus before:content-['·']">
          {t.checkout.promisePay}
        </li>
      </ul>
      <div className="mt-12">
        <CheckoutForm
          locale={locale}
          dictionary={t}
          deliveryConfig={deliveryConfig}
          zones={zones}
        />
      </div>
    </div>
  );
}
