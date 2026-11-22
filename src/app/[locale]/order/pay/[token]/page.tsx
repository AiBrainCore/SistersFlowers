import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/data/products";
import { PaymentCopyButton } from "@/components/payment-copy-button";

export const dynamic = "force-dynamic";

export default async function OrderPayPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: rawLocale, token } = await params;
  if (!isLocale(rawLocale) || !token) notFound();
  const locale = rawLocale;
  const { dictionary: t } = await getStorefrontDictionary(locale);

  const order = await prisma.order.findFirst({
    where: { trackingToken: token },
    include: {
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
      items: true,
    },
  });
  if (!order) notFound();

  const intent = order.paymentIntents[0] || null;
  const paid =
    order.paymentStatus === "paid" || intent?.status === "paid";
  const snapshot = intent?.accountSnapshot
    ? (JSON.parse(intent.accountSnapshot) as {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
      })
    : null;

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {order.reference}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest">{t.payments.payTitle}</h1>
      <p className="mt-3 text-sm text-moss">
        {paid ? t.payments.paid : t.payments.awaiting}
      </p>

      <div className="mt-8 rounded-3xl border border-forest/10 bg-white/80 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-moss">{t.payments.amount}</span>
          <span className="serif text-2xl text-citrus">
            {formatVnd(intent?.amount ?? order.deliveryTotal, locale)}
          </span>
        </div>

        {intent?.qrImageUrl && !paid ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={intent.qrImageUrl}
              alt="VietQR"
              width={280}
              height={280}
              className="rounded-2xl border border-forest/10 bg-white"
            />
            <a
              href={intent.qrImageUrl}
              download={`sf-${order.reference}-qr.png`}
              className="text-sm text-citrus underline-offset-2 hover:underline"
            >
              {t.payments.saveQr}
            </a>
          </div>
        ) : null}

        {snapshot && !paid ? (
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-moss">{t.payments.bank}</dt>
              <dd className="text-right font-medium text-forest">
                {snapshot.bankName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-moss">{t.payments.accountName}</dt>
              <dd className="text-right font-medium text-forest">
                {snapshot.accountName}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-moss">{t.payments.accountNumber}</dt>
              <dd className="flex items-center gap-2 font-mono text-forest">
                {snapshot.accountNumber}
                <PaymentCopyButton
                  value={snapshot.accountNumber || ""}
                  label={t.payments.copy}
                  copiedLabel={t.payments.copied}
                />
              </dd>
            </div>
            {intent?.reference ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-moss">{t.payments.transferRef}</dt>
                <dd className="flex items-center gap-2 font-mono text-forest">
                  {intent.reference}
                  <PaymentCopyButton
                    value={intent.reference}
                    label={t.payments.copy}
                    copiedLabel={t.payments.copied}
                  />
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {!paid ? (
          <p className="mt-6 text-xs leading-6 text-moss">
            {t.payments.instructions}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/order/track/${token}`}
          className="inline-flex min-h-11 items-center rounded-full bg-citrus px-5 text-sm text-white"
        >
          {t.payments.trackTitle}
        </Link>
        <Link
          href={`/${locale}/shop`}
          className="inline-flex min-h-11 items-center rounded-full border border-forest/15 px-5 text-sm text-forest"
        >
          {t.nav.shop}
        </Link>
      </div>

      <ul className="mt-10 grid gap-2 text-sm text-moss">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.qty}× {item.name}
            </span>
            <span>{formatVnd(item.price * item.qty, locale)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex justify-center opacity-70">
        <Image
          src="/brand/mark-citrus.png"
          alt="Sisters Flowers"
          width={48}
          height={48}
        />
      </div>
    </div>
  );
}
