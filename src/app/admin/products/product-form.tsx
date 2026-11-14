import Image from "next/image";
import { saveProductAction } from "@/app/admin/actions";
import type { Product } from "@/data/products";
import type { AdminDictionary } from "@/i18n/admin-dictionaries";
import type { CategoryPublic } from "@/lib/categories";
import type { AttributePublic } from "@/lib/catalog-attributes";
import type { CityPriceSlug } from "@/lib/product-city";
import { PRODUCT_SIZES } from "@/lib/product-sizes";

type PricingCity = {
  slug: CityPriceSlug | string;
  nameEn: string;
  nameVi: string;
};

export function ProductForm({
  product,
  t,
  categories,
  cities,
  attributes = [],
}: {
  product?: Product;
  t: AdminDictionary;
  categories: CategoryPublic[];
  cities: PricingCity[];
  attributes?: AttributePublic[];
}) {
  const selected = new Set((product?.categories || []).map((c) => c.id));
  const selectedAttrs = new Set(
    (product?.attributes || []).map((a) => a.slug),
  );
  const stockBySlug = new Map(
    (product?.cityStock || []).map((row) => [row.citySlug, row]),
  );
  const sizeField = (id: string) =>
    id === "sm"
      ? "priceSm"
      : id === "md"
        ? "priceMd"
        : id === "lg"
          ? "priceLg"
          : "priceGrand";

  return (
    <form action={saveProductAction} className="admin-card" encType="multipart/form-data">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="existingImage" value={product?.image || ""} />

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.common.nameEn}</span>
          <input name="nameEn" required defaultValue={product?.names.en} />
        </label>
        <label className="admin-field">
          <span>{t.common.nameVi}</span>
          <input name="nameVi" required defaultValue={product?.names.vi} />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.common.slug}</span>
          <input
            name="slug"
            defaultValue={product?.slug}
            placeholder={t.products.slugPlaceholder}
          />
        </label>
        <label className="admin-field">
          <span>{t.products.priceVnd}</span>
          <input
            name="price"
            type="number"
            min={0}
            step={1000}
            required
            defaultValue={product?.price ?? 500000}
          />
        </label>
      </div>
      <div className="admin-grid-2" style={{ marginTop: -4 }}>
        <label className="admin-field">
          <span>{t.products.compareAtLegacy}</span>
          <input
            name="compareAtPrice"
            type="number"
            min={0}
            step={1000}
            placeholder="—"
            defaultValue={product?.compareAtPrice ?? ""}
            className="admin-input-was"
          />
        </label>
      </div>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: -6, marginBottom: 14 }}>
        {t.products.basePriceHint}
      </p>

      <fieldset className="admin-section" style={{ marginBottom: 16 }}>
        <legend style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
          {t.products.sizePricing}
        </legend>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 0, marginBottom: 12 }}>
          {t.products.sizePricingHint}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>{t.products.sizeCol}</th>
                <th>{t.products.saleShort}</th>
                <th>{t.products.wasShort}</th>
                {cities.map((city) => (
                  <th key={city.slug}>{city.nameEn}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_SIZES.map((size) => {
                const field = sizeField(size.id);
                const compareField =
                  size.id === "sm"
                    ? "compareAtSm"
                    : size.id === "md"
                      ? "compareAtMd"
                      : size.id === "lg"
                        ? "compareAtLg"
                        : "compareAtGrand";
                const baseVal = product?.sizePrices?.[size.id] ?? "";
                const wasVal = product?.compareAtPrices?.[size.id] ?? "";
                return (
                  <tr key={size.id}>
                    <td>
                      <strong>
                        {size.short} · {size.labelEn}
                      </strong>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {size.labelVi}
                      </div>
                    </td>
                    <td>
                      <input
                        name={field}
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="—"
                        defaultValue={baseVal === null ? "" : baseVal}
                        style={{ width: "100%", minWidth: 96 }}
                      />
                    </td>
                    <td>
                      <input
                        name={compareField}
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="—"
                        defaultValue={wasVal === null ? "" : wasVal}
                        style={{ width: "100%", minWidth: 96 }}
                        className="admin-input-was"
                      />
                    </td>
                    {cities.map((city) => {
                      const stock = stockBySlug.get(city.slug);
                      const cityVal = stock?.sizePrices?.[size.id] ?? "";
                      return (
                        <td key={city.slug}>
                          <input
                            name={`cityPrice${size.id === "sm" ? "Sm" : size.id === "md" ? "Md" : size.id === "lg" ? "Lg" : "Grand"}_${city.slug}`}
                            type="number"
                            min={0}
                            step={1000}
                            placeholder={t.products.sameAsBase}
                            defaultValue={cityVal === null ? "" : cityVal}
                            style={{ width: "100%", minWidth: 96 }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="admin-grid-2" style={{ marginTop: 14 }}>
          {cities.map((city) => {
            const stock = stockBySlug.get(city.slug);
            return (
              <div key={city.slug}>
                <label
                  className="admin-field"
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                >
                  <input
                    type="checkbox"
                    name={`cityAvailable_${city.slug}`}
                    defaultChecked={stock?.available ?? true}
                    style={{ width: "auto" }}
                  />
                  <span style={{ margin: 0 }}>
                    {t.products.cityAvailable}: {city.nameEn}
                  </span>
                </label>
                <label className="admin-field" style={{ marginBottom: 0 }}>
                  <span>{t.products.cityPriceOverride} ({city.nameEn})</span>
                  <input
                    name={`cityPrice_${city.slug}`}
                    type="number"
                    min={0}
                    step={1000}
                    placeholder={t.products.sameAsBase}
                    defaultValue={stock?.priceOverride ?? ""}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.products.tagEn}</span>
          <input name="tagEn" defaultValue={product?.tags.en ?? "Wrapped bouquet"} />
        </label>
        <label className="admin-field">
          <span>{t.products.tagVi}</span>
          <input name="tagVi" defaultValue={product?.tags.vi ?? "Bó hoa gói giấy"} />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.products.accent}</span>
          <select name="accent" defaultValue={product?.accent ?? "rose"}>
            <option value="rose">rose</option>
            <option value="blush">blush</option>
            <option value="ivory">ivory</option>
            <option value="sage">sage</option>
          </select>
        </label>
        <label className="admin-field">
          <span>{t.products.sortOrder}</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
          />
        </label>
      </div>

      <fieldset style={{ marginBottom: 16, border: "none", padding: 0 }}>
        <legend style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
          {t.products.categories}
        </legend>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 0, marginBottom: 10 }}>
          {t.products.categoriesHint}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {categories.map((cat) => (
            <label
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                border: "1px solid rgba(45,58,40,0.15)",
                borderRadius: 999,
                padding: "6px 12px",
              }}
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={cat.id}
                defaultChecked={selected.has(cat.id)}
                style={{ width: "auto" }}
              />
              <span>
                {cat.nameEn} / {cat.nameVi}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="admin-field">
        <span>{t.products.blurbEn}</span>
        <textarea name="blurbEn" rows={2} defaultValue={product?.blurb.en} />
      </label>
      <label className="admin-field">
        <span>{t.products.blurbVi}</span>
        <textarea name="blurbVi" rows={2} defaultValue={product?.blurb.vi} />
      </label>
      <label className="admin-field">
        <span>{t.products.storyEn}</span>
        <textarea name="storyEn" rows={4} defaultValue={product?.story.en} />
      </label>
      <label className="admin-field">
        <span>{t.products.storyVi}</span>
        <textarea name="storyVi" rows={4} defaultValue={product?.story.vi} />
      </label>

      <fieldset style={{ marginBottom: 16, border: "none", padding: 0 }}>
        <legend style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
          SEO
        </legend>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.products.seoTitleEn}</span>
            <input name="seoTitleEn" defaultValue={product?.seoTitle?.en || ""} />
          </label>
          <label className="admin-field">
            <span>{t.products.seoTitleVi}</span>
            <input name="seoTitleVi" defaultValue={product?.seoTitle?.vi || ""} />
          </label>
        </div>
        <label className="admin-field">
          <span>{t.products.seoDescriptionEn}</span>
          <textarea
            name="seoDescriptionEn"
            rows={2}
            defaultValue={product?.seoDescription?.en || ""}
          />
        </label>
        <label className="admin-field">
          <span>{t.products.seoDescriptionVi}</span>
          <textarea
            name="seoDescriptionVi"
            rows={2}
            defaultValue={product?.seoDescription?.vi || ""}
          />
        </label>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.products.imageAltEn}</span>
            <input name="imageAltEn" defaultValue={product?.imageAlt?.en || ""} />
          </label>
          <label className="admin-field">
            <span>{t.products.imageAltVi}</span>
            <input name="imageAltVi" defaultValue={product?.imageAlt?.vi || ""} />
          </label>
        </div>
      </fieldset>

      {attributes.length ? (
        <fieldset style={{ marginBottom: 16, border: "none", padding: 0 }}>
          <legend style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
            {t.products.attributes}
          </legend>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 0, marginBottom: 10 }}>
            {t.products.attributesHint}
            {product?.aiStatus ? ` · ${t.products.aiStatus}: ${product.aiStatus}` : ""}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {attributes.map((attr) => (
              <label
                key={attr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  border: "1px solid rgba(45,58,40,0.15)",
                  borderRadius: 999,
                  padding: "6px 12px",
                }}
              >
                <input
                  type="checkbox"
                  name="attributeIds"
                  value={attr.id}
                  defaultChecked={selectedAttrs.has(attr.slug)}
                  style={{ width: "auto" }}
                />
                <span>
                  {attr.kind}: {attr.nameEn} / {attr.nameVi}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="admin-field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          name="contentLocked"
          defaultChecked={product?.contentLocked}
          style={{ width: "auto" }}
        />
        <span style={{ margin: 0 }}>{t.products.contentLocked}</span>
      </label>

      <label className="admin-field">
        <span>{t.products.photo}</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      {product?.image ? (
        <div style={{ position: "relative", width: 120, height: 160, marginBottom: 16 }}>
          <Image src={product.image} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <label className="admin-field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          name="published"
          defaultChecked={product?.published ?? true}
          style={{ width: "auto" }}
        />
        <span style={{ margin: 0 }}>{t.products.publishedShop}</span>
      </label>

      <button type="submit" className="admin-btn">
        {t.products.save}
      </button>
    </form>
  );
}
