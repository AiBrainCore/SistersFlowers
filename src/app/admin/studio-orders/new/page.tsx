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
      <p style={{ maxWidth: 640, opacity: 0.8, marginTop: 0 }}>{t.studio.intro}</p>
      <p style={{ marginBottom: 16 }}>
        <Link href="/admin/studio-orders">{t.studio.list}</Link>
      </p>
      {error ? (
        <p style={{ color: "#a34b2e" }}>{t.studio.error}</p>
      ) : null}

      <form
        action={createStudioOrderAction}
        className="admin-card"
        style={{ display: "grid", gap: 14, maxWidth: 720 }}
      >
        <label>
          {t.studio.branch}
          <select name="branchId" required defaultValue={branches[0]?.id || ""}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {locale === "vi" ? branch.nameVi : branch.nameEn} (
                {branch.city.slug})
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            {t.studio.customer}
            <input name="customerName" required />
          </label>
          <label>
            {t.studio.phone}
            <input name="phone" />
          </label>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            {t.studio.recipient}
            <input name="recipientName" />
          </label>
          <label>
            {t.studio.recipientPhone}
            <input name="recipientPhone" />
          </label>
        </div>

        <fieldset style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 12 }}>
          <legend>{t.studio.fulfillment}</legend>
          <label style={{ marginRight: 16 }}>
            <input type="radio" name="fulfillment" value="delivery" defaultChecked />{" "}
            {t.studio.delivery}
          </label>
          <label>
            <input type="radio" name="fulfillment" value="pickup" /> {t.studio.pickup}
          </label>
        </fieldset>

        <label>
          {t.studio.address}
          <input name="address" />
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label>
            {t.studio.date}
            <input type="date" name="deliveryDate" defaultValue={todayYmd()} />
          </label>
          <label>
            {t.studio.time}
            <input type="time" name="deliveryTime" />
          </label>
          <label>
            {t.studio.fee}
            <input type="number" name="deliveryFee" min={0} step={1000} defaultValue={0} />
          </label>
        </div>

        <label>
          {t.studio.card}
          <input name="cardMessage" />
        </label>

        <label>
          {t.studio.notes}
          <textarea name="notes" rows={3} />
        </label>

        <fieldset style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 12 }}>
          <legend>{t.studio.payment}</legend>
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              <input type="radio" name="paymentStatus" value="unpaid" defaultChecked />{" "}
              {t.studio.unpaid}
            </label>
            <label>
              <input type="radio" name="paymentStatus" value="deposit" /> {t.studio.deposit}
            </label>
            <label>
              <input type="radio" name="paymentStatus" value="paid" /> {t.studio.paid}
            </label>
            <label>
              <input type="radio" name="paymentStatus" value="cod" /> {t.studio.cod}
            </label>
          </div>
          <label style={{ display: "block", marginTop: 10 }}>
            {t.studio.depositAmount}
            <input type="number" name="depositAmount" min={0} step={1000} defaultValue={0} />
          </label>
        </fieldset>

        <label>
          {t.studio.lines}
          <textarea
            name="lines"
            rows={5}
            required
            placeholder={t.studio.linesHint}
            style={{ fontFamily: "ui-monospace, monospace" }}
          />
        </label>

        <button type="submit" className="admin-btn">
          {t.studio.create}
        </button>
      </form>
    </AdminShell>
  );
}
