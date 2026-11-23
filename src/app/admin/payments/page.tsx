import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  deletePaymentAccountAction,
  savePaymentAccountAction,
  savePaymentMethodSettingsAction,
  setCheckoutTestProductAction,
} from "@/app/admin/payments/actions";
import { getAdminT } from "@/lib/admin-locale";
import {
  CHECKOUT_TEST_PRODUCT_PRICE_VND,
  getCheckoutTestProductStatus,
} from "@/lib/checkout-test-product";
import { prisma } from "@/lib/db";
import {
  ensurePaymentMethodSettings,
  listPaymentMethodsForDisplay,
} from "@/lib/payments/catalog";
import { payosConfigured } from "@/lib/payments/payos";
import { formatVnd } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale, t } = await getAdminT();
  const { saved, error } = await searchParams;
  await ensurePaymentMethodSettings();
  const [methods, accounts, cities, branches, checkoutTest] = await Promise.all([
    listPaymentMethodsForDisplay(),
    prisma.paymentAccount.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.city.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({
      include: { city: true },
      orderBy: { nameEn: "asc" },
    }),
    getCheckoutTestProductStatus(),
  ]);
  const payosReady = payosConfigured();

  return (
    <AdminShell title={t.payments.title}>
      {saved ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>{t.common.saved}</p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>{t.payments.error}</p>
      ) : null}

      <p style={{ maxWidth: 720, lineHeight: 1.6, opacity: 0.8, marginBottom: 24 }}>
        {t.payments.intro}
      </p>

      <div
        className="admin-card"
        style={{
          marginBottom: 24,
          borderColor: checkoutTest.enabled ? "#c24712" : undefined,
          borderWidth: checkoutTest.enabled ? 1 : undefined,
          borderStyle: checkoutTest.enabled ? "solid" : undefined,
        }}
      >
        <h2 style={{ fontFamily: "serif", fontSize: 24, marginTop: 0 }}>
          {t.payments.checkoutTestTitle}
        </h2>
        <p style={{ maxWidth: 720, lineHeight: 1.6, opacity: 0.85, marginTop: 0 }}>
          {t.payments.checkoutTestIntro}
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 14 }}>
          <strong>
            {checkoutTest.enabled
              ? t.payments.checkoutTestOn
              : t.payments.checkoutTestOff}
          </strong>
          {" · "}
          {t.payments.checkoutTestSku}: {checkoutTest.sku}
          {" · "}
          {formatVnd(
            checkoutTest.price || CHECKOUT_TEST_PRODUCT_PRICE_VND,
            locale,
          )}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {checkoutTest.enabled ? (
            <>
              <form action={setCheckoutTestProductAction}>
                <input type="hidden" name="enabled" value="0" />
                <button type="submit" className="admin-btn secondary">
                  {t.payments.checkoutTestDisable}
                </button>
              </form>
              <Link
                href={`/${locale}/shop/${checkoutTest.slug}`}
                className="admin-btn"
              >
                {t.payments.checkoutTestOpen}
              </Link>
            </>
          ) : (
            <form action={setCheckoutTestProductAction}>
              <input type="hidden" name="enabled" value="1" />
              <button type="submit" className="admin-btn">
                {t.payments.checkoutTestEnable}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "serif", fontSize: 24, marginTop: 0 }}>
          {t.payments.providers}
        </h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
          <li>
            VietQR — {t.payments.needsVerifiedAccount}
          </li>
          <li>
            payOS —{" "}
            {payosReady
              ? t.payments.payosConfigured
              : t.payments.payosMissing}
          </li>
          <li>{t.payments.comingSoonNote}</li>
        </ul>
      </div>

      <h2 style={{ fontFamily: "serif", fontSize: 28, marginBottom: 12 }}>
        {t.payments.methodsTitle}
      </h2>
      <div className="admin-pay-methods">
        {methods.map((m) => (
          <form
            key={m.id}
            action={savePaymentMethodSettingsAction}
            className="admin-card admin-pay-method"
          >
            <input type="hidden" name="methodId" value={m.id} />
            <div className="admin-pay-method-head">
              <strong>
                {m.nameEn}
                <span> · {m.id}</span>
              </strong>
              <em>
                {m.selectable
                  ? t.payments.selectable
                  : m.comingSoon
                    ? t.payments.comingSoon
                    : t.payments.notSelectable}
                {m.reason ? ` (${m.reason})` : ""}
              </em>
            </div>
            <div className="admin-pay-method-row">
              <label className="admin-pay-toggle">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={m.enabled}
                />
                {t.common.active}
              </label>
              <label className="admin-pay-toggle">
                <input
                  type="checkbox"
                  name="comingSoon"
                  defaultChecked={m.comingSoon}
                />
                {t.payments.comingSoon}
              </label>
              <label className="admin-pay-sort">
                <span>{t.payments.sortOrder}</span>
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={m.sortOrder}
                />
              </label>
              <button type="submit" className="admin-btn admin-btn-sm">
                {t.common.save}
              </button>
            </div>
          </form>
        ))}
      </div>

      <h2 style={{ fontFamily: "serif", fontSize: 28, marginBottom: 12 }}>
        {t.payments.accountsTitle}
      </h2>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 640, marginBottom: 16 }}>
        {t.payments.accountsIntro}
      </p>

      <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {accounts.map((a) => (
          <form
            key={a.id}
            action={savePaymentAccountAction}
            className="admin-card"
            style={{ maxWidth: 820 }}
          >
            <input type="hidden" name="id" value={a.id} />
            <AccountFields
              t={t}
              cities={cities}
              branches={branches}
              defaults={a}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button type="submit" className="admin-btn">
                {t.common.save}
              </button>
              <button
                type="submit"
                formAction={deletePaymentAccountAction}
                className="admin-btn secondary"
              >
                {t.payments.deactivate}
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        action={savePaymentAccountAction}
        className="admin-card"
        style={{ maxWidth: 820 }}
      >
        <h3 style={{ marginTop: 0 }}>{t.payments.addAccount}</h3>
        <AccountFields t={t} cities={cities} branches={branches} />
        <button type="submit" className="admin-btn" style={{ marginTop: 12 }}>
          {t.common.add}
        </button>
      </form>
    </AdminShell>
  );
}

function AccountFields({
  t,
  cities,
  branches,
  defaults,
}: {
  t: Awaited<ReturnType<typeof getAdminT>>["t"];
  cities: Array<{ slug: string; nameEn: string }>;
  branches: Array<{ id: string; nameEn: string; city: { nameEn: string } }>;
  defaults?: {
    label: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    holderType: string;
    citySlug: string | null;
    branchId: string | null;
    isDefault: boolean;
    active: boolean;
    verifiedAt: Date | null;
    internalNote: string | null;
  };
}) {
  return (
    <div className="admin-grid-2">
      <label className="admin-field">
        <span>{t.payments.label}</span>
        <input name="label" required defaultValue={defaults?.label || ""} />
      </label>
      <label className="admin-field">
        <span>{t.payments.bankCode}</span>
        <input
          name="bankCode"
          required
          placeholder="970415"
          defaultValue={defaults?.bankCode || ""}
        />
      </label>
      <label className="admin-field">
        <span>{t.payments.bankName}</span>
        <input
          name="bankName"
          required
          placeholder="VietinBank"
          defaultValue={defaults?.bankName || ""}
        />
      </label>
      <label className="admin-field">
        <span>{t.payments.accountNumber}</span>
        <input
          name="accountNumber"
          required
          defaultValue={defaults?.accountNumber || ""}
        />
      </label>
      <label className="admin-field">
        <span>{t.payments.accountName}</span>
        <input
          name="accountName"
          required
          defaultValue={defaults?.accountName || ""}
        />
      </label>
      <label className="admin-field">
        <span>{t.payments.holderType}</span>
        <select name="holderType" defaultValue={defaults?.holderType || "household"}>
          <option value="household">household</option>
          <option value="business">business</option>
          <option value="personal">personal</option>
        </select>
      </label>
      <label className="admin-field">
        <span>{t.payments.city}</span>
        <select name="citySlug" defaultValue={defaults?.citySlug || ""}>
          <option value="">{t.payments.allCities}</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>{t.payments.branch}</span>
        <select name="branchId" defaultValue={defaults?.branchId || ""}>
          <option value="">{t.payments.noBranch}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.city.nameEn} — {b.nameEn}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>{t.payments.internalNote}</span>
        <input name="internalNote" defaultValue={defaults?.internalNote || ""} />
      </label>
      <label className="admin-field">
        <span>
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={defaults?.isDefault}
          />{" "}
          {t.payments.isDefault}
        </span>
      </label>
      <label className="admin-field">
        <span>
          <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} />{" "}
          {t.common.active}
        </span>
      </label>
      <label className="admin-field">
        <span>
          <input
            type="checkbox"
            name="verified"
            defaultChecked={Boolean(defaults?.verifiedAt)}
          />{" "}
          {t.payments.verified}
        </span>
      </label>
    </div>
  );
}
