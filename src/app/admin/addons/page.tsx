import { AdminShell } from "@/app/admin/_shell";
import { deleteAddonAction, saveAddonAction } from "@/app/admin/actions";
import { listAllAddons, commissionAmount } from "@/lib/addons";
import { formatVnd } from "@/data/products";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminAddonsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const addons = await listAllAddons();
  const { saved, error } = await searchParams;
  const { locale, t } = await getAdminT();

  return (
    <AdminShell title={t.addons.title}>
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.addons.saved}</p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>
          {t.addons.error}
        </p>
      ) : null}

      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 720, lineHeight: 1.7 }}>
        {t.addons.intro}{" "}
        <a href="/voucher" target="_blank" rel="noreferrer">
          /voucher
        </a>
      </p>

      <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
        {addons.map((addon) => (
          <form
            key={addon.id}
            action={saveAddonAction}
            className="admin-card"
            encType="multipart/form-data"
            style={{ maxWidth: 860 }}
          >
            <input type="hidden" name="id" value={addon.id} />
            <input type="hidden" name="existingImage" value={addon.image} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <strong>
                {addon.kind === "partner" ? t.addons.partner : t.addons.extra} ·{" "}
                {formatVnd(addon.price, locale)}
                {addon.kind === "partner" && addon.commissionPercent > 0
                  ? ` · Sisters ~${formatVnd(
                      commissionAmount(addon.price, addon.commissionPercent),
                      locale,
                    )} (${addon.commissionPercent}%)`
                  : ""}
              </strong>
              <button
                formAction={deleteAddonAction}
                type="submit"
                className="admin-btn secondary"
              >
                {t.common.delete}
              </button>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.common.type}</span>
                <select name="kind" defaultValue={addon.kind}>
                  <option value="extra">{t.addons.extra}</option>
                  <option value="partner">{t.addons.partner}</option>
                </select>
              </label>
              <label className="admin-field">
                <span>{t.common.slug}</span>
                <input name="slug" defaultValue={addon.slug} />
              </label>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.common.nameEn}</span>
                <input name="nameEn" required defaultValue={addon.nameEn} />
              </label>
              <label className="admin-field">
                <span>{t.common.nameVi}</span>
                <input name="nameVi" required defaultValue={addon.nameVi} />
              </label>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.common.descriptionEn}</span>
                <input name="descriptionEn" defaultValue={addon.descriptionEn} />
              </label>
              <label className="admin-field">
                <span>{t.common.descriptionVi}</span>
                <input name="descriptionVi" defaultValue={addon.descriptionVi} />
              </label>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.addons.faceValue}</span>
                <input
                  name="price"
                  type="number"
                  min={0}
                  step={1000}
                  required
                  defaultValue={addon.price}
                />
              </label>
              <label className="admin-field">
                <span>{t.common.sort}</span>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={addon.sortOrder}
                />
              </label>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.addons.partnerName}</span>
                <input
                  name="partnerName"
                  defaultValue={addon.partnerName}
                  placeholder="Hotel / Spa / Salon"
                />
              </label>
              <label className="admin-field">
                <span>{t.addons.category}</span>
                <select
                  name="partnerCategory"
                  defaultValue={addon.partnerCategory || ""}
                >
                  <option value="">—</option>
                  <option value="spa">spa</option>
                  <option value="hotel">hotel</option>
                  <option value="salon">salon</option>
                  <option value="car">car / taxi</option>
                  <option value="restaurant">restaurant</option>
                  <option value="other">other</option>
                </select>
              </label>
            </div>

            <div className="admin-grid-2">
              <label className="admin-field">
                <span>{t.addons.commission}</span>
                <input
                  name="commissionPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={addon.commissionPercent}
                />
              </label>
              <label className="admin-field">
                <span>{t.addons.validityDays}</span>
                <input
                  name="validityDays"
                  type="number"
                  min={1}
                  defaultValue={addon.validityDays || 90}
                />
              </label>
            </div>

            <label className="admin-field">
              <span>{t.addons.imageOptional}</span>
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" name="active" defaultChecked={addon.active} />
                {t.common.active}
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input
                  type="checkbox"
                  name="requiresNote"
                  defaultChecked={addon.requiresNote}
                />
                {t.addons.requiresNote}
              </label>
            </div>

            <button type="submit" className="admin-btn">
              {t.common.save}
            </button>
          </form>
        ))}
      </div>

      <form
        action={saveAddonAction}
        className="admin-card"
        encType="multipart/form-data"
        style={{ marginTop: 28, maxWidth: 860 }}
      >
        <h3 style={{ marginTop: 0, fontFamily: "serif", fontSize: 22 }}>
          {t.addons.addNew}
        </h3>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.common.type}</span>
            <select name="kind" defaultValue="extra">
              <option value="extra">{t.addons.extra}</option>
              <option value="partner">{t.addons.partner}</option>
            </select>
          </label>
          <label className="admin-field">
            <span>{t.common.slug} ({t.common.optional})</span>
            <input name="slug" placeholder={t.products.slugPlaceholder} />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.common.nameEn}</span>
            <input name="nameEn" required />
          </label>
          <label className="admin-field">
            <span>{t.common.nameVi}</span>
            <input name="nameVi" required />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.common.descriptionEn}</span>
            <input name="descriptionEn" />
          </label>
          <label className="admin-field">
            <span>{t.common.descriptionVi}</span>
            <input name="descriptionVi" />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.addons.faceValue}</span>
            <input name="price" type="number" min={0} step={1000} required defaultValue={100000} />
          </label>
          <label className="admin-field">
            <span>{t.common.sort}</span>
            <input name="sortOrder" type="number" defaultValue={addons.length + 1} />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.addons.partnerName}</span>
            <input name="partnerName" />
          </label>
          <label className="admin-field">
            <span>{t.addons.category}</span>
            <select name="partnerCategory" defaultValue="">
              <option value="">—</option>
              <option value="spa">spa</option>
              <option value="hotel">hotel</option>
              <option value="salon">salon</option>
              <option value="car">car / taxi</option>
              <option value="restaurant">restaurant</option>
              <option value="other">other</option>
            </select>
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.addons.commission}</span>
            <input name="commissionPercent" type="number" min={0} max={100} defaultValue={10} />
          </label>
          <label className="admin-field">
            <span>{t.addons.validityDays}</span>
            <input name="validityDays" type="number" min={1} defaultValue={90} />
          </label>
        </div>
        <label className="admin-field">
          <span>{t.common.image}</span>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="active" defaultChecked />
            {t.common.active}
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="requiresNote" />
            {t.addons.requiresNote}
          </label>
        </div>
        <button type="submit" className="admin-btn">
          {t.common.add}
        </button>
      </form>
    </AdminShell>
  );
}
