import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { CheckoutForm } from "@/components/checkout-form";
import {
  getDeliveryConfig,
  listActiveDeliveryZones,
} from "@/lib/delivery-settings";
import { getActiveCity } from "@/lib/locations";
import { getCurrentCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

function formatCheckoutPhone(phone: string | null | undefined) {
  if (!phone) return undefined;
  if (phone.startsWith("84") && phone.length >= 10) {
    return `0${phone.slice(2)}`;
  }
  return phone;
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const city = await getActiveCity();
  const [deliveryConfig, zones, customer] = await Promise.all([
    getDeliveryConfig(city.slug),
    listActiveDeliveryZones(city.slug),
    getCurrentCustomer().catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {t.checkout.kicker}
      </p>
      <h1 className="serif mt-3 max-w-2xl text-5xl text-forest">{t.checkout.title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-moss">{t.checkout.intro}</p>
      <div className="mt-12">
        <CheckoutForm
          key={city.slug}
          locale={locale}
          dictionary={t}
          citySlug={city.slug}
          deliveryConfig={deliveryConfig}
          zones={zones}
          defaults={{
            name: customer?.name || undefined,
            email: customer?.email || undefined,
            phone: formatCheckoutPhone(customer?.phone),
            address: customer?.address || undefined,
          }}
        />
      </div>
    </div>
  );
}
