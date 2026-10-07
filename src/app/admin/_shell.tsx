import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/actions";

export async function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <p style={{ fontFamily: "serif", fontSize: 28, margin: "0 0 24px" }}>
          Sisters
        </p>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/addons">Extras & partners</Link>
        <Link href="/admin/vouchers">Vouchers</Link>
        <Link href="/admin/delivery">Delivery</Link>
        <Link href="/admin/orders">Orders</Link>
        <Link href="/admin/inquiries">Inquiries</Link>
        <Link href="/en/shop" style={{ marginTop: 24 }}>
          View shop
        </Link>
        <form action={logoutAction} style={{ marginTop: 28 }}>
          <button
            type="submit"
            className="admin-btn secondary"
            style={{ color: "#f6f1e8", borderColor: "rgba(246,241,232,0.3)" }}
          >
            Log out
          </button>
        </form>
      </aside>
      <main className="admin-main">
        <h1 style={{ fontFamily: "serif", fontSize: 36, marginTop: 0 }}>{title}</h1>
        {children}
      </main>
    </div>
  );
}
