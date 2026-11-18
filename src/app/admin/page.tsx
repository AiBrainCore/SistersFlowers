import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import { listOpsAlerts } from "@/lib/payments/alerts";

export default async function AdminDashboardPage() {
  const { locale, t } = await getAdminT();
  const [products, orders, customers, inquiries, vouchersOpen, alerts] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.inquiry.count(),
      prisma.orderItem.count({
        where: { voucherCode: { not: null }, voucherStatus: "issued" },
      }),
      listOpsAlerts(12),
    ]);

  return (
    <AdminShell title={t.dashboard.title}>
      {alerts.length > 0 ? (
        <div
          className="admin-card"
          style={{
            marginBottom: 24,
            borderColor: "#c24712",
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          <h2 style={{ fontFamily: "serif", marginTop: 0, fontSize: 22 }}>
            {t.orders.alerts}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {alerts.map((a) => (
              <li key={a.id}>
                <strong style={{ color: a.severity === "high" ? "#c24712" : undefined }}>
                  {locale === "vi" ? a.messageVi : a.messageEn}
                </strong>{" "}
                {a.orderId ? (
                  <Link href={`/admin/orders/${a.orderId}`}>{a.reference}</Link>
                ) : (
                  <span>{a.reference}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-grid-2" style={{ marginBottom: 24 }}>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.dashboard.products}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{products}</p>
          <Link href="/admin/products" className="admin-btn secondary">
            {t.common.manage}
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.dashboard.orders}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{orders}</p>
          <Link href="/admin/orders" className="admin-btn secondary">
            {t.common.view}
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.dashboard.customers}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{customers}</p>
          <Link href="/admin/customers" className="admin-btn secondary">
            {t.common.manage}
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.dashboard.openVouchers}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{vouchersOpen}</p>
          <Link href="/admin/vouchers" className="admin-btn secondary">
            {t.nav.vouchers}
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.dashboard.inquiries}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{inquiries}</p>
          <Link href="/admin/inquiries" className="admin-btn secondary">
            {t.common.view}
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {t.orders.reports}
          </p>
          <p style={{ fontFamily: "serif", fontSize: 22, margin: "8px 0" }}>
            CSV · margins
          </p>
          <Link href="/admin/reports" className="admin-btn secondary">
            {t.common.view}
          </Link>
        </div>
      </div>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 520, lineHeight: 1.7 }}>
        {t.dashboard.hint}
      </p>
    </AdminShell>
  );
}
