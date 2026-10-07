import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { getProductById } from "@/lib/products";
import { getAdminT } from "@/lib/admin-locale";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const { t } = await getAdminT();

  return (
    <AdminShell title={t.products.editTitle}>
      <ProductForm product={product} t={t} />
    </AdminShell>
  );
}
