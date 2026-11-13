import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  deleteProductAction,
  quickSaveProductCityPricesAction,
} from "@/app/admin/actions";
import { listAllProducts } from "@/lib/products";
import { listCitiesForPricing } from "@/lib/product-city";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const [products, cities, { locale, t }] = await Promise.all([
    listAllProducts(),
    listCitiesForPricing(),
    getAdminT(),
  ]);
  const sp = (await searchParams) || {};

  return (
    <AdminShell title={t.products.title}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link href="/admin/products/new" className="admin-btn">
          {t.products.add}
        </Link>
        {sp.saved ? (
          <span style={{ fontSize: 13, opacity: 0.75 }}>{t.common.saved}</span>
        ) : null}
      </div>
      <p
        style={{
          fontSize: 13,
          opacity: 0.7,
          marginTop: 0,
          marginBottom: 16,
          maxWidth: 640,
        }}
      >
        {t.products.listPricingHint}
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {products.map((product) => {
          const stockBySlug = new Map(
            (product.cityStock || []).map((row) => [row.citySlug, row]),
          );
          return (
            <div key={product.id} className="admin-card">
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "56px 1fr",
                  alignItems: "start",
                }}
              >
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
                <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {locale === "vi" ? product.names.vi : product.names.en}
                      </strong>
                      <div style={{ opacity: 0.65, fontSize: 12 }}>
                        {locale === "vi" ? product.names.en : product.names.vi}
                      </div>
                      <div style={{ opacity: 0.5, fontSize: 11 }}>
                        {product.slug} ·{" "}
                        {product.published
                          ? t.common.published
                          : t.common.hidden}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="admin-btn secondary"
                      >
                        {t.common.edit}
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="admin-btn secondary">
                          {t.common.delete}
                        </button>
                      </form>
                    </div>
                  </div>

                  <form
                    action={quickSaveProductCityPricesAction}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                      alignItems: "end",
                    }}
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <label className="admin-field" style={{ marginBottom: 0 }}>
                      <span>{t.products.baseShort}</span>
                      <input
                        name="price"
                        type="number"
                        min={0}
                        step={1000}
                        required
                        defaultValue={product.price}
                      />
                    </label>
                    {cities.map((city) => {
                      const stock = stockBySlug.get(city.slug);
                      return (
                        <div key={city.slug} style={{ display: "grid", gap: 6 }}>
                          <label
                            className="admin-field"
                            style={{ marginBottom: 0 }}
                          >
                            <span>
                              {locale === "vi" ? city.nameVi : city.nameEn}
                            </span>
                            <input
                              name={`cityPrice_${city.slug}`}
                              type="number"
                              min={0}
                              step={1000}
                              placeholder={t.products.sameAsBase}
                              defaultValue={stock?.priceOverride ?? ""}
                            />
                          </label>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                            }}
                          >
                            <input
                              type="checkbox"
                              name={`cityAvailable_${city.slug}`}
                              defaultChecked={stock?.available ?? true}
                              style={{ width: "auto" }}
                            />
                            {t.products.sellShort}
                          </label>
                        </div>
                      );
                    })}
                    <button type="submit" className="admin-btn">
                      {t.common.save}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
