import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { AccountShell } from "@/components/account-shell";
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
    redirect(`/${locale}/account/login`);
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
    <AccountShell>
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-forest/10 bg-white shadow-[0_24px_60px_rgba(26,23,20,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-forest/8 bg-cream/50 px-5 py-6 sm:px-7">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-citrus uppercase">
              {t.joinKicker}
            </p>
            <h1 className="serif mt-2 text-3xl text-forest sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-2 text-sm text-moss">
              {customer.name || customer.email || customer.zaloId || "—"}
            </p>
          </div>
          <form action={logoutAction.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest/12 bg-white px-4 text-sm text-forest transition hover:border-citrus/35"
            >
              {t.logout}
            </button>
          </form>
        </div>

        <section className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-forest">{t.ordersTitle}</h2>
            <Link
              href={`/${locale}/shop`}
              className="text-sm font-medium text-citrus underline-offset-2 hover:underline"
            >
              {dictionary.nav.shop}
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-cream/70 px-4 py-4 text-sm leading-6 text-moss">
              {t.ordersEmpty}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-forest/10 overflow-hidden rounded-2xl border border-forest/10">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3.5 text-sm"
                >
                  <div>
                    <div className="font-medium text-forest">{order.reference}</div>
                    <div className="text-moss">
                      {order.createdAt.toISOString().slice(0, 10)} · {order.status}
                    </div>
                  </div>
                  <div className="tabular-nums text-forest">
                    {order.deliveryTotal.toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US",
                    )}{" "}
                    ₫
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AccountShell>
  );
}
