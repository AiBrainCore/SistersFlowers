import { AdminShell } from "@/app/admin/_shell";
import {
  deleteDeliveryZoneAction,
  saveDeliverySettingsAction,
  saveDeliveryZoneAction,
} from "@/app/admin/actions";
import {
  getDeliveryConfig,
  listAllDeliveryZones,
} from "@/lib/delivery-settings";
import { formatVnd } from "@/data/products";
import { calcDeliveryFee } from "@/lib/delivery";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; zones?: string; error?: string }>;
}) {
  const config = await getDeliveryConfig();
  const zones = await listAllDeliveryZones();
  const { saved, zones: zonesSaved, error } = await searchParams;
  const { locale, t } = await getAdminT();

  return (
    <AdminShell title={t.delivery.title}>
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.delivery.pricingSaved}</p>
      ) : null}
      {zonesSaved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.delivery.zonesUpdated}</p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>
          {t.delivery.zoneError}
        </p>
      ) : null}

      <h2 style={{ fontFamily: "serif", fontSize: 28, marginBottom: 12 }}>
        {t.delivery.areasTitle}
      </h2>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 640, lineHeight: 1.6 }}>
        {t.delivery.areasIntro}
      </p>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {zones.map((zone) => {
          const fee = zone.quoteOnly ? null : calcDeliveryFee(zone.km, config);
          return (
            <form
              key={zone.id}
              action={saveDeliveryZoneAction}
              className="admin-card"
              style={{ maxWidth: 820 }}
            >
              <input type="hidden" name="id" value={zone.id} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <strong style={{ fontSize: 14 }}>
                  {t.delivery.previewFee}:{" "}
                  {fee === null ? t.delivery.quoted : formatVnd(fee, locale)}
                </strong>
                <button
                  formAction={deleteDeliveryZoneAction}
                  type="submit"
                  className="admin-btn secondary"
                >
                  {t.common.delete}
                </button>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>{t.common.nameEn}</span>
                  <input name="nameEn" required defaultValue={zone.nameEn} />
                </label>
                <label className="admin-field">
                  <span>{t.common.nameVi}</span>
                  <input name="nameVi" required defaultValue={zone.nameVi} />
                </label>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>{t.delivery.kmStudio}</span>
                  <input
                    name="km"
                    type="number"
                    min={0}
                    required
                    defaultValue={zone.km}
                  />
                </label>
                <label className="admin-field">
                  <span>{t.common.sort}</span>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={zone.sortOrder}
                  />
                </label>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>{t.delivery.noteEn}</span>
                  <input name="noteEn" defaultValue={zone.noteEn} />
                </label>
                <label className="admin-field">
                  <span>{t.delivery.noteVi}</span>
                  <input name="noteVi" defaultValue={zone.noteVi} />
                </label>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={zone.active}
                  />
                  {t.common.active}
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    name="quoteOnly"
                    defaultChecked={zone.quoteOnly}
                  />
                  {t.delivery.quoteOnly}
                </label>
              </div>
              <button type="submit" className="admin-btn">
                {t.common.save}
              </button>
            </form>
          );
        })}
      </div>

      <form
        action={saveDeliveryZoneAction}
        className="admin-card"
        style={{ marginTop: 24, maxWidth: 820 }}
      >
        <h3 style={{ marginTop: 0, fontFamily: "serif", fontSize: 22 }}>
          {t.delivery.addZone}
        </h3>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.common.nameEn}</span>
            <input name="nameEn" required placeholder="Da Lat centre" />
          </label>
          <label className="admin-field">
            <span>{t.common.nameVi}</span>
            <input name="nameVi" required placeholder="Trung tâm Đà Lạt" />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.delivery.kmStudio}</span>
            <input name="km" type="number" min={0} defaultValue={5} required />
          </label>
          <label className="admin-field">
            <span>{t.common.sort}</span>
            <input name="sortOrder" type="number" defaultValue={zones.length + 1} />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.delivery.noteEn}</span>
            <input name="noteEn" />
          </label>
          <label className="admin-field">
            <span>{t.delivery.noteVi}</span>
            <input name="noteVi" />
          </label>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="active" defaultChecked />
            {t.common.active}
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="quoteOnly" />
            {t.delivery.quoteOnly}
          </label>
        </div>
        <button type="submit" className="admin-btn">
          {t.delivery.addZone}
        </button>
      </form>

      <h2 style={{ fontFamily: "serif", fontSize: 28, margin: "40px 0 12px" }}>
        {t.delivery.rulesTitle}
      </h2>
      <form action={saveDeliverySettingsAction} className="admin-card" style={{ maxWidth: 720 }}>
        <label className="admin-field">
          <span>{t.delivery.studioName}</span>
          <input name="studioName" defaultValue={config.studioName} required />
        </label>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.delivery.includedKm}</span>
            <input
              name="includedKm"
              type="number"
              min={1}
              defaultValue={config.includedKm}
              required
            />
          </label>
          <label className="admin-field">
            <span>{t.delivery.baseFee}</span>
            <input
              name="baseFee"
              type="number"
              min={0}
              step={1000}
              defaultValue={config.baseFee}
              required
            />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.delivery.midKm}</span>
            <input name="midKm" type="number" min={1} defaultValue={config.midKm} required />
          </label>
          <label className="admin-field">
            <span>{t.delivery.midFee}</span>
            <input
              name="midFee"
              type="number"
              min={0}
              step={1000}
              defaultValue={config.midFee}
              required
            />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>{t.delivery.maxKm}</span>
            <input name="maxKm" type="number" min={1} defaultValue={config.maxKm} required />
          </label>
          <label className="admin-field">
            <span>{t.delivery.maxFee}</span>
            <input
              name="maxFee"
              type="number"
              min={0}
              step={1000}
              defaultValue={config.maxFee}
              required
            />
          </label>
        </div>
        <button type="submit" className="admin-btn" style={{ marginTop: 12 }}>
          {t.delivery.saveRules}
        </button>
      </form>
    </AdminShell>
  );
}
