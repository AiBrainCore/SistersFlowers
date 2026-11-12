"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createStudioOrderAction } from "@/app/admin/actions";
import type { AdminDictionary, AdminLocale } from "@/i18n/admin-dictionaries";

type BranchOption = {
  id: string;
  nameEn: string;
  nameVi: string;
};

type Line = { key: string; name: string; qty: string; price: string };

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
  const [lines, setLines] = useState<Line[]>([
    { key: "l1", name: "", qty: "1", price: "" },
  ]);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [deliveryDate, setDeliveryDate] = useState(ymd(new Date()));
  const [deliveryTime, setDeliveryTime] = useState("");
  const [fee, setFee] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
      { key: `l${Date.now()}-${prev.length}`, name: "", qty: "1", price: "" },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function setToday() {
    const now = new Date();
    setDeliveryDate(ymd(now));
    setDeliveryTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
  }

  function setTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDeliveryDate(ymd(d));
  }

  function onPhotos(files: FileList | null) {
    if (!files?.length) return;
    const next = [...photos];
    const nextPrev = [...previews];
    for (const file of Array.from(files)) {
      if (next.length >= 6) break;
      if (!file.type.startsWith("image/")) continue;
      next.push(file);
      nextPrev.push(URL.createObjectURL(file));
    }
    setPhotos(next);
    setPreviews(nextPrev);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return copy;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    fd.delete("photos");
    for (const file of photos) fd.append("photos", file);
    await createStudioOrderAction(fd);
  }

  return (
    <form onSubmit={onSubmit} className="studio-form">
      {error ? <p className="studio-form-error">{t.studio.error}</p> : null}

      <section className="admin-section">
        <h2>1. {t.studio.lines}</h2>
        {lines.map((line, index) => (
          <div key={line.key} className="studio-line">
            <div className="studio-line-head">
              <strong>
                {t.orders.items} {index + 1}
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
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key ? { ...l, name: e.target.value } : l,
                    ),
                  )
                }
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
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l) =>
                        l.key === line.key ? { ...l, qty: e.target.value } : l,
                      ),
                    )
                  }
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
                    setLines((prev) =>
                      prev.map((l) =>
                        l.key === line.key ? { ...l, price: e.target.value } : l,
                      ),
                    )
                  }
                  placeholder="450000"
                />
              </label>
            </div>
          </div>
        ))}
        <button type="button" className="admin-btn secondary studio-add-line" onClick={addLine}>
          + {t.studio.addLine}
        </button>

        <div className="studio-photos">
          <p className="studio-photos-label">{t.studio.photos}</p>
          <p className="studio-photos-hint">{t.studio.photosHint}</p>
          <div className="studio-photo-grid">
            {previews.map((src, i) => (
              <div key={src} className="studio-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <button type="button" onClick={() => removePhoto(i)} aria-label="Remove">
                  ×
                </button>
              </div>
            ))}
          </div>
          {photos.length < 6 ? (
            <label className="admin-btn secondary studio-photo-btn">
              {t.studio.addPhotos}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  onPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className="admin-section">
        <h2>2. {t.studio.customer}</h2>
        <label className="admin-field">
          <span>{t.studio.branch}</span>
          <select name="branchId" required defaultValue={branches[0]?.id || ""}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {locale === "vi" ? branch.nameVi : branch.nameEn}
              </option>
            ))}
          </select>
        </label>
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
          <textarea name="cardMessage" rows={2} placeholder={t.studio.cardPlaceholder} />
        </label>
        <label className="admin-field">
          <span>{t.studio.notes}</span>
          <textarea name="notes" rows={2} placeholder={t.studio.notesPlaceholder} />
        </label>
      </section>

      <section className="admin-section">
        <h2>3. {t.studio.fulfillment}</h2>
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
            <input
              type="time"
              name="deliveryTime"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
            />
          </label>
        </div>
        <div className="admin-choice-row" style={{ marginBottom: 14 }}>
          <label className={`admin-choice ${fulfillment === "delivery" ? "on" : ""}`}>
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === "delivery"}
              onChange={() => setFulfillment("delivery")}
            />
            {t.studio.delivery}
          </label>
          <label className={`admin-choice ${fulfillment === "pickup" ? "on" : ""}`}>
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
          <label className="admin-field">
            <span>{t.studio.address}</span>
            <input
              name="address"
              required
              placeholder={t.studio.addressPlaceholder}
            />
          </label>
        ) : (
          <input type="hidden" name="address" value="" />
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
        {fulfillment === "delivery" ? (
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
        ) : (
          <input type="hidden" name="deliveryFee" value="0" />
        )}
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
