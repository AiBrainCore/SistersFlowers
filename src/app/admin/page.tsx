import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminDashboardPage() {
  const { t } = await getAdminT();
  const [products, orders, inquiries, vouchersOpen] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.inquiry.count(),
    prisma.orderItem.count({
      where: { voucherCode: { not: null }, voucherStatus: "issued" },
    }),
  ]);

  return (
    <AdminShell title={t.dashboard.title}>
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
      </div>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 520, lineHeight: 1.7 }}>
        {t.dashboard.hint}
      </p>
    </AdminShell>
  );
}
