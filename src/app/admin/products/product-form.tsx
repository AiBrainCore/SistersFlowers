import Image from "next/image";
import { saveProductAction } from "@/app/admin/actions";
import type { Product } from "@/data/products";

export function ProductForm({ product }: { product?: Product }) {
  return (
    <form action={saveProductAction} className="admin-card" encType="multipart/form-data">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="existingImage" value={product?.image || ""} />

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>Name EN</span>
          <input name="nameEn" required defaultValue={product?.names.en} />
        </label>
        <label className="admin-field">
          <span>Name VI</span>
          <input name="nameVi" required defaultValue={product?.names.vi} />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>Slug</span>
          <input name="slug" defaultValue={product?.slug} placeholder="auto from EN name" />
        </label>
        <label className="admin-field">
          <span>Price (VND)</span>
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
          <span>Tag EN</span>
          <input name="tagEn" defaultValue={product?.tags.en ?? "Wrapped bouquet"} />
        </label>
        <label className="admin-field">
          <span>Tag VI</span>
          <input name="tagVi" defaultValue={product?.tags.vi ?? "Bó hoa gói giấy"} />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>Accent</span>
          <select name="accent" defaultValue={product?.accent ?? "rose"}>
            <option value="rose">rose</option>
            <option value="blush">blush</option>
            <option value="sage">sage</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Blurb EN</span>
        <textarea name="blurbEn" rows={2} defaultValue={product?.blurb.en} />
      </label>
      <label className="admin-field">
        <span>Blurb VI</span>
        <textarea name="blurbVi" rows={2} defaultValue={product?.blurb.vi} />
      </label>
      <label className="admin-field">
        <span>Story EN</span>
        <textarea name="storyEn" rows={4} defaultValue={product?.story.en} />
      </label>
      <label className="admin-field">
        <span>Story VI</span>
        <textarea name="storyVi" rows={4} defaultValue={product?.story.vi} />
      </label>

      <label className="admin-field">
        <span>Photo (jpg/png/webp)</span>
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
        <span style={{ margin: 0 }}>Published in shop</span>
      </label>

      <button type="submit" className="admin-btn">
        Save product
      </button>
    </form>
  );
}
