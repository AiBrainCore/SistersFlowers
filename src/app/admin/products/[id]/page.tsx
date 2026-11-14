import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getProductById } from "@/lib/products";
import { getAdminT } from "@/lib/admin-locale";
import { listActiveCategories } from "@/lib/categories";
import { listActiveAttributes } from "@/lib/catalog-attributes";
import { listCitiesForPricing } from "@/lib/product-city";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { t }, categories, cities, attributes] = await Promise.all([
    getProductById(id),
    getAdminT(),
    listActiveCategories(),
    listCitiesForPricing(),
    listActiveAttributes(),
  ]);
  if (!product) notFound();

  return (
    <AdminShell title={t.products.editTitle}>
      <ProductForm
        product={product}
        t={t}
        categories={categories}
        cities={cities}
        attributes={attributes}
      />
    </AdminShell>
  );
}
