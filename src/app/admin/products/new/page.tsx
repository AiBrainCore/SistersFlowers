import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminT } from "@/lib/admin-locale";
import { listActiveCategories } from "@/lib/categories";

export default async function NewProductPage() {
  const [{ t }, categories] = await Promise.all([
    getAdminT(),
    listActiveCategories(),
  ]);
  return (
    <AdminShell title={t.products.newTitle}>
      <ProductForm t={t} categories={categories} />
    </AdminShell>
  );
}
