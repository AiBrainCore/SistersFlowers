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

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; zones?: string; error?: string }>;
}) {
  const config = await getDeliveryConfig();
  const zones = await listAllDeliveryZones();
  const { saved, zones: zonesSaved, error } = await searchParams;

  return (
    <AdminShell title="Delivery">
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>Pricing rules saved.</p>
      ) : null}
      {zonesSaved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>Zones updated.</p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>
          Zone needs EN and VI names.
        </p>
      ) : null}

      <h2 style={{ fontFamily: "serif", fontSize: 28, marginBottom: 12 }}>
        Areas customers choose
      </h2>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 640, lineHeight: 1.6 }}>
        Customers pick an area — they do not need kilometres. Fee = area km +
        rules below. Mark “Quote only” for Other / not sure.
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
                  Preview fee: {fee === null ? "Quoted" : formatVnd(fee, "en")}
                </strong>
                <button
                  formAction={deleteDeliveryZoneAction}
                  type="submit"
                  className="admin-btn secondary"
                >
                  Delete
                </button>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>Name EN</span>
                  <input name="nameEn" required defaultValue={zone.nameEn} />
                </label>
                <label className="admin-field">
                  <span>Name VI</span>
                  <input name="nameVi" required defaultValue={zone.nameVi} />
                </label>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>Approx km</span>
                  <input
                    name="km"
                    type="number"
                    min={0}
                    required
                    defaultValue={zone.km}
                  />
                </label>
                <label className="admin-field">
                  <span>Sort</span>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={zone.sortOrder}
                  />
                </label>
              </div>
              <div className="admin-grid-2">
                <label className="admin-field">
                  <span>Note EN</span>
                  <input name="noteEn" defaultValue={zone.noteEn} />
                </label>
                <label className="admin-field">
                  <span>Note VI</span>
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
                  Active
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    name="quoteOnly"
                    defaultChecked={zone.quoteOnly}
                  />
                  Quote only
                </label>
              </div>
              <button type="submit" className="admin-btn">
                Save area
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
          Add new area
        </h3>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>Name EN</span>
            <input name="nameEn" required placeholder="Da Lat centre" />
          </label>
          <label className="admin-field">
            <span>Name VI</span>
            <input name="nameVi" required placeholder="Trung tâm Đà Lạt" />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>Approx km from studio</span>
            <input name="km" type="number" min={0} defaultValue={5} required />
          </label>
          <label className="admin-field">
            <span>Sort order</span>
            <input name="sortOrder" type="number" defaultValue={zones.length + 1} />
          </label>
        </div>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>Note EN</span>
            <input name="noteEn" />
          </label>
          <label className="admin-field">
            <span>Note VI</span>
            <input name="noteVi" />
          </label>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="active" defaultChecked />
            Active
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" name="quoteOnly" />
            Quote only
          </label>
        </div>
        <button type="submit" className="admin-btn">
          Add area
        </button>
      </form>

      <h2 style={{ fontFamily: "serif", fontSize: 28, margin: "40px 0 12px" }}>
        Fee rules (from km)
      </h2>
      <form action={saveDeliverySettingsAction} className="admin-card" style={{ maxWidth: 720 }}>
        <label className="admin-field">
          <span>Studio name</span>
          <input name="studioName" defaultValue={config.studioName} required />
        </label>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>Near range ends (km)</span>
            <input
              name="includedKm"
              type="number"
              min={1}
              defaultValue={config.includedKm}
              required
            />
          </label>
          <label className="admin-field">
            <span>Fee at near range (VND)</span>
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
            <span>Mid range ends (km)</span>
            <input name="midKm" type="number" min={1} defaultValue={config.midKm} required />
          </label>
          <label className="admin-field">
            <span>Fee at mid range (VND)</span>
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
            <span>Max standard range (km)</span>
            <input name="maxKm" type="number" min={1} defaultValue={config.maxKm} required />
          </label>
          <label className="admin-field">
            <span>Fee at max range (VND)</span>
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
          Save fee rules
        </button>
      </form>
    </AdminShell>
  );
}
