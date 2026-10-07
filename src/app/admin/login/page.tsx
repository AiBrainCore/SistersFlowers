import { loginAction } from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminT } from "@/lib/admin-locale";
import { AdminLangSwitch } from "@/components/admin-lang-switch";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }
  const { error } = await searchParams;
  const { locale, t } = await getAdminT();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        action={loginAction}
        className="admin-card"
        style={{ width: "100%", maxWidth: 400 }}
      >
        <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 11 }}>
          Sisters Flowers
        </p>
        <h1 style={{ fontFamily: "serif", fontSize: 36, margin: "8px 0 20px" }}>
          {t.login.title}
        </h1>
        {error ? (
          <p style={{ color: "#8b3a3a", fontSize: 14, marginBottom: 12 }}>
            {t.login.wrong}
          </p>
        ) : null}
        <label className="admin-field">
          <span>{t.login.password}</span>
          <input type="password" name="password" required autoFocus />
        </label>
        <button type="submit" className="admin-btn">
          {t.login.enter}
        </button>
        <div style={{ marginTop: 8 }}>
          <AdminLangSwitch locale={locale} />
        </div>
      </form>
    </div>
  );
}
