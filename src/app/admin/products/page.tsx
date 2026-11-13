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
      <div className="admin-products-toolbar">
        <Link href="/admin/products/new" className="admin-btn">
          {t.products.add}
        </Link>
        {sp.saved ? (
          <span className="admin-products-saved">{t.common.saved}</span>
        ) : null}
      </div>
      <p className="admin-products-hint">{t.products.listPricingHint}</p>

      <div className="admin-products-list">
        {products.map((product) => {
          const stockBySlug = new Map(
            (product.cityStock || []).map((row) => [row.citySlug, row]),
          );
          return (
            <article key={product.id} className="admin-product-row">
              <div className="admin-product-row-top">
                <div className="admin-product-thumb">
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                </div>
                <div className="admin-product-meta">
                  <strong>
                    {locale === "vi" ? product.names.vi : product.names.en}
                  </strong>
                  <span>
                    {locale === "vi" ? product.names.en : product.names.vi}
                  </span>
                  <span className="admin-product-slug">
                    {product.slug}
                    {" · "}
                    {product.published
                      ? t.common.published
                      : t.common.hidden}
                  </span>
                </div>
                <div className="admin-product-actions">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="admin-btn secondary admin-btn-sm"
                  >
                    {t.common.edit}
                  </Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="admin-btn secondary admin-btn-sm"
                    >
                      {t.common.delete}
                    </button>
                  </form>
                </div>
              </div>

              <form
                action={quickSaveProductCityPricesAction}
                className="admin-product-prices"
              >
                <input type="hidden" name="id" value={product.id} />

                <div className="admin-price-cell">
                  <div className="admin-price-label">
                    <span>{t.products.baseShort}</span>
                  </div>
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step={1000}
                    required
                    defaultValue={product.price}
                  />
                </div>

                {cities.map((city) => {
                  const stock = stockBySlug.get(city.slug);
                  const cityName =
                    locale === "vi" ? city.nameVi : city.nameEn;
                  return (
                    <div key={city.slug} className="admin-price-cell">
                      <div className="admin-price-label">
                        <span>{cityName}</span>
                        <label className="admin-sell-inline">
                          <input
                            type="checkbox"
                            name={`cityAvailable_${city.slug}`}
                            defaultChecked={stock?.available ?? true}
                          />
                          {t.products.sellShort}
                        </label>
                      </div>
                      <input
                        name={`cityPrice_${city.slug}`}
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="—"
                        defaultValue={stock?.priceOverride ?? ""}
                      />
                    </div>
                  );
                })}

                <button type="submit" className="admin-btn admin-btn-sm">
                  {t.common.save}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
