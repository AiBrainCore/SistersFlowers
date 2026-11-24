import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  enableAllPublishedGoogleShoppingAction,
  saveGoogleMerchantSettingsAction,
  setProductGoogleShoppingAction,
} from "@/app/admin/shopping/actions";
import { getAdminT } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import {
  buildGoogleMerchantFeed,
  getGoogleMerchantSettings,
} from "@/lib/google-merchant/feed";
import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function AdminShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale, t } = await getAdminT();
  const { saved, error } = await searchParams;
  const [settings, cities, feedVi, feedEn] = await Promise.all([
    getGoogleMerchantSettings(),
    prisma.city.findMany({
      where: { status: "open" },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameEn: true, nameVi: true },
    }),
    buildGoogleMerchantFeed({ locale: "vi" }),
    buildGoogleMerchantFeed({ locale: "en" }),
  ]);

  const xmlUrl = `${PUBLIC_SITE_ORIGIN}/feeds/google-merchant.xml`;
  const tsvUrl = `${PUBLIC_SITE_ORIGIN}/feeds/google-merchant.txt`;
  const xmlDaNang = `${xmlUrl}?city=danang&lang=vi`;
  const xmlDaLat = `${xmlUrl}?city=dalat&lang=vi`;

  const products = await prisma.product.findMany({
    where: { published: true },
    select: {
      id: true,
      sku: true,
      slug: true,
      nameEn: true,
      nameVi: true,
      googleShopping: true,
      image: true,
      price: true,
      productType: true,
    },
    orderBy: [{ sortOrder: "asc" }, { sku: "asc" }],
    take: 200,
  });

  const excluded = products.filter((p) => !p.googleShopping);
  const issuePreview = feedVi.issues.slice(0, 40);

  return (
    <AdminShell title={t.shopping.title}>
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.common.saved}</p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>{t.shopping.error}</p>
      ) : null}

      <p style={{ maxWidth: 720, lineHeight: 1.6, opacity: 0.85, marginBottom: 20 }}>
        {t.shopping.intro}
      </p>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "serif", fontSize: 22, marginTop: 0 }}>
          {t.shopping.statsTitle}
        </h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            {t.shopping.statProducts}: <strong>{feedVi.meta.productCount}</strong>
          </li>
          <li>
            {t.shopping.statItemsVi}: <strong>{feedVi.meta.itemCount}</strong>
          </li>
          <li>
            {t.shopping.statItemsEn}: <strong>{feedEn.meta.itemCount}</strong>
          </li>
          <li>
            {t.shopping.statIssues}: <strong>{feedVi.issues.length}</strong>
          </li>
          <li>
            {t.shopping.statExcluded}: <strong>{excluded.length}</strong>
          </li>
          <li>
            {t.shopping.feedStatus}:{" "}
            <strong>
              {settings.enabled ? t.shopping.feedOn : t.shopping.feedOff}
            </strong>
          </li>
        </ul>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "serif", fontSize: 22, marginTop: 0 }}>
          {t.shopping.feedUrlsTitle}
        </h2>
        <p style={{ opacity: 0.8, lineHeight: 1.55, marginTop: 0 }}>
          {t.shopping.feedUrlsIntro}
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, lineHeight: 1.7, wordBreak: "break-all" }}>
          <li>
            <a href={xmlDaNang} target="_blank" rel="noopener noreferrer">
              {xmlDaNang}
            </a>{" "}
            — Da Nang VI (XML)
          </li>
          <li>
            <a href={xmlDaLat} target="_blank" rel="noopener noreferrer">
              {xmlDaLat}
            </a>{" "}
            — Da Lat VI (XML)
          </li>
          <li>
            <a href={`${tsvUrl}?city=danang&lang=vi`} target="_blank" rel="noopener noreferrer">
              {tsvUrl}?city=danang&amp;lang=vi
            </a>{" "}
            — TSV
          </li>
        </ul>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 0 }}>
          {t.shopping.gmcHint}
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "serif", fontSize: 22, marginTop: 0 }}>
          {t.shopping.settingsTitle}
        </h2>
        <form action={saveGoogleMerchantSettingsAction} className="admin-form">
          <label className="admin-field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              style={{ width: "auto" }}
            />
            <span style={{ margin: 0 }}>{t.shopping.enabled}</span>
          </label>
          <div className="admin-grid-2">
            <label className="admin-field">
              <span>{t.shopping.defaultLocale}</span>
              <select name="defaultLocale" defaultValue={settings.defaultLocale}>
                <option value="vi">Tiếng Việt (vi)</option>
                <option value="en">English (en)</option>
              </select>
            </label>
            <label className="admin-field">
              <span>{t.shopping.defaultCity}</span>
              <select name="defaultCitySlug" defaultValue={settings.defaultCitySlug}>
                {(cities.length
                  ? cities
                  : [
                      { slug: "danang", nameEn: "Da Nang", nameVi: "Đà Nẵng" },
                      { slug: "dalat", nameEn: "Da Lat", nameVi: "Đà Lạt" },
                    ]
                ).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {locale === "vi" ? c.nameVi : c.nameEn}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="admin-field">
            <span>{t.shopping.brand}</span>
            <input name="brand" defaultValue={settings.brand} />
          </label>
          <label className="admin-field">
            <span>{t.shopping.googleCategory}</span>
            <input
              name="googleProductCategory"
              defaultValue={settings.googleProductCategory}
            />
          </label>
          <label className="admin-field">
            <span>{t.shopping.shippingFlat}</span>
            <input
              name="shippingFlatVnd"
              type="number"
              min={0}
              step={1000}
              placeholder={t.shopping.shippingFlatPlaceholder}
              defaultValue={settings.shippingFlatVnd ?? ""}
            />
          </label>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: -8 }}>
            {t.shopping.shippingFlatHint}
          </p>
          <button type="submit" className="admin-btn">
            {t.common.save}
          </button>
        </form>
      </div>

      {issuePreview.length ? (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "serif", fontSize: 22, marginTop: 0 }}>
            {t.shopping.issuesTitle}
          </h2>
          <p style={{ opacity: 0.8, marginTop: 0 }}>{t.shopping.issuesIntro}</p>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Slug</th>
                  <th>{t.shopping.issueReason}</th>
                </tr>
              </thead>
              <tbody>
                {issuePreview.map((row) => (
                  <tr key={`${row.sku}-${row.reason}`}>
                    <td>{row.sku}</td>
                    <td>
                      <Link href={`/admin/products?q=${encodeURIComponent(row.sku)}`}>
                        {row.slug}
                      </Link>
                    </td>
                    <td>{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontFamily: "serif", fontSize: 22, margin: 0 }}>
            {t.shopping.productsTitle}
          </h2>
          <form action={enableAllPublishedGoogleShoppingAction}>
            <button type="submit" className="admin-btn secondary">
              {t.shopping.enableAll}
            </button>
          </form>
        </div>
        <p style={{ opacity: 0.8, marginTop: 0 }}>{t.shopping.productsIntro}</p>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>{t.common.name}</th>
                <th>{t.shopping.colInclude}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>{p.sku}</Link>
                  </td>
                  <td>{locale === "vi" ? p.nameVi : p.nameEn}</td>
                  <td>
                    {p.googleShopping ? t.shopping.included : t.shopping.excluded}
                  </td>
                  <td>
                    <form action={setProductGoogleShoppingAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="include"
                        value={p.googleShopping ? "0" : "1"}
                      />
                      <button type="submit" className="admin-btn secondary">
                        {p.googleShopping
                          ? t.shopping.exclude
                          : t.shopping.include}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
