"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createStudioOrderAction } from "@/app/admin/actions";
import type { AdminDictionary, AdminLocale } from "@/i18n/admin-dictionaries";

type BranchOption = {
  id: string;
  nameEn: string;
  nameVi: string;
  slug: string;
};

type Line = {
  key: string;
  name: string;
  qty: string;
  price: string;
  photos: File[];
  previews: string[];
};

function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function money(n: number, locale: AdminLocale) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(
    Math.max(0, Math.round(n)),
  );
}

function timeSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

const TIME_SLOTS = timeSlots();

function nearestSlot(d = new Date()) {
  const total = d.getHours() * 60 + d.getMinutes();
  const rounded = Math.ceil(total / 15) * 15;
  const h = Math.floor((rounded % (24 * 60)) / 60);
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function salePrefix(slug: string) {
  if (slug.includes("danang")) return "DN";
  if (slug.includes("dalat")) return "DL";
  return "SF";
}

export function StudioOrderForm({
  locale,
  t,
  branches,
  error,
}: {
  locale: AdminLocale;
  t: AdminDictionary;
  branches: BranchOption[];
  error?: boolean;
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [lines, setLines] = useState<Line[]>([
    { key: "l1", name: "", qty: "1", price: "", photos: [], previews: [] },
  ]);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [deliveryDate, setDeliveryDate] = useState(ymd(new Date()));
  const [deliveryTime, setDeliveryTime] = useState(nearestSlot());
  const [fee, setFee] = useState("0");
  const [deposit, setDeposit] = useState("0");

  const branch = branches.find((b) => b.id === branchId) || branches[0];
  const orderNoPreview = `${salePrefix(branch?.slug || "")}-${ymd(new Date()).replace(/-/g, "").slice(2)}-###`;

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const q = Math.max(0, Number(line.qty) || 0);
        const p = Math.max(0, Number(line.price) || 0);
        return sum + q * p;
      }, 0),
    [lines],
  );
  const feeNum =
    fulfillment === "delivery" ? Math.max(0, Number(fee) || 0) : 0;
  const total = subtotal + feeNum;
  const remain =
    paymentStatus === "paid"
      ? 0
      : paymentStatus === "deposit"
        ? Math.max(0, total - Math.max(0, Number(deposit) || 0))
        : total;

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: `l${Date.now()}-${prev.length}`,
        name: "",
        qty: "1",
        price: "",
        photos: [],
        previews: [],
      },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      const target = prev.find((l) => l.key === key);
      target?.previews.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((l) => l.key !== key);
    });
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  function addLinePhotos(key: string, files: FileList | null) {
    if (!files?.length) return;
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const photos = [...line.photos];
        const previews = [...line.previews];
        for (const file of Array.from(files)) {
          if (photos.length >= 4) break;
          if (!file.type.startsWith("image/")) continue;
          photos.push(file);
          previews.push(URL.createObjectURL(file));
        }
        return { ...line, photos, previews };
      }),
    );
  }

  function removeLinePhoto(key: string, index: number) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const photos = line.photos.filter((_, i) => i !== index);
        const previews = [...line.previews];
        const [removed] = previews.splice(index, 1);
        if (removed) URL.revokeObjectURL(removed);
        return { ...line, photos, previews };
      }),
    );
  }

  function setToday() {
    const now = new Date();
    setDeliveryDate(ymd(now));
    setDeliveryTime(nearestSlot(now));
  }

  function setTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDeliveryDate(ymd(d));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    lines.forEach((line, index) => {
      for (const file of line.photos) {
        fd.append(`linePhotos_${index}`, file);
      }
    });
    await createStudioOrderAction(fd);
  }

  return (
    <form onSubmit={onSubmit} className="studio-form">
      {error ? <p className="studio-form-error">{t.studio.error}</p> : null}

      <section className="admin-section">
        <h2>{t.studio.orderNo}</h2>
        <p className="studio-orderno">
          <strong>{orderNoPreview}</strong>
          <span>{t.studio.orderNoHint}</span>
        </p>
        <label className="admin-field">
          <span>{t.studio.branch}</span>
          <select
            name="branchId"
            required
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {locale === "vi" ? b.nameVi : b.nameEn}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="admin-section">
        <h2>1. {t.studio.lines}</h2>
        {lines.map((line, index) => (
          <div key={line.key} className="studio-line">
            <div className="studio-line-head">
              <strong>
                {t.studio.item} {index + 1}
              </strong>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => removeLine(line.key)}
                >
                  ×
                </button>
              ) : null}
            </div>
            <label className="admin-field">
              <span>{t.studio.lineName}</span>
              <input
                name="lineName"
                required={index === 0}
                value={line.name}
                onChange={(e) => updateLine(line.key, { name: e.target.value })}
                placeholder={t.studio.lineNamePlaceholder}
              />
            </label>
            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.studio.lineQty}</span>
                <input
                  name="lineQty"
                  type="number"
                  min={1}
                  required={index === 0}
                  value={line.qty}
                  onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>{t.studio.linePrice}</span>
                <input
                  name="linePrice"
                  type="number"
                  min={0}
                  step={1000}
                  required={index === 0}
                  value={line.price}
                  onChange={(e) =>
                    updateLine(line.key, { price: e.target.value })
                  }
                  placeholder="450000"
                />
              </label>
            </div>

            <div className="studio-photos">
              <p className="studio-photos-label">{t.studio.itemPhotos}</p>
              <p className="studio-photos-hint">{t.studio.itemPhotosHint}</p>
              <div className="studio-photo-grid">
                {line.previews.map((src, i) => (
                  <div key={src} className="studio-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    <button
                      type="button"
                      onClick={() => removeLinePhoto(line.key, i)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {line.photos.length < 4 ? (
                <label className="admin-btn secondary studio-photo-btn">
                  {t.studio.addPhotos}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(e) => {
                      addLinePhotos(line.key, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn secondary studio-add-line"
          onClick={addLine}
        >
          + {t.studio.addLine}
        </button>
      </section>

      <section className="admin-section">
        <h2>2. {t.studio.customer}</h2>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.studio.customer}</span>
            <input name="customerName" required />
          </label>
          <label className="admin-field">
            <span>{t.studio.phone}</span>
            <input name="phone" inputMode="tel" />
          </label>
        </div>
        <label className="admin-field">
          <span>{t.studio.card}</span>
          <textarea
            name="cardMessage"
            rows={2}
            placeholder={t.studio.cardPlaceholder}
          />
        </label>
        <label className="admin-field">
          <span>{t.studio.notes}</span>
          <textarea
            name="notes"
            rows={2}
            placeholder={t.studio.notesPlaceholder}
          />
        </label>
      </section>

      <section className="admin-section">
        <h2>3. {t.studio.receiver}</h2>
        <div className="admin-choice-row" style={{ marginBottom: 12 }}>
          <button type="button" className="admin-choice" onClick={setToday}>
            {t.studio.today}
          </button>
          <button type="button" className="admin-choice" onClick={setTomorrow}>
            {t.studio.tomorrow}
          </button>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.studio.date}</span>
            <input
              type="date"
              name="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>{t.studio.time}</span>
            <select
              name="deliveryTime"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
            >
              <option value="">{t.studio.timeAny}</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-choice-row" style={{ marginBottom: 14 }}>
          <label
            className={`admin-choice ${fulfillment === "delivery" ? "on" : ""}`}
          >
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === "delivery"}
              onChange={() => setFulfillment("delivery")}
            />
            {t.studio.delivery}
          </label>
          <label
            className={`admin-choice ${fulfillment === "pickup" ? "on" : ""}`}
          >
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillment === "pickup"}
              onChange={() => setFulfillment("pickup")}
            />
            {t.studio.pickup}
          </label>
        </div>
        {fulfillment === "delivery" ? (
          <>
            <label className="admin-field">
              <span>{t.studio.address}</span>
              <input
                name="address"
                required
                placeholder={t.studio.addressPlaceholder}
              />
            </label>
            <label className="admin-field">
              <span>{t.studio.fee}</span>
              <input
                type="number"
                name="deliveryFee"
                min={0}
                step={1000}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <input type="hidden" name="address" value="" />
            <input type="hidden" name="deliveryFee" value="0" />
            <p className="studio-photos-hint">{t.studio.pickupHint}</p>
          </>
        )}
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.studio.recipient}</span>
            <input name="recipientName" />
          </label>
          <label className="admin-field">
            <span>{t.studio.recipientPhone}</span>
            <input name="recipientPhone" inputMode="tel" />
          </label>
        </div>
      </section>

      <section className="admin-section">
        <h2>4. {t.studio.payment}</h2>
        <div className="admin-choice-row" style={{ marginBottom: 14 }}>
          {(
            [
              ["unpaid", t.studio.unpaid],
              ["deposit", t.studio.deposit],
              ["paid", t.studio.paid],
              ["cod", t.studio.cod],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`admin-choice ${paymentStatus === value ? "on" : ""}`}
            >
              <input
                type="radio"
                name="paymentStatus"
                value={value}
                checked={paymentStatus === value}
                onChange={() => setPaymentStatus(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {paymentStatus === "deposit" ? (
          <label className="admin-field">
            <span>{t.studio.depositAmount}</span>
            <input
              type="number"
              name="depositAmount"
              min={0}
              step={1000}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </label>
        ) : (
          <input type="hidden" name="depositAmount" value="0" />
        )}
      </section>

      <div className="studio-sticky">
        <div>
          <div className="studio-sticky-total">
            {t.orders.total} {money(total, locale)}đ
          </div>
          <div className="studio-sticky-remain">
            {t.studio.remain} {money(remain, locale)}đ
          </div>
        </div>
        <button type="submit" className="admin-btn">
          {t.studio.create}
        </button>
      </div>
    </form>
  );
}
