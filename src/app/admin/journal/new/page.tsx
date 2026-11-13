import { AdminShell } from "@/app/admin/_shell";
import { JournalForm } from "@/app/admin/journal/journal-form";
import { getAdminT } from "@/lib/admin-locale";

export default async function NewJournalPostPage() {
  const { t } = await getAdminT();
  return (
    <AdminShell title={t.journal.newTitle}>
      <JournalForm t={t} />
    </AdminShell>
  );
}
