import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { confirmShopPaymentAction } from "@/app/admin/payments/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import {
  deliveryBookingStatusLabel,
  shopOrderStatusLabel,
} from "@/lib/payments/order-status-labels";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; delivery?: string }>;
}) {
  const { locale, t } = await getAdminT();
  const loc = locale === "en" ? "en" : "vi";
  const { paid, delivery } = await searchParams;
  const orders = await prisma.order.findMany({
    where: { source: "shop" },
    include: {
      items: true,
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
      deliveryBooking: true,
      branch: { include: { city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title={t.orders.title}>
      {paid || delivery ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.common.saved}</p>
      ) : null}

      {orders.length === 0 ? (
        <div className="admin-card" style={{ padding: 24, opacity: 0.7 }}>
          {t.orders.empty}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map((order) => {
            const intent = order.paymentIntents[0];
            const city =
              loc === "vi"
                ? order.branch?.city.nameVi || order.branch?.city.nameEn
                : order.branch?.city.nameEn;
            const itemSummary = order.items
              .slice(0, 2)
              .map((item) => `${item.qty}× ${item.name}`)
              .join(" · ");
            const moreItems =
              order.items.length > 2
                ? ` +${order.items.length - 2}`
                : "";
            const when = [order.deliveryDate, order.deliveryTime]
              .filter(Boolean)
              .join(" · ");
            const receiver =
              order.recipientName || order.recipientPhone
                ? [order.recipientName, order.recipientPhone]
                    .filter(Boolean)
                    .join(" · ")
                : null;

            return (
              <article key={order.id} className="admin-card admin-order-row">
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 12px",
                      alignItems: "baseline",
                    }}
                  >
                    <Link
                      href={`/admin/orders/${order.id}`}
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      {order.reference}
                    </Link>
                    <span style={{ fontSize: 12, opacity: 0.55 }}>
                      {order.createdAt.toLocaleString(
                        loc === "vi" ? "vi-VN" : "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                    {city ? (
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{city}</span>
                    ) : null}
                  </div>

                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45 }}>
                    <strong>{order.customerName}</strong>
                    <span style={{ opacity: 0.7 }}> · {order.phone}</span>
                  </p>

                  {receiver ? (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        lineHeight: 1.4,
                        opacity: 0.85,
                      }}
                    >
                      → {receiver}
                    </p>
                  ) : null}

                  {when ? (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        opacity: 0.75,
                      }}
                    >
                      {when}
                    </p>
                  ) : null}

                  {order.cardMessage ? (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "#C24712",
                        lineHeight: 1.35,
                      }}
                    >
                      {t.orders.cardMessage}: “{order.cardMessage}”
                    </p>
                  ) : null}

                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 13,
                      opacity: 0.7,
                      lineHeight: 1.4,
                    }}
                  >
                    {itemSummary}
                    {moreItems}
                  </p>
                </div>

                <div className="admin-order-meta">
                  <p>
                    <span>{t.orders.payment}</span>
                    <strong>{order.paymentStatus}</strong>
                    {intent?.method ? (
                      <em> · {intent.method}</em>
                    ) : order.paymentMethod ? (
                      <em> · {order.paymentMethod}</em>
                    ) : null}
                  </p>
                  <p>
                    <span>{t.orders.orderStatus}</span>
                    <strong>{shopOrderStatusLabel(order.status, loc)}</strong>
                  </p>
                  {order.fulfillment === "delivery" && order.deliveryBooking ? (
                    <p>
                      <span>{t.orders.deliveryOps}</span>
                      <strong>
                        {deliveryBookingStatusLabel(
                          order.deliveryBooking.status,
                          loc,
                        )}
                      </strong>
                    </p>
                  ) : order.fulfillment === "pickup" ? (
                    <p>
                      <span>
                        {loc === "vi" ? "Nhận tại studio" : "Pickup"}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="admin-order-actions">
                  <strong className="admin-order-total">
                    {formatVnd(order.deliveryTotal, locale)}
                  </strong>
                  <div className="admin-order-action-btns">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="admin-btn secondary admin-btn-sm"
                    >
                      {t.orders.open}
                    </Link>
                    {order.paymentStatus !== "paid" ? (
                      <form action={confirmShopPaymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        {intent ? (
                          <input
                            type="hidden"
                            name="intentId"
                            value={intent.id}
                          />
                        ) : null}
                        <button type="submit" className="admin-btn admin-btn-sm">
                          {t.orders.confirmPaid}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </AdminShell>
  );
}
