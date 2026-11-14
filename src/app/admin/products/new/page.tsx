import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getAdminT } from "@/lib/admin-locale";
import { listActiveCategories } from "@/lib/categories";
import { listActiveAttributes } from "@/lib/catalog-attributes";
import { listCitiesForPricing } from "@/lib/product-city";

export default async function NewProductPage() {
  const [{ locale, t }, categories, cities, attributes] = await Promise.all([
    getAdminT(),
    listActiveCategories(),
    listCitiesForPricing(),
    listActiveAttributes(),
  ]);
  return (
    <AdminShell title={t.products.newTitle}>
      <ProductForm
        t={t}
        locale={locale}
        categories={categories}
        cities={cities}
        attributes={attributes}
      />
    </AdminShell>
  );
}
