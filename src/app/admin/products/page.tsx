import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import { deleteProductAction } from "@/app/admin/actions";
import { listAllProducts } from "@/lib/products";
import { formatVnd } from "@/data/products";

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <AdminShell title="Products">
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/products/new" className="admin-btn">
          Add product
        </Link>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div style={{ position: "relative", width: 48, height: 64 }}>
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                </td>
                <td>
                  <strong>{product.names.en}</strong>
                  <div style={{ opacity: 0.65, fontSize: 12 }}>{product.names.vi}</div>
                  <div style={{ opacity: 0.5, fontSize: 11 }}>{product.slug}</div>
                </td>
                <td>{formatVnd(product.price, "en")}</td>
                <td>{product.published ? "Published" : "Hidden"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="admin-btn secondary"
                    >
                      Edit
                    </Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="admin-btn secondary">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
