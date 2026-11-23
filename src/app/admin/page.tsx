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

      <div className="admin-dash-grid">
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.dashboard.products}</p>
          <p className="admin-dash-value">{products}</p>
          <Link href="/admin/products" className="admin-btn secondary admin-btn-sm">
            {t.common.manage}
          </Link>
        </div>
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.dashboard.orders}</p>
          <p className="admin-dash-value">{orders}</p>
          <Link href="/admin/orders" className="admin-btn secondary admin-btn-sm">
            {t.common.view}
          </Link>
        </div>
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.dashboard.customers}</p>
          <p className="admin-dash-value">{customers}</p>
          <Link href="/admin/customers" className="admin-btn secondary admin-btn-sm">
            {t.common.manage}
          </Link>
        </div>
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.dashboard.openVouchers}</p>
          <p className="admin-dash-value">{vouchersOpen}</p>
          <Link href="/admin/vouchers" className="admin-btn secondary admin-btn-sm">
            {t.nav.vouchers}
          </Link>
        </div>
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.dashboard.inquiries}</p>
          <p className="admin-dash-value">{inquiries}</p>
          <Link href="/admin/inquiries" className="admin-btn secondary admin-btn-sm">
            {t.common.view}
          </Link>
        </div>
        <div className="admin-card admin-dash-tile">
          <p className="admin-dash-label">{t.orders.reports}</p>
          <p className="admin-dash-value admin-dash-value-sm">CSV</p>
          <Link href="/admin/reports" className="admin-btn secondary admin-btn-sm">
            {t.common.view}
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
