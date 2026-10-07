import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminT } from "@/lib/admin-locale";

export default async function NewProductPage() {
  const { t } = await getAdminT();
  return (
    <AdminShell title={t.products.newTitle}>
      <ProductForm t={t} />
    </AdminShell>
  );
}
