import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { formatVnd } from "@/data/products";
import { getAdminT } from "@/lib/admin-locale";
import {
  buildPaymentsReport,
  summarizePaidRevenue,
} from "@/lib/payments/reporting";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; from?: string; to?: string }>;
}) {
  const { locale, t } = await getAdminT();
  const q = await searchParams;
  const cities = await prisma.city.findMany({ orderBy: { sortOrder: "asc" } });
  const from = q.from ? new Date(q.from) : null;
  const to = q.to ? new Date(q.to) : null;
  const rows = await buildPaymentsReport({
    citySlug: q.city || null,
    from: from && !Number.isNaN(from.getTime()) ? from : null,
    to: to && !Number.isNaN(to.getTime()) ? to : null,
  });
  const summary = summarizePaidRevenue(rows);

  const csvParams = new URLSearchParams();
  if (q.city) csvParams.set("city", q.city);
  if (q.from) csvParams.set("from", q.from);
  if (q.to) csvParams.set("to", q.to);

  return (
    <AdminShell title={t.orders.reports}>
      <form
        method="get"
        className="admin-card"
        style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <label className="admin-field">
          <span>City</span>
          <select name="city" defaultValue={q.city || ""}>
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>From</span>
          <input type="date" name="from" defaultValue={q.from || ""} />
        </label>
        <label className="admin-field">
          <span>To</span>
          <input type="date" name="to" defaultValue={q.to || ""} />
        </label>
        <button type="submit" className="admin-btn" style={{ alignSelf: "end" }}>
          Filter
        </button>
        <Link
          href={`/api/admin/reports/payments.csv?${csvParams.toString()}`}
          className="admin-btn secondary"
          style={{ alignSelf: "end" }}
        >
          Export CSV
        </Link>
      </form>

      <div className="admin-grid-2" style={{ marginBottom: 16 }}>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12 }}>Paid orders</p>
          <p style={{ fontFamily: "serif", fontSize: 36, margin: "8px 0" }}>
            {summary.orderCount}
          </p>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12 }}>
            Gross (paid only)
          </p>
          <p style={{ fontFamily: "serif", fontSize: 36, margin: "8px 0" }}>
            {formatVnd(summary.gross, locale)}
          </p>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12 }}>
            Customer delivery fees
          </p>
          <p style={{ fontFamily: "serif", fontSize: 28, margin: "8px 0" }}>
            {formatVnd(summary.deliveryFees, locale)}
          </p>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12 }}>
            Courier actual / margin
          </p>
          <p style={{ fontFamily: "serif", fontSize: 28, margin: "8px 0" }}>
            {formatVnd(summary.courierCosts, locale)} /{" "}
            {formatVnd(summary.deliveryMargin, locale)}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
        Pending / unpaid orders are listed but excluded from paid revenue
        totals. Receipts here are not Vietnamese e-invoices.
      </p>

      <div className="admin-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>City</th>
              <th>Pay</th>
              <th>Products</th>
              <th>Delivery fee</th>
              <th>Courier cost</th>
              <th>Margin</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, opacity: 0.7 }}>
                  No rows
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.reference}>
                  <td>
                    <strong>{r.reference}</strong>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {r.createdAt.slice(0, 10)} · {r.source}
                    </div>
                  </td>
                  <td>
                    {r.city || "—"}
                    <div style={{ fontSize: 11 }}>{r.branch}</div>
                  </td>
                  <td>
                    {r.paymentStatus}
                    <div style={{ fontSize: 11 }}>{r.paymentMethod}</div>
                  </td>
                  <td>{formatVnd(r.productsRevenue, locale)}</td>
                  <td>{formatVnd(r.deliveryFeeCustomer, locale)}</td>
                  <td>{formatVnd(r.courierActualCost, locale)}</td>
                  <td>{formatVnd(r.deliveryMargin, locale)}</td>
                  <td>{formatVnd(r.orderTotal, locale)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
