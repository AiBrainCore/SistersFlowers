import Link from "next/link";
import { notFound } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/db";
import { getActiveCity } from "@/lib/locations";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const city = await getActiveCity();
  const dictionary = getDictionary(locale, city.nameEn);
  const t = dictionary.account;
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
        <h1 className="font-display text-3xl text-forest">{t.title}</h1>
        <p className="mt-3 max-w-lg text-forest/70">{t.guestBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/${locale}/account/login`} className="btn-primary min-h-11">
            {t.loginLink}
          </Link>
          <Link
            href={`/${locale}/account/register`}
            className="min-h-11 rounded-full border border-forest/15 bg-white px-5 py-2.5 text-sm font-medium text-forest"
          >
            {t.registerLink}
          </Link>
        </div>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: customer.id },
        ...(customer.email ? [{ email: customer.email }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-forest sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-forest/70">
            {customer.name || customer.email || customer.zaloId || "—"}
          </p>
        </div>
        <form action={logoutAction.bind(null, locale)}>
          <button
            type="submit"
            className="min-h-11 rounded-full border border-forest/15 bg-white px-4 text-sm text-forest"
          >
            {t.logout}
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-forest">{t.ordersTitle}</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-forest/65">{t.ordersEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-forest">{order.reference}</div>
                  <div className="text-forest/60">
                    {order.createdAt.toISOString().slice(0, 10)} · {order.status}
                  </div>
                </div>
                <div className="tabular-nums text-forest">
                  {order.deliveryTotal.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
                  ₫
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
