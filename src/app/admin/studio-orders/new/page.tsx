import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { StudioOrderForm } from "@/components/admin/studio-order-form";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminNewStudioOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t } = await getAdminT();
  const raw = await searchParams;
  const error = raw.error === "1";

  const branches = await prisma.branch.findMany({
    where: { status: "open" },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });

  return (
    <AdminShell title={t.studio.new}>
      <p style={{ maxWidth: 720, opacity: 0.8, marginTop: 0 }}>{t.studio.intro}</p>
      <p style={{ marginBottom: 16 }}>
        <Link href="/admin/studio-orders" className="admin-btn secondary">
          ← {t.studio.list}
        </Link>
      </p>
      <StudioOrderForm
        locale={locale}
        t={t}
        error={error}
        branches={branches.map((b) => ({
          id: b.id,
          nameEn: b.nameEn,
          nameVi: b.nameVi,
        }))}
      />
    </AdminShell>
  );
}
