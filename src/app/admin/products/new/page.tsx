import { AdminShell } from "@/app/admin/_shell";
import { ProductForm } from "@/app/admin/products/product-form";

export default function NewProductPage() {
  return (
    <AdminShell title="New product">
      <ProductForm />
    </AdminShell>
  );
}
