import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [products, orders, inquiries, vouchersOpen] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.inquiry.count(),
    prisma.orderItem.count({
      where: { voucherCode: { not: null }, voucherStatus: "issued" },
    }),
  ]);

  return (
    <AdminShell title="Dashboard">
      <div className="admin-grid-2" style={{ marginBottom: 24 }}>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Products
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{products}</p>
          <Link href="/admin/products" className="admin-btn secondary">
            Manage
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Orders
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{orders}</p>
          <Link href="/admin/orders" className="admin-btn secondary">
            View
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Open vouchers
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{vouchersOpen}</p>
          <Link href="/admin/vouchers" className="admin-btn secondary">
            Vouchers
          </Link>
        </div>
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.65, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Inquiries
          </p>
          <p style={{ fontFamily: "serif", fontSize: 42, margin: "8px 0" }}>{inquiries}</p>
          <Link href="/admin/inquiries" className="admin-btn secondary">
            View
          </Link>
        </div>
      </div>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 520, lineHeight: 1.7 }}>
        Partner money vouchers: guest shows code → partner checks{" "}
        <a href="/voucher">/voucher</a> → Mark as used → you remit face − commission.
      </p>
    </AdminShell>
  );
}
