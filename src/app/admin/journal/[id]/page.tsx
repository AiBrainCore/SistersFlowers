import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { JournalForm } from "@/app/admin/journal/journal-form";
import { getAdminT } from "@/lib/admin-locale";
import { getJournalPostById } from "@/lib/journal";

export default async function EditJournalPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, { t }] = await Promise.all([
    getJournalPostById(id),
    getAdminT(),
  ]);
  if (!post) notFound();

  return (
    <AdminShell title={t.journal.editTitle}>
      <JournalForm post={post} t={t} />
    </AdminShell>
  );
}
