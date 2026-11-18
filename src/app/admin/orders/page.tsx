import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { updateOrderStatusAction } from "@/app/admin/actions";
import {
  confirmShopPaymentAction,
  updateDeliveryBookingAction,
} from "@/app/admin/payments/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; delivery?: string }>;
}) {
  const { locale, t } = await getAdminT();
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
      {paid ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.common.saved}</p>
      ) : null}
      {delivery ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.common.saved}</p>
      ) : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.orders.ref}</th>
              <th>{t.orders.customer}</th>
              <th>{t.orders.items}</th>
              <th>{t.orders.total}</th>
              <th>{t.orders.payment}</th>
              <th>{t.common.status}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, opacity: 0.7 }}>
                  {t.orders.empty}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const intent = order.paymentIntents[0];
                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.reference}</strong>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {order.createdAt.toLocaleString(
                          locale === "vi" ? "vi-VN" : "en-GB",
                        )}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>
                        {order.fulfillment}
                        {order.branch
                          ? ` · ${order.branch.city.nameEn}`
                          : ""}
                        {order.paymentMethod
                          ? ` · ${order.paymentMethod}`
                          : ""}
                      </div>
                      {order.trackingToken ? (
                        <div style={{ marginTop: 4 }}>
                          <Link
                            href={`/en/order/track/${order.trackingToken}`}
                            target="_blank"
                          >
                            {t.orders.track}
                          </Link>
                        </div>
                      ) : null}
                      {order.whatsappUrl ? (
                        <a
                          href={order.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </td>
                    <td>
                      {order.customerName}
                      <div style={{ fontSize: 12 }}>{order.phone}</div>
                      {order.email ? (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {order.email}
                        </div>
                      ) : null}
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {order.address}
                      </div>
                      {order.recipientName ? (
                        <div style={{ fontSize: 12 }}>
                          → {order.recipientName}
                          {order.recipientPhone
                            ? ` · ${order.recipientPhone}`
                            : ""}
                          {order.anonymousSender ? " · anon" : ""}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{ fontSize: 13, marginBottom: 6 }}
                        >
                          {item.qty}× {item.name}
                          {item.kind !== "product" ? (
                            <span style={{ opacity: 0.6 }}> · {item.kind}</span>
                          ) : null}
                          {item.note ? (
                            <div
                              style={{
                                fontSize: 11,
                                fontStyle: "italic",
                                opacity: 0.7,
                              }}
                            >
                              “{item.note}”
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </td>
                    <td>{formatVnd(order.deliveryTotal, locale)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        <strong>{order.paymentStatus}</strong>
                      </div>
                      {intent ? (
                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                          {intent.method} · {intent.status}
                          {intent.reference ? ` · ${intent.reference}` : ""}
                        </div>
                      ) : null}
                      {order.paymentStatus !== "paid" ? (
                        <form
                          action={confirmShopPaymentAction}
                          style={{ marginTop: 8 }}
                        >
                          <input type="hidden" name="orderId" value={order.id} />
                          {intent ? (
                            <input
                              type="hidden"
                              name="intentId"
                              value={intent.id}
                            />
                          ) : null}
                          <button type="submit" className="admin-btn">
                            {t.orders.confirmPaid}
                          </button>
                        </form>
                      ) : null}
                      {order.fulfillment === "delivery" ? (
                        <form
                          action={updateDeliveryBookingAction}
                          style={{ marginTop: 12 }}
                        >
                          <input type="hidden" name="orderId" value={order.id} />
                          <div
                            style={{
                              fontSize: 11,
                              marginBottom: 4,
                              opacity: 0.7,
                            }}
                          >
                            {t.orders.deliveryOps}
                          </div>
                          <select
                            name="status"
                            defaultValue={
                              order.deliveryBooking?.status ||
                              "awaiting_arrangement"
                            }
                          >
                            <option value="awaiting_arrangement">
                              awaiting_arrangement
                            </option>
                            <option value="courier_requested">
                              courier_requested
                            </option>
                            <option value="courier_assigned">
                              courier_assigned
                            </option>
                            <option value="collected">collected</option>
                            <option value="in_transit">in_transit</option>
                            <option value="delivered">delivered</option>
                            <option value="failed">failed</option>
                            <option value="returned">returned</option>
                          </select>
                          <input
                            type="hidden"
                            name="provider"
                            value={
                              order.deliveryBooking?.provider || "grab_manual"
                            }
                          />
                          <input
                            name="bookingRef"
                            placeholder="Booking ref"
                            defaultValue={
                              order.deliveryBooking?.bookingRef || ""
                            }
                            style={{ display: "block", marginTop: 4, width: "100%" }}
                          />
                          <input
                            name="actualCost"
                            placeholder="Actual Grab cost VND"
                            defaultValue={
                              order.deliveryBooking?.actualCost ?? ""
                            }
                            style={{ display: "block", marginTop: 4, width: "100%" }}
                          />
                          <button
                            type="submit"
                            className="admin-btn secondary"
                            style={{ marginTop: 6 }}
                          >
                            {t.common.update}
                          </button>
                        </form>
                      ) : null}
                    </td>
                    <td>
                      <form action={updateOrderStatusAction}>
                        <input type="hidden" name="id" value={order.id} />
                        <select name="status" defaultValue={order.status}>
                          <option value="new">new</option>
                          <option value="confirmed">confirmed</option>
                          <option value="preparing">preparing</option>
                          <option value="ready_for_pickup">
                            ready_for_pickup
                          </option>
                          <option value="ready_for_dispatch">
                            ready_for_dispatch
                          </option>
                          <option value="out_for_delivery">
                            out_for_delivery
                          </option>
                          <option value="delivered">delivered</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <button
                          type="submit"
                          className="admin-btn secondary"
                          style={{ marginTop: 8 }}
                        >
                          {t.common.update}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
