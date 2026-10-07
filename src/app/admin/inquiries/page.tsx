import { AdminShell } from "@/app/admin/_shell";
import { updateInquiryStatusAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Inquiries">
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, opacity: 0.7 }}>
                  No inquiries yet.
                </td>
              </tr>
            ) : (
              inquiries.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td>{row.variant}</td>
                  <td>
                    <strong>{row.name}</strong>
                    <div style={{ fontSize: 12 }}>{row.email}</div>
                    <div style={{ fontSize: 12 }}>{row.phone}</div>
                    {row.hotel ? <div style={{ fontSize: 12 }}>Hotel: {row.hotel}</div> : null}
                    {row.venue ? <div style={{ fontSize: 12 }}>Venue: {row.venue}</div> : null}
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
                        Update
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
