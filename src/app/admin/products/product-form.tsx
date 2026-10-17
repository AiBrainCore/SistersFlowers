import Image from "next/image";
import { saveProductAction } from "@/app/admin/actions";
import type { Product } from "@/data/products";
import type { AdminDictionary } from "@/i18n/admin-dictionaries";
import type { CategoryPublic } from "@/lib/categories";

export function ProductForm({
  product,
  t,
  categories,
}: {
  product?: Product;
  t: AdminDictionary;
  categories: CategoryPublic[];
}) {
  const selected = new Set((product?.categories || []).map((c) => c.id));

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
