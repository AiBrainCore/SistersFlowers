import { AdminShell } from "@/app/admin/_shell";
import { updateInquiryStatusAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminInquiriesPage() {
  const { locale, t } = await getAdminT();
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title={t.inquiries.title}>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.inquiries.when}</th>
              <th>{t.inquiries.type}</th>
              <th>{t.inquiries.contact}</th>
              <th>{t.inquiries.message}</th>
              <th>{t.common.status}</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, opacity: 0.7 }}>
                  {t.inquiries.empty}
                </td>
              </tr>
            ) : (
              inquiries.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                    {row.createdAt.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")}
                  </td>
                  <td>{row.variant}</td>
                  <td>
                    <strong>{row.name}</strong>
                    <div style={{ fontSize: 12 }}>{row.email}</div>
                    <div style={{ fontSize: 12 }}>{row.phone}</div>
                    {row.hotel ? (
                      <div style={{ fontSize: 12 }}>
                        {t.inquiries.hotel}: {row.hotel}
                      </div>
                    ) : null}
                    {row.venue ? (
                      <div style={{ fontSize: 12 }}>
                        {t.inquiries.venue}: {row.venue}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ maxWidth: 280, fontSize: 13, lineHeight: 1.5 }}>
                    {row.message}
                  </td>
                  <td>
                    <form action={updateInquiryStatusAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <select name="status" defaultValue={row.status}>
                        <option value="new">new</option>
                        <option value="replied">replied</option>
                        <option value="closed">closed</option>
                      </select>
                      <button type="submit" className="admin-btn secondary" style={{ marginTop: 8 }}>
                        {t.common.update}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
