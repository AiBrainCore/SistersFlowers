import { loginAction } from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
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
          Admin login
        </h1>
        {error ? (
          <p style={{ color: "#8b3a3a", fontSize: 14, marginBottom: 12 }}>
            Wrong password.
          </p>
        ) : null}
        <label className="admin-field">
          <span>Password</span>
          <input type="password" name="password" required autoFocus />
        </label>
        <button type="submit" className="admin-btn">
          Enter
        </button>
      </form>
    </div>
  );
}
