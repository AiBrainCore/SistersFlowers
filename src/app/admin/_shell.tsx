import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminT } from "@/lib/admin-locale";
import { AdminNav } from "@/components/admin/admin-nav";

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

  const { locale, t } = await getAdminT();

  return (
    <div className="admin-shell">
      <AdminNav
        locale={locale}
        labels={{
          dashboard: t.nav.dashboard,
          products: t.nav.products,
          addons: t.nav.addons,
          vouchers: t.nav.vouchers,
          delivery: t.nav.delivery,
          payments: t.nav.payments,
          shopping: t.nav.shopping,
          reports: t.nav.reports,
          builder: t.nav.builder,
          orders: t.nav.orders,
          customers: t.nav.customers,
          inquiries: t.nav.inquiries,
          journal: t.nav.journal,
          viewShop: t.nav.viewShop,
          logout: t.nav.logout,
          menu: t.nav.menu,
          menuOpen: t.nav.menuOpen,
          menuClose: t.nav.menuClose,
        }}
      />
      <main className="admin-main">
        <h1 className="admin-page-title">{title}</h1>
        {children}
      </main>
    </div>
  );
}
