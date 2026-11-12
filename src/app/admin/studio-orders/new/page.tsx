import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { createStudioOrderAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function AdminNewStudioOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t } = await getAdminT();
  const raw = await searchParams;
  const error = raw.error === "1";

  const branches = await prisma.branch.findMany({
    where: { status: "open" },
    include: { city: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });

  return (
    <AdminShell title={t.studio.new}>
      <p style={{ maxWidth: 720, opacity: 0.8, marginTop: 0 }}>{t.studio.intro}</p>
      <p style={{ marginBottom: 16 }}>
        <Link href="/admin/studio-orders" className="admin-btn secondary">
          ← {t.studio.list}
        </Link>
      </p>
      {error ? (
        <p style={{ color: "#a34b2e", marginBottom: 12 }}>{t.studio.error}</p>
      ) : null}

      <form
        action={createStudioOrderAction}
        className="admin-card"
        style={{ maxWidth: 820, display: "grid", gap: 4 }}
      >
        <div className="admin-section">
          <h2>{t.studio.branch}</h2>
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
        </div>

        <div className="admin-section">
          <h2>{t.studio.customer}</h2>
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{t.studio.customer}</span>
              <input name="customerName" required placeholder="Nguyen…" />
            </label>
            <label className="admin-field">
              <span>{t.studio.phone}</span>
              <input name="phone" inputMode="tel" placeholder="09…" />
            </label>
          </div>
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
        </div>

        <div className="admin-section">
          <h2>{t.studio.fulfillment}</h2>
          <div className="admin-choice-row" style={{ marginBottom: 14 }}>
            <label className="admin-choice">
              <input type="radio" name="fulfillment" value="delivery" defaultChecked />
              {t.studio.delivery}
            </label>
            <label className="admin-choice">
              <input type="radio" name="fulfillment" value="pickup" />
              {t.studio.pickup}
            </label>
          </div>
          <label className="admin-field">
            <span>{t.studio.address}</span>
            <input name="address" placeholder="Street, district…" />
          </label>
          <div className="admin-grid-3">
            <label className="admin-field">
              <span>{t.studio.date}</span>
              <input type="date" name="deliveryDate" defaultValue={todayYmd()} />
            </label>
            <label className="admin-field">
              <span>{t.studio.time}</span>
              <input type="time" name="deliveryTime" />
            </label>
            <label className="admin-field">
              <span>{t.studio.fee}</span>
              <input
                type="number"
                name="deliveryFee"
                min={0}
                step={1000}
                defaultValue={0}
              />
            </label>
          </div>
        </div>

        <div className="admin-section">
          <h2>{t.studio.card}</h2>
          <label className="admin-field">
            <span>{t.studio.card}</span>
            <input name="cardMessage" placeholder="Happy birthday…" />
          </label>
          <label className="admin-field">
            <span>{t.studio.notes}</span>
            <textarea name="notes" rows={3} placeholder="Wrap colour, ribbon…" />
          </label>
        </div>

        <div className="admin-section">
          <h2>{t.studio.payment}</h2>
          <div className="admin-choice-row" style={{ marginBottom: 14 }}>
            <label className="admin-choice">
              <input type="radio" name="paymentStatus" value="unpaid" defaultChecked />
              {t.studio.unpaid}
            </label>
            <label className="admin-choice">
              <input type="radio" name="paymentStatus" value="deposit" />
              {t.studio.deposit}
            </label>
            <label className="admin-choice">
              <input type="radio" name="paymentStatus" value="paid" />
              {t.studio.paid}
            </label>
            <label className="admin-choice">
              <input type="radio" name="paymentStatus" value="cod" />
              {t.studio.cod}
            </label>
          </div>
          <label className="admin-field">
            <span>{t.studio.depositAmount}</span>
            <input
              type="number"
              name="depositAmount"
              min={0}
              step={1000}
              defaultValue={0}
            />
          </label>
        </div>

        <div className="admin-section">
          <h2>{t.studio.lines}</h2>
          <p style={{ margin: "0 0 12px", fontSize: 13, opacity: 0.7 }}>
            {t.studio.linesHint}
          </p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="admin-grid-3">
              <label className="admin-field">
                <span>
                  {t.orders.items} {i + 1}
                </span>
                <input
                  name="lineName"
                  placeholder={i === 0 ? "Rose mix" : ""}
                  required={i === 0}
                />
              </label>
              <label className="admin-field">
                <span>Qty</span>
                <input
                  type="number"
                  name="lineQty"
                  min={1}
                  defaultValue={i === 0 ? 1 : ""}
                  required={i === 0}
                />
              </label>
              <label className="admin-field">
                <span>{t.common.price}</span>
                <input
                  type="number"
                  name="linePrice"
                  min={0}
                  step={1000}
                  placeholder="750000"
                  required={i === 0}
                />
              </label>
            </div>
          ))}
          <label className="admin-field">
            <span>{t.studio.lines} (+)</span>
            <textarea
              name="lines"
              rows={3}
              placeholder={t.studio.linesHint}
              style={{ fontFamily: "ui-monospace, monospace" }}
            />
          </label>
        </div>

        <button type="submit" className="admin-btn" style={{ marginTop: 8 }}>
          {t.studio.create}
        </button>
      </form>
    </AdminShell>
  );
}
