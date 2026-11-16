import { AdminShell } from "@/app/admin/_shell";
import {
  resetBuilderSettingsAction,
  saveBuilderSettingsAction,
} from "@/app/admin/actions";
import { getBuilderCatalog } from "@/lib/builder-settings";
import { getAdminT } from "@/lib/admin-locale";
import type { BuilderOption } from "@/data/bouquet-builder";

type SectionKey =
  | "sizes"
  | "moods"
  | "wraps"
  | "ribbons"
  | "premiums"
  | "addons";

function OptionRows({
  section,
  options,
  labels,
}: {
  section: SectionKey;
  options: BuilderOption[];
  labels: {
    id: string;
    nameEn: string;
    nameVi: string;
    price: string;
    active: string;
    hidden: string;
    sort: string;
    swatch: string;
    imagePath: string;
  };
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {options.map((option, index) => (
        <div
          key={`${section}-${option.id}-${index}`}
          className="admin-card"
          style={{ maxWidth: 960 }}
        >
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{labels.id}</span>
              <input name={`${section}Id`} defaultValue={option.id} required />
            </label>
            <label className="admin-field">
              <span>{labels.price}</span>
              <input
                name={`${section}Price`}
                type="number"
                min={0}
                step={1000}
                defaultValue={option.price}
                required
              />
            </label>
          </div>
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{labels.nameEn}</span>
              <input
                name={`${section}LabelEn`}
                defaultValue={option.labelEn || option.id}
                required
              />
            </label>
            <label className="admin-field">
              <span>{labels.nameVi}</span>
              <input
                name={`${section}LabelVi`}
                defaultValue={option.labelVi || option.id}
                required
              />
            </label>
          </div>
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{labels.swatch}</span>
              <input name={`${section}Swatch`} defaultValue={option.swatch || ""} />
            </label>
            <label className="admin-field">
              <span>{labels.imagePath}</span>
              <input name={`${section}Image`} defaultValue={option.image || ""} />
            </label>
          </div>
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{labels.sort}</span>
              <input
                name={`${section}Sort`}
                type="number"
                defaultValue={option.sortOrder ?? index * 10}
              />
            </label>
            <label className="admin-field">
              <span>{labels.active}</span>
              <select
                name={`${section}Active`}
                defaultValue={option.active !== false ? "1" : "0"}
              >
                <option value="1">{labels.active}</option>
                <option value="0">{labels.hidden}</option>
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const catalog = await getBuilderCatalog();
  const { saved } = await searchParams;
  const { t } = await getAdminT();
  const fieldLabels = {
    id: t.builder.id,
    nameEn: t.common.nameEn,
    nameVi: t.common.nameVi,
    price: t.common.price,
    active: t.common.active,
    hidden: t.common.hidden,
    sort: t.common.sort,
    swatch: t.builder.swatch,
    imagePath: t.builder.imagePath,
  };

  const sections: { key: SectionKey; title: string; options: BuilderOption[] }[] =
    [
      { key: "sizes", title: t.builder.sizes, options: catalog.sizes },
      { key: "moods", title: t.builder.moods, options: catalog.moods },
      { key: "wraps", title: t.builder.wraps, options: catalog.wraps },
      { key: "ribbons", title: t.builder.ribbons, options: catalog.ribbons },
      {
        key: "premiums",
        title: t.builder.premiums,
        options: catalog.premiums,
      },
      { key: "addons", title: t.builder.addons, options: catalog.addons },
    ];

  return (
    <AdminShell title={t.builder.title}>
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.builder.saved}</p>
      ) : null}
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 720, lineHeight: 1.6 }}>
        {t.builder.intro}
      </p>

      <form action={saveBuilderSettingsAction} style={{ marginTop: 20 }}>
        {sections.map((section) => (
          <div key={section.key} style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "serif", fontSize: 28, marginBottom: 12 }}>
              {section.title}
            </h2>
            <OptionRows
              section={section.key}
              options={section.options}
              labels={fieldLabels}
            />
          </div>
        ))}
        <button type="submit" className="admin-btn">
          {t.common.save}
        </button>
      </form>

      <form action={resetBuilderSettingsAction} style={{ marginTop: 16 }}>
        <button type="submit" className="admin-btn secondary">
          {t.builder.resetDefaults}
        </button>
      </form>
    </AdminShell>
  );
}
