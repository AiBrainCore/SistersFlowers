import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminT } from "@/lib/admin-locale";
import { listActiveCategories } from "@/lib/categories";
import { listCitiesForPricing } from "@/lib/product-city";

export default async function NewProductPage() {
  const [{ t }, categories, cities] = await Promise.all([
    getAdminT(),
    listActiveCategories(),
    listCitiesForPricing(),
  ]);
  return (
    <AdminShell title={t.products.newTitle}>
      <ProductForm t={t} categories={categories} cities={cities} />
    </AdminShell>
  );
}
