"use client";

import { updateOrderDetailsAction } from "@/app/admin/actions";
import type { AdminDictionary, AdminLocale } from "@/i18n/admin-dictionaries";

type EditItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

type EditOrder = {
  id: string;
  source: string;
  reference: string;
  saleCode: string | null;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  zone: string;
  deliveryDate: string | null;
  deliveryTime: string | null;
  fulfillment: string;
  recipientName: string | null;
  recipientPhone: string | null;
  notes: string | null;
  cardMessage: string | null;
  hotelName: string | null;
  roomNumber: string | null;
  anonymousSender: boolean;
  paymentStatus: string;
  depositAmount: number;
  deliveryFee: number | null;
  items: EditItem[];
};

export function OrderEditForm({
  order,
  t,
  locale,
  error,
}: {
  order: EditOrder;
  t: AdminDictionary;
  locale: AdminLocale;
  error?: boolean;
}) {
  const isPickup = order.fulfillment === "pickup";

  return (
    <form action={updateOrderDetailsAction} className="studio-form">
      <input type="hidden" name="id" value={order.id} />
      {error ? (
        <p className="studio-form-error">{t.studio.error}</p>
      ) : null}

      <section className="admin-section">
        <h2>
          {order.source === "studio"
            ? order.saleCode || order.reference
            : order.reference}
          <span style={{ marginLeft: 8, fontSize: 13, opacity: 0.65 }}>
            {order.source === "studio"
              ? locale === "vi"
                ? "Studio"
                : "Studio"
              : locale === "vi"
                ? "Web"
                : "Web"}
          </span>
        </h2>
      </section>

      <section className="admin-section">
        <h2>{t.orders.buyer}</h2>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.studio.customer}</span>
            <input
              name="customerName"
              required
              defaultValue={order.customerName}
            />
          </label>
          <label className="admin-field">
            <span>{t.studio.phone}</span>
            <input
              name="phone"
              required
              inputMode="tel"
              defaultValue={order.phone === "—" ? "" : order.phone}
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            defaultValue={order.email || ""}
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            name="anonymousSender"
            defaultChecked={order.anonymousSender}
          />
          {t.orders.anonymousSender}
        </label>
      </section>

      <section className="admin-section">
        <h2>{t.orders.receiver}</h2>
        <div className="admin-choice-row" style={{ marginBottom: 14 }}>
          <label className="admin-choice">
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              defaultChecked={!isPickup}
            />
            {t.studio.delivery}
          </label>
          <label className="admin-choice">
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              defaultChecked={isPickup}
            />
            {t.studio.pickup}
          </label>
        </div>
        <div className="admin-grid-2 studio-datetime-row">
          <label className="admin-field">
            <span>{t.studio.date}</span>
            <input
              type="date"
              name="deliveryDate"
              defaultValue={order.deliveryDate || ""}
            />
          </label>
          <label className="admin-field">
            <span>{t.studio.time}</span>
            <input
              name="deliveryTime"
              defaultValue={order.deliveryTime || ""}
              placeholder="10:00"
            />
          </label>
        </div>
        <label className="admin-field">
          <span>{t.studio.address}</span>
          <input name="address" defaultValue={order.address || ""} />
        </label>
        <input type="hidden" name="zone" value={order.zone || ""} />
        <label className="admin-field">
          <span>{t.studio.fee}</span>
          <input
            type="number"
            name="deliveryFee"
            min={0}
            step={1000}
            defaultValue={order.deliveryFee ?? 0}
          />
        </label>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.studio.recipient}</span>
            <input
              name="recipientName"
              defaultValue={order.recipientName || ""}
            />
          </label>
          <label className="admin-field">
            <span>{t.studio.recipientPhone}</span>
            <input
              name="recipientPhone"
              inputMode="tel"
              defaultValue={order.recipientPhone || ""}
            />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{locale === "vi" ? "Khách sạn" : "Hotel"}</span>
            <input name="hotelName" defaultValue={order.hotelName || ""} />
          </label>
          <label className="admin-field">
            <span>{locale === "vi" ? "Phòng" : "Room"}</span>
            <input name="roomNumber" defaultValue={order.roomNumber || ""} />
          </label>
        </div>
        <label className="admin-field">
          <span>{t.studio.card}</span>
          <textarea
            name="cardMessage"
            rows={2}
            defaultValue={order.cardMessage || ""}
          />
        </label>
        <label className="admin-field">
          <span>{t.studio.notes}</span>
          <textarea name="notes" rows={2} defaultValue={order.notes || ""} />
        </label>
      </section>

      <section className="admin-section">
        <h2>{t.orders.items}</h2>
        {order.items.map((item) => (
          <div key={item.id} className="studio-line">
            <input type="hidden" name="itemId" value={item.id} />
            <label className="admin-field">
              <span>{t.studio.lineName}</span>
              <input name="itemName" required defaultValue={item.name} />
            </label>
            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.studio.lineQty}</span>
                <input
                  name="itemQty"
                  type="number"
                  min={1}
                  required
                  defaultValue={item.qty}
                />
              </label>
              <label className="admin-field">
                <span>{t.studio.linePrice}</span>
                <input
                  name="itemPrice"
                  type="number"
                  min={0}
                  step={1000}
                  required
                  defaultValue={item.price}
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <h2>{t.orders.payment}</h2>
        <label className="admin-field">
          <span>{t.common.status}</span>
          <select name="paymentStatus" defaultValue={order.paymentStatus}>
            <option value="unpaid">{t.studio.unpaid}</option>
            <option value="deposit">{t.studio.deposit}</option>
            <option value="paid">{t.studio.paid}</option>
            <option value="cod">{t.studio.cod}</option>
            <option value="pending">pending</option>
            <option value="refunded">refunded</option>
          </select>
        </label>
        <label className="admin-field">
          <span>{t.studio.depositAmount}</span>
          <input
            type="number"
            name="depositAmount"
            min={0}
            step={1000}
            defaultValue={order.depositAmount}
          />
        </label>
      </section>

      <div className="studio-sticky">
        <div>
          <div className="studio-sticky-total">{t.common.save}</div>
          <div className="studio-sticky-remain">
            {locale === "vi"
              ? "Lưu thay đổi đơn"
              : "Save order corrections"}
          </div>
        </div>
        <button type="submit" className="admin-btn">
          {t.common.save}
        </button>
      </div>
    </form>
  );
}
