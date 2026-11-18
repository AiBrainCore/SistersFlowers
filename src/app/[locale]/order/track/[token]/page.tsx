import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/data/products";

export const dynamic = "force-dynamic";

const CUSTOMER_STATUS_LABEL: Record<string, { en: string; vi: string }> = {
  new: { en: "Received", vi: "Đã nhận" },
  confirmed: { en: "Accepted by studio", vi: "Studio đã nhận" },
  preparing: { en: "Preparing", vi: "Đang chuẩn bị" },
  making: { en: "Preparing", vi: "Đang làm" },
  ready: { en: "Ready", vi: "Sẵn sàng" },
  ready_for_pickup: { en: "Ready for pickup", vi: "Sẵn sàng nhận" },
  ready_for_dispatch: { en: "Ready for delivery", vi: "Sẵn sàng giao" },
  out_for_delivery: { en: "Out for delivery", vi: "Đang giao" },
  dispatched: { en: "Out for delivery", vi: "Đang giao" },
  delivered: { en: "Delivered", vi: "Đã giao" },
  completed: { en: "Completed", vi: "Hoàn tất" },
  cancelled: { en: "Cancelled", vi: "Đã hủy" },
};

export default async function OrderTrackPage({
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
      items: true,
      deliveryBooking: true,
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const statusLabel =
    CUSTOMER_STATUS_LABEL[order.status]?.[locale] || order.status;
  const payLabel =
    order.paymentStatus === "paid"
      ? t.payments.paid
      : order.paymentStatus === "pending"
        ? t.payments.awaiting
        : order.paymentStatus;

  const showRecipient = !order.anonymousSender;

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">
        {order.reference}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest">{t.payments.trackTitle}</h1>

      <div className="mt-8 grid gap-4">
        <div className="rounded-2xl border border-forest/10 bg-white/80 px-4 py-3">
          <p className="text-[11px] tracking-[0.14em] text-moss uppercase">
            {t.payments.trackPay}
          </p>
          <p className="mt-1 text-sm font-medium text-forest">{payLabel}</p>
          <p className="mt-1 text-sm text-citrus">
            {formatVnd(order.deliveryTotal, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white/80 px-4 py-3">
          <p className="text-[11px] tracking-[0.14em] text-moss uppercase">
            {t.payments.trackFulfillment}
          </p>
          <p className="mt-1 text-sm font-medium text-forest">{statusLabel}</p>
          <p className="mt-1 text-xs text-moss">
            {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
            {order.deliveryDate ? ` · ${order.deliveryDate}` : ""}
            {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
          </p>
          {order.deliveryBooking ? (
            <p className="mt-1 text-xs text-moss">
              Courier: {order.deliveryBooking.status.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-8 grid gap-2 text-sm text-forest">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.qty}× {item.name}
          </li>
        ))}
      </ul>

      {showRecipient && order.recipientName ? (
        <p className="mt-6 text-sm text-moss">
          Recipient: {order.recipientName}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        {order.paymentStatus !== "paid" &&
        order.paymentIntents[0]?.method === "vietqr" ? (
          <Link
            href={`/${locale}/order/pay/${token}`}
            className="inline-flex min-h-11 items-center rounded-full bg-citrus px-5 text-sm text-white"
          >
            {t.payments.payTitle}
          </Link>
        ) : null}
        <Link
          href={`/${locale}/shop`}
          className="inline-flex min-h-11 items-center rounded-full border border-forest/15 px-5 text-sm text-forest"
        >
          {t.nav.shop}
        </Link>
      </div>
    </div>
  );
}
