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

      <div className="admin-grid-2" style={{ alignItems: "start" }}>
        <div className="admin-card">
          <h2 style={{ fontFamily: "serif", marginTop: 0 }}>
            {t.orders.customer}
          </h2>
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
          </p>
          <p style={{ fontSize: 14 }}>
            {order.fulfillment} · {order.zone}
            <br />
            {order.address}
            {order.deliveryDate ? (
              <>
                <br />
                {order.deliveryDate}
                {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
              </>
            ) : null}
          </p>
          {order.recipientName ? (
            <p style={{ fontSize: 14 }}>
              Recipient: {order.recipientName}
              {order.recipientPhone ? ` · ${order.recipientPhone}` : ""}
              {order.anonymousSender ? " · anonymous sender" : ""}
            </p>
          ) : null}
          {order.cardMessage ? (
            <p style={{ fontStyle: "italic", fontSize: 14 }}>
              Card: “{order.cardMessage}”
            </p>
          ) : null}
          {order.notes ? (
            <p style={{ fontSize: 14, opacity: 0.8 }}>Notes: {order.notes}</p>
          ) : null}
          <p style={{ fontSize: 13 }}>
            Branch:{" "}
            {order.branch
              ? `${order.branch.city.nameEn} — ${order.branch.nameEn}`
              : "—"}
          </p>
          {order.trackingToken ? (
            <p style={{ fontSize: 13 }}>
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
            </p>
          ) : null}
        </div>

        <div className="admin-card">
          <h2 style={{ fontFamily: "serif", marginTop: 0 }}>
            {t.orders.payment}
          </h2>
          <p>
            Status: <strong>{order.paymentStatus}</strong>
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
          </p>
          <p>
            Subtotal {formatVnd(order.subtotal, locale)}
            <br />
            Delivery {formatVnd(order.deliveryFee ?? 0, locale)}
            <br />
            <strong>Total {formatVnd(order.deliveryTotal, locale)}</strong>
          </p>
          {intent ? (
            <p style={{ fontSize: 13 }}>
              Intent: {intent.method} · {intent.status} · {intent.reference}
            </p>
          ) : null}
          {order.paymentStatus !== "paid" ? (
            <form action={confirmShopPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              {intent ? (
                <input type="hidden" name="intentId" value={intent.id} />
              ) : null}
              <button type="submit" className="admin-btn">
                {t.orders.confirmPaid}
              </button>
            </form>
          ) : null}
          {!order.acknowledgedAt && order.paymentStatus === "paid" ? (
            <form action={acknowledgeOrderAction} style={{ marginTop: 8 }}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="admin-btn secondary">
                {t.orders.acknowledge}
              </button>
            </form>
          ) : null}

          {order.status === "awaiting_delivery_quote" ? (
            <form
              action={setDeliveryQuoteAction}
              style={{ marginTop: 16 }}
              className="admin-grid-2"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <label className="admin-field">
                <span>{t.orders.quoteFee}</span>
                <input name="deliveryFee" type="number" required min={0} step={1000} />
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

      <div className="admin-grid-2" style={{ marginTop: 16, alignItems: "start" }}>
        <form action={saveFulfillmentChecklistAction} className="admin-card">
          <h2 style={{ fontFamily: "serif", marginTop: 0 }}>
            {t.orders.checklist}
          </h2>
          <input type="hidden" name="orderId" value={order.id} />
          {CHECKLIST_FIELDS.map((field) => (
            <label
              key={field}
              className="admin-field"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
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
          <label className="admin-field">
            <span>{t.orders.checklistOverride}</span>
            <input
              name="overrideNote"
              defaultValue={checklist?.overrideNote || ""}
              placeholder="Authorized override reason"
            />
          </label>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            {complete
              ? t.orders.checklistComplete
              : t.orders.checklistIncomplete}
          </p>
          <button type="submit" className="admin-btn">
            {t.common.save}
          </button>
        </form>

        <div className="admin-card">
          <h2 style={{ fontFamily: "serif", marginTop: 0 }}>
            {t.common.status}
          </h2>
          <form action={updateShopOrderStatusAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <select name="status" defaultValue={order.status}>
              <option value="new">new</option>
              <option value="awaiting_delivery_quote">
                awaiting_delivery_quote
              </option>
              <option value="awaiting_payment">awaiting_payment</option>
              <option value="confirmed">confirmed</option>
              <option value="preparing">preparing</option>
              <option value="ready_for_pickup">ready_for_pickup</option>
              <option value="ready_for_dispatch">ready_for_dispatch</option>
              <option value="out_for_delivery">out_for_delivery</option>
              <option value="delivered">delivered</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
              <option value="exception">exception</option>
            </select>
            <button
              type="submit"
              className="admin-btn secondary"
              style={{ marginTop: 8, display: "block" }}
            >
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
              <label className="admin-field">
                <span>Status</span>
                <select
                  name="status"
                  defaultValue={
                    order.deliveryBooking?.status || "awaiting_arrangement"
                  }
                >
                  <option value="awaiting_arrangement">
                    awaiting_arrangement
                  </option>
                  <option value="courier_requested">courier_requested</option>
                  <option value="courier_assigned">courier_assigned</option>
                  <option value="collected">collected</option>
                  <option value="in_transit">in_transit</option>
                  <option value="delivered">delivered</option>
                  <option value="failed">failed</option>
                  <option value="returned">returned</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Booking ref</span>
                <input
                  name="bookingRef"
                  defaultValue={order.deliveryBooking?.bookingRef || ""}
                />
              </label>
              <label className="admin-field">
                <span>Courier</span>
                <input
                  name="courierName"
                  defaultValue={order.deliveryBooking?.courierName || ""}
                />
              </label>
              <label className="admin-field">
                <span>Courier phone</span>
                <input
                  name="courierPhone"
                  defaultValue={order.deliveryBooking?.courierPhone || ""}
                />
              </label>
              <label className="admin-field">
                <span>Actual courier cost (VND)</span>
                <input
                  name="actualCost"
                  defaultValue={order.deliveryBooking?.actualCost ?? ""}
                />
              </label>
              <label className="admin-field">
                <span>Notes</span>
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
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              {h.createdAt.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")}{" "}
              · {h.fromStatus || "—"} → <strong>{h.toStatus}</strong>
              {h.note ? ` · ${h.note}` : ""} · {h.actor}
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
