import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { deleteJournalPostAction } from "@/app/admin/actions";
import { getAdminT } from "@/lib/admin-locale";
import { listAllJournalPosts } from "@/lib/journal";

export default async function AdminJournalPage() {
  const [posts, { locale, t }] = await Promise.all([
    listAllJournalPosts(),
    getAdminT(),
  ]);

  const kindLabel = (kind: string) => {
    if (kind === "story") return t.journal.kindStory;
    if (kind === "news") return t.journal.kindNews;
    if (kind === "partnership") return t.journal.kindPartnership;
    return t.journal.kindTip;
  };

  return (
    <AdminShell title={t.journal.title}>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 640, marginTop: 0 }}>
        {t.journal.intro}
      </p>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/journal/new" className="admin-btn">
          {t.journal.add}
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="admin-card">{t.journal.empty}</div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.common.name}</th>
                <th>{t.common.type}</th>
                <th>{t.common.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong>
                      {locale === "vi" ? post.titleVi : post.titleEn}
                    </strong>
                    <div style={{ opacity: 0.55, fontSize: 12 }}>{post.slug}</div>
                  </td>
                  <td>{kindLabel(post.kind)}</td>
                  <td>
                    {post.published ? t.common.published : t.common.hidden}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        href={`/admin/journal/${post.id}`}
                        className="admin-btn secondary"
                      >
                        {t.common.edit}
                      </Link>
                      <form action={deleteJournalPostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button type="submit" className="admin-btn secondary">
                          {t.common.delete}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
