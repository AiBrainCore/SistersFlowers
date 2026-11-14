import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  deleteProductAction,
  quickSaveProductCityPricesAction,
} from "@/app/admin/actions";
import { ProductsBulkPricing } from "@/components/admin/products-bulk-pricing";
import { listAllProducts } from "@/lib/products";
import { listCitiesForPricing } from "@/lib/product-city";
import { getAdminT } from "@/lib/admin-locale";
import { PRODUCT_SIZES } from "@/lib/product-sizes";

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    saved?: string;
    q?: string;
    status?: string;
    error?: string;
    bulk?: string;
    n?: string;
  }>;
}) {
  const [products, cities, { locale, t }] = await Promise.all([
    listAllProducts(),
    listCitiesForPricing(),
    getAdminT(),
  ]);
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim();
  const status = (sp.status || "all").trim() || "all";
  const qFold = fold(q);
  const bulkNotice =
    sp.bulk && sp.n
      ? t.products.bulkDone
          .replace("{action}", sp.bulk)
          .replace("{n}", sp.n)
      : sp.error === "bulk"
        ? t.products.bulkError
        : null;

  const filtered = products.filter((product) => {
    if (status === "published" && !product.published) return false;
    if (status === "hidden" && product.published) return false;
    if (!qFold) return true;
    const hay = fold(
      [
        product.names.en,
        product.names.vi,
        product.slug,
        product.tags.en,
        product.tags.vi,
      ].join(" "),
    );
    return hay.includes(qFold);
  });

  const countLabel = t.products.countShowing
    .replace("{shown}", String(filtered.length))
    .replace("{total}", String(products.length));

  return (
    <AdminShell title={t.products.title}>
      <div className="admin-products-toolbar">
        <Link href="/admin/products/new" className="admin-btn">
          {t.products.add}
        </Link>
        {sp.saved ? (
          <span className="admin-products-saved">{t.common.saved}</span>
        ) : null}
        {sp.error === "price" ? (
          <span className="admin-products-saved">{t.products.priceError}</span>
        ) : null}
      </div>

      <form method="get" className="admin-products-filters">
        <label className="admin-filter-field">
          <span>{t.products.filterSearch}</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.products.filterSearchPlaceholder}
          />
        </label>
        <label className="admin-filter-field">
          <span>{t.products.filterStatus}</span>
          <select name="status" defaultValue={status}>
            <option value="all">{t.products.filterAll}</option>
            <option value="published">{t.common.published}</option>
            <option value="hidden">{t.common.hidden}</option>
          </select>
        </label>
        <button type="submit" className="admin-btn secondary admin-btn-sm">
          {t.products.filterApply}
        </button>
        {q || status !== "all" ? (
          <Link href="/admin/products" className="admin-btn secondary admin-btn-sm">
            {t.products.filterClear}
          </Link>
        ) : null}
        <p className="admin-products-count">{countLabel}</p>
      </form>

      <ProductsBulkPricing
        t={t}
        returnQ={q}
        returnStatus={status}
        notice={bulkNotice}
      />

      <p className="admin-products-hint">{t.products.listPricingHint}</p>

      <div className="admin-products-list">
        {filtered.length === 0 ? (
          <p className="admin-products-empty">{t.products.filterEmpty}</p>
        ) : null}

        {filtered.map((product) => {
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
                <input type="hidden" name="returnQ" value={q} />
                <input type="hidden" name="returnStatus" value={status} />
                <input type="hidden" name="price" value={product.price} />

                <div className="admin-size-grid">
                  {PRODUCT_SIZES.map((size) => {
                    const sale = product.sizePrices?.[size.id] ?? "";
                    const was = product.compareAtPrices?.[size.id] ?? "";
                    const saleName =
                      size.id === "sm"
                        ? "priceSm"
                        : size.id === "md"
                          ? "priceMd"
                          : "priceLg";
                    const wasName =
                      size.id === "sm"
                        ? "compareAtSm"
                        : size.id === "md"
                          ? "compareAtMd"
                          : "compareAtLg";
                    return (
                      <div key={size.id} className="admin-size-cell">
                        <div className="admin-price-label">
                          <span>
                            {size.short}
                            <span className="admin-size-sub">
                              {" "}
                              · {locale === "vi" ? size.labelVi : size.labelEn}
                            </span>
                          </span>
                        </div>
                        <div className="admin-size-inputs">
                          <label>
                            <span>{t.products.saleShort}</span>
                            <input
                              name={saleName}
                              type="number"
                              min={0}
                              step={1000}
                              placeholder="—"
                              defaultValue={sale ?? ""}
                            />
                          </label>
                          <label>
                            <span>{t.products.wasShort}</span>
                            <input
                              name={wasName}
                              type="number"
                              min={0}
                              step={1000}
                              placeholder="—"
                              defaultValue={was === null ? "" : was}
                              className="admin-input-was"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="admin-city-sell-row">
                  {cities.map((city) => {
                    const stock = stockBySlug.get(city.slug);
                    const cityName =
                      locale === "vi" ? city.nameVi : city.nameEn;
                    return (
                      <label key={city.slug} className="admin-sell-chip">
                        <input
                          type="checkbox"
                          name={`cityAvailable_${city.slug}`}
                          defaultChecked={stock?.available ?? true}
                        />
                        <span>
                          {cityName} · {t.products.sellShort}
                        </span>
                      </label>
                    );
                  })}
                  <p className="admin-city-edit-hint">
                    {t.products.citySizesHint}{" "}
                    <Link href={`/admin/products/${product.id}`}>
                      {t.common.edit}
                    </Link>
                  </p>
                </div>

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
