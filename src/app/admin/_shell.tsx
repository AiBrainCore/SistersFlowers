import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/actions";
import { getAdminT } from "@/lib/admin-locale";
import { AdminLangSwitch } from "@/components/admin-lang-switch";

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
      <aside className="admin-nav">
        <p style={{ fontFamily: "serif", fontSize: 28, margin: "0 0 24px" }}>
          Sisters
        </p>
        <Link href="/admin">{t.nav.dashboard}</Link>
        <Link href="/admin/products">{t.nav.products}</Link>
        <Link href="/admin/addons">{t.nav.addons}</Link>
        <Link href="/admin/vouchers">{t.nav.vouchers}</Link>
        <Link href="/admin/delivery">{t.nav.delivery}</Link>
        <Link href="/admin/orders">{t.nav.orders}</Link>
        <Link href="/admin/inquiries">{t.nav.inquiries}</Link>
        <Link href={`/${locale}/shop`} style={{ marginTop: 24 }}>
          {t.nav.viewShop}
        </Link>

        <AdminLangSwitch locale={locale} />

        <form action={logoutAction} style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="admin-btn secondary"
            style={{ color: "#f6f1e8", borderColor: "rgba(246,241,232,0.3)" }}
          >
            {t.nav.logout}
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
