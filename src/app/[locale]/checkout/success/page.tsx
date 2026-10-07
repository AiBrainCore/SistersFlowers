import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const query = await searchParams;
  const reference = typeof query.ref === "string" ? query.ref : "";
  const whatsapp = typeof query.wa === "string" ? query.wa : "";

  const vouchers =
    reference.length > 0
      ? await prisma.orderItem.findMany({
          where: {
            voucherCode: { not: null },
            order: { reference },
          },
          orderBy: { id: "asc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        Sisters Flowers
      </p>
      <h1 className="serif mt-4 text-5xl text-forest">{t.checkout.successTitle}</h1>
      {reference ? (
        <p className="mt-4 text-sm tracking-[0.12em] text-moss uppercase">
          {t.checkout.reference}: {reference}
        </p>
      ) : null}
      <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-moss">
        {t.checkout.successBody}
      </p>

      {vouchers.length > 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-3xl border border-forest/10 bg-white/55 px-6 py-6 text-left">
          <p className="text-[11px] tracking-[0.18em] text-rose uppercase">
            {t.checkout.vouchersTitle}
          </p>
          <p className="mt-2 text-sm leading-6 text-moss">
            {t.checkout.vouchersHint}
          </p>
          <ul className="mt-4 space-y-3">
            {vouchers.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-forest/10 bg-cream/40 px-4 py-3"
              >
                <p className="font-mono text-lg tracking-wide text-forest">
                  {item.voucherCode}
                </p>
                <p className="mt-1 text-sm text-forest">{item.name}</p>
                {item.partnerName ? (
                  <p className="text-xs text-moss">{item.partnerName}</p>
                ) : null}
                <p className="mt-1 text-sm text-forest">
                  {formatVnd(item.price, locale)}
                </p>
                {item.voucherExpiresAt ? (
                  <p className="mt-1 text-xs text-moss">
                    {t.checkout.voucherUntil}{" "}
                    {item.voucherExpiresAt.toISOString().slice(0, 10)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-moss">
            Partner check:{" "}
            <Link href="/voucher" className="underline">
              /voucher
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-forest px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase"
          >
            {t.checkout.openWhatsapp}
          </a>
        ) : null}
        <Link
          href={`/${locale}/shop`}
          className="rounded-full border border-forest/25 px-8 py-3 text-[12px] tracking-[0.18em] uppercase"
        >
          {t.checkout.backShop}
        </Link>
      </div>
    </div>
  );
}
