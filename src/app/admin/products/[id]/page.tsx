import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getProductById } from "@/lib/products";
import { getAdminT } from "@/lib/admin-locale";
import { listActiveCategories } from "@/lib/categories";
import { listCitiesForPricing } from "@/lib/product-city";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { t }, categories, cities] = await Promise.all([
    getProductById(id),
    getAdminT(),
    listActiveCategories(),
    listCitiesForPricing(),
  ]);
  if (!product) notFound();

  return (
    <AdminShell title={t.products.editTitle}>
      <ProductForm
        product={product}
        t={t}
        categories={categories}
        cities={cities}
      />
    </AdminShell>
  );
}
