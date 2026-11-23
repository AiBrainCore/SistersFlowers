import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import {
  acknowledgeOrderAction,
  confirmShopPaymentAction,
  saveFulfillmentChecklistAction,
  setDeliveryQuoteAction,
  updateDeliveryBookingAction,
  updateShopOrderStatusAction,
} from "@/app/admin/payments/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import {
  CHECKLIST_FIELDS,
  CHECKLIST_LABELS,
  checklistComplete,
} from "@/lib/payments/checklist";
import {
  DELIVERY_BOOKING_STATUSES,
  SHOP_ORDER_STATUSES,
  deliveryBookingStatusLabel,
  shopOrderStatusLabel,
} from "@/lib/payments/order-status-labels";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { err, saved } = await searchParams;
  const { locale, t } = await getAdminT();
  const loc = locale === "en" ? "en" : "vi";

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { media: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 30 },
      payments: { orderBy: { createdAt: "desc" } },
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 3 },
      deliveryBooking: true,
      fulfillmentChecklist: true,
      branch: { include: { city: true } },
      media: true,
    },
  });
  if (!order) notFound();

  const checklist = order.fulfillmentChecklist;
  const complete = checklist ? checklistComplete(checklist) : false;
  const intent = order.paymentIntents[0];
  const hasSeparateReceiver = Boolean(
    order.recipientName || order.recipientPhone,
  );

  return (
    <AdminShell title={`${t.orders.ref} ${order.reference}`}>
      <p style={{ marginBottom: 16 }}>
        <Link href="/admin/orders">← {t.common.backToList}</Link>
      </p>
      {saved ? (
        <p style={{ color: "#5c6b52", marginBottom: 12 }}>{t.common.saved}</p>
      ) : null}
      {err === "checklist" ? (
        <p style={{ color: "#8b3a3a", marginBottom: 12 }}>
          {t.orders.checklistRequired}
        </p>
      ) : null}

      <div className="admin-grid-2" style={{ alignItems: "stretch" }}>
        <div className="admin-card admin-card-stack">
          <div>
            <h2 style={{ fontFamily: "serif", margin: "0 0 6px" }}>
              {t.orders.customer}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
              {t.orders.createdAt}:{" "}
              {order.createdAt.toLocaleString(
                loc === "vi" ? "vi-VN" : "en-GB",
              )}
            </p>
          </div>

          <div className="admin-party-grid">
            <section className="admin-party">
              <h3>{t.orders.buyer}</h3>
              <p>
                <strong>{order.customerName}</strong>
                <br />
                {order.phone}
                {order.email ? (
                  <>
                    <br />
                    {order.email}
                  </>
                ) : null}
                {order.anonymousSender ? (
                  <>
                    <br />
                    <span style={{ color: "#C24712" }}>
                      {t.orders.anonymousSender}
                    </span>
                  </>
                ) : null}
              </p>
            </section>
            <section className="admin-party">
              <h3>{t.orders.receiver}</h3>
              <p>
                {hasSeparateReceiver ? (
                  <>
                    <strong>{order.recipientName || "—"}</strong>
                    {order.recipientPhone ? (
                      <>
                        <br />
                        {order.recipientPhone}
                      </>
                    ) : null}
                  </>
                ) : (
                  <span style={{ opacity: 0.7 }}>{t.orders.sameAsBuyer}</span>
                )}
              </p>
            </section>
          </div>

          <div className="admin-meta-block">
            <strong>
              {order.fulfillment === "pickup"
                ? loc === "vi"
                  ? "Nhận tại studio"
                  : "Pickup"
                : loc === "vi"
                  ? "Giao tận nơi"
                  : "Delivery"}
            </strong>
            {order.zone ? `${order.zone}` : null}
            <div>{order.address}</div>
          </div>

          <div className="admin-meta-block">
            <strong>{t.orders.deliveryWhen}</strong>
            {order.deliveryDate || "—"}
            {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
          </div>

          {order.hotelName || order.roomNumber ? (
            <div className="admin-meta-block">
              <strong>{t.orders.hotelRoom}</strong>
              {[order.hotelName, order.roomNumber].filter(Boolean).join(" · ")}
            </div>
          ) : null}

          <div
            className="admin-meta-block"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: order.cardMessage
                ? "rgba(194, 71, 18, 0.08)"
                : "rgba(31, 42, 36, 0.04)",
              border: order.cardMessage
                ? "1px solid rgba(194, 71, 18, 0.25)"
                : "1px solid rgba(31, 42, 36, 0.08)",
            }}
          >
            <strong>{t.orders.cardMessage}</strong>
            {order.cardMessage ? (
              <em style={{ fontSize: 15 }}>“{order.cardMessage}”</em>
            ) : (
              <span style={{ opacity: 0.65 }}>{t.orders.noCard}</span>
            )}
          </div>

          {order.notes ? (
            <div className="admin-meta-block">
              <strong>{t.orders.notes}</strong>
              {order.notes}
            </div>
          ) : null}

          <p style={{ fontSize: 13, margin: 0, opacity: 0.75 }}>
            {order.branch
              ? `${order.branch.city.nameEn} — ${order.branch.nameEn}`
              : "—"}
            {order.trackingToken ? (
              <>
                {" · "}
                <Link
                  href={`/en/order/track/${order.trackingToken}`}
                  target="_blank"
                >
                  {t.orders.track}
                </Link>
                {intent?.method === "vietqr" ? (
                  <>
                    {" · "}
                    <Link
                      href={`/en/order/pay/${order.trackingToken}`}
                      target="_blank"
                    >
                      VietQR
                    </Link>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </div>

        <div className="admin-card admin-card-stack">
          <h2 style={{ fontFamily: "serif", margin: 0 }}>{t.orders.payment}</h2>
          <div className="admin-meta-block">
            <strong>{t.common.status}</strong>
            {order.paymentStatus}
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
          </div>
          <div className="admin-meta-block">
            <strong>{t.orders.total}</strong>
            Subtotal {formatVnd(order.subtotal, locale)}
            <br />
            Delivery {formatVnd(order.deliveryFee ?? 0, locale)}
            <br />
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {formatVnd(order.deliveryTotal, locale)}
            </span>
          </div>
          {intent ? (
            <p style={{ fontSize: 13, margin: 0, opacity: 0.75 }}>
              {intent.method} · {intent.status}
              {intent.reference ? ` · ${intent.reference}` : ""}
            </p>
          ) : null}
          {order.paymentStatus !== "paid" ? (
            <div className="admin-sticky-actions">
              <form action={confirmShopPaymentAction} className="admin-sticky-actions-form">
                <input type="hidden" name="orderId" value={order.id} />
                {intent ? (
                  <input type="hidden" name="intentId" value={intent.id} />
                ) : null}
                <button type="submit" className="admin-btn admin-btn-block">
                  {t.orders.confirmPaid}
                </button>
              </form>
            </div>
          ) : null}
          {!order.acknowledgedAt && order.paymentStatus === "paid" ? (
            <div className="admin-sticky-actions">
              <form action={acknowledgeOrderAction} className="admin-sticky-actions-form">
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="admin-btn secondary admin-btn-block">
                  {t.orders.acknowledge}
                </button>
              </form>
            </div>
          ) : null}

          {order.status === "awaiting_delivery_quote" ? (
            <form action={setDeliveryQuoteAction} className="admin-grid-2">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="admin-field">
                <span>{t.orders.quoteFee}</span>
                <input
                  name="deliveryFee"
                  type="number"
                  required
                  min={0}
                  step={1000}
                />
              </label>
              <div style={{ alignSelf: "end" }}>
                <button type="submit" className="admin-btn">
                  {t.orders.sendQuote}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "serif", marginTop: 0 }}>{t.orders.items}</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {order.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  width={72}
                  height={72}
                  style={{ objectFit: "cover", borderRadius: 12 }}
                />
              ) : null}
              <div>
                <strong>
                  {item.qty}× {item.name}
                </strong>
                {item.size ? (
                  <span style={{ opacity: 0.7 }}> · {item.size}</span>
                ) : null}
                <div style={{ fontSize: 13 }}>
                  {formatVnd(item.price, locale)}
                  {item.kind !== "product" ? ` · ${item.kind}` : ""}
                </div>
                {item.note ? (
                  <div style={{ fontSize: 13, fontStyle: "italic" }}>
                    “{item.note}”
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="admin-grid-2"
        style={{ marginTop: 16, alignItems: "stretch" }}
      >
        <form
          action={saveFulfillmentChecklistAction}
          className="admin-card admin-card-stack"
        >
          <h2 style={{ fontFamily: "serif", margin: 0 }}>{t.orders.checklist}</h2>
          <input type="hidden" name="orderId" value={order.id} />
          <div className="admin-check-list">
            {CHECKLIST_FIELDS.map((field) => (
              <label key={field} className="admin-check">
                <input
                  type="checkbox"
                  name={field}
                  defaultChecked={Boolean(checklist?.[field])}
                />
                <span>
                  {locale === "vi"
                    ? CHECKLIST_LABELS[field].vi
                    : CHECKLIST_LABELS[field].en}
                </span>
              </label>
            ))}
          </div>
          <label className="admin-field" style={{ marginBottom: 0 }}>
            <span>{t.orders.checklistOverride}</span>
            <input
              name="overrideNote"
              defaultValue={checklist?.overrideNote || ""}
              placeholder="Authorized override reason"
            />
          </label>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
            {complete
              ? t.orders.checklistComplete
              : t.orders.checklistIncomplete}
          </p>
          <div>
            <button type="submit" className="admin-btn">
              {t.common.save}
            </button>
          </div>
        </form>

        <div className="admin-card">
          <h2 style={{ fontFamily: "serif", marginTop: 0 }}>
            {t.orders.orderStatus}
          </h2>
          <form action={updateShopOrderStatusAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <div className="admin-choice-row" style={{ marginBottom: 12 }}>
              {SHOP_ORDER_STATUSES.map((status) => (
                <label
                  key={status}
                  className={`admin-choice${
                    order.status === status ? " on" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    defaultChecked={order.status === status}
                  />
                  {shopOrderStatusLabel(status, loc)}
                </label>
              ))}
            </div>
            <button type="submit" className="admin-btn secondary">
              {t.common.update}
            </button>
          </form>

          {order.fulfillment === "delivery" ? (
            <form
              action={updateDeliveryBookingAction}
              style={{ marginTop: 20 }}
            >
              <h3 style={{ fontSize: 16 }}>{t.orders.deliveryOps}</h3>
              <input type="hidden" name="orderId" value={order.id} />
              <input
                type="hidden"
                name="provider"
                value={order.deliveryBooking?.provider || "grab_manual"}
              />
              <p style={{ fontSize: 13, marginBottom: 8 }}>
                {t.orders.deliveryStatus}
              </p>
              <div className="admin-choice-row" style={{ marginBottom: 12 }}>
                {DELIVERY_BOOKING_STATUSES.map((status) => {
                  const current =
                    order.deliveryBooking?.status || "awaiting_arrangement";
                  return (
                    <label
                      key={status}
                      className={`admin-choice${
                        current === status ? " on" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        defaultChecked={current === status}
                      />
                      {deliveryBookingStatusLabel(status, loc)}
                    </label>
                  );
                })}
              </div>
              <label className="admin-field">
                <span>{t.orders.bookingRef}</span>
                <input
                  name="bookingRef"
                  defaultValue={order.deliveryBooking?.bookingRef || ""}
                />
              </label>
              <label className="admin-field">
                <span>{t.orders.courier}</span>
                <input
                  name="courierName"
                  defaultValue={order.deliveryBooking?.courierName || ""}
                />
              </label>
              <label className="admin-field">
                <span>{t.orders.courierPhone}</span>
                <input
                  name="courierPhone"
                  defaultValue={order.deliveryBooking?.courierPhone || ""}
                />
              </label>
              <label className="admin-field">
                <span>{t.orders.actualCost}</span>
                <input
                  name="actualCost"
                  defaultValue={order.deliveryBooking?.actualCost ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>{t.orders.notes}</span>
                <input
                  name="notes"
                  defaultValue={order.deliveryBooking?.notes || ""}
                />
              </label>
              <button type="submit" className="admin-btn secondary">
                {t.common.update}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "serif", marginTop: 0 }}>Timeline</h2>
        <ul
          style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}
        >
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              {h.createdAt.toLocaleString(loc === "vi" ? "vi-VN" : "en-GB")} ·{" "}
              {h.fromStatus
                ? shopOrderStatusLabel(h.fromStatus, loc)
                : "—"}{" "}
              →{" "}
              <strong>{shopOrderStatusLabel(h.toStatus, loc)}</strong>
              {h.note ? ` · ${h.note}` : ""} · {h.actor}
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
