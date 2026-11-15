import type { AdminDictionary, AdminLocale } from "@/i18n/admin-dictionaries";
import {
  bulkClearDiscountsAction,
  bulkDiscountPricesAction,
  bulkMarkupPricesAction,
  bulkSetAbsolutePricesAction,
  bulkSetFixedPriceAction,
} from "@/app/admin/actions";
import {
  DEFAULT_FIXED_PRICES,
  DEFAULT_SIZE_PRICES,
  productUsesSizeLadder,
} from "@/lib/product-sizes";
import { PRODUCT_TYPES } from "@/lib/product-types";

function TypeSelect({
  t,
  locale,
  name = "productType",
  defaultValue = "all",
  includeAll = true,
  onlyFixed = false,
}: {
  t: AdminDictionary;
  locale: AdminLocale;
  name?: string;
  defaultValue?: string;
  includeAll?: boolean;
  onlyFixed?: boolean;
}) {
  const types = PRODUCT_TYPES.filter((row) =>
    onlyFixed ? !productUsesSizeLadder(row.slug) : true,
  );
  return (
    <label className="admin-filter-field">
      <span>{t.products.bulkType}</span>
      <select name={name} defaultValue={defaultValue} required={onlyFixed}>
        {includeAll ? (
          <option value="all">{t.products.bulkTypeAll}</option>
        ) : null}
        {types.map((row) => (
          <option key={row.slug} value={row.slug}>
            {locale === "vi" ? row.nameVi : row.nameEn}
          </option>
        ))}
      </select>
    </label>
  );
}

function PublishScopeSelect({ t }: { t: AdminDictionary }) {
  return (
    <label className="admin-filter-field">
      <span>{t.products.bulkScope}</span>
      <select name="scope" defaultValue="all">
        <option value="all">{t.products.filterAll}</option>
        <option value="published">{t.common.published}</option>
        <option value="hidden">{t.common.hidden}</option>
      </select>
    </label>
  );
}

export function ProductsBulkPricing({
  t,
  locale,
  returnQ,
  returnStatus,
  returnType,
  notice,
}: {
  t: AdminDictionary;
  locale: AdminLocale;
  returnQ: string;
  returnStatus: string;
  returnType?: string;
  notice?: string | null;
}) {
  const hidden = (
    <>
      <input type="hidden" name="returnQ" value={returnQ} />
      <input type="hidden" name="returnStatus" value={returnStatus} />
      {returnType ? (
        <input type="hidden" name="returnType" value={returnType} />
      ) : null}
    </>
  );

  const defaultFixedType =
    returnType &&
    PRODUCT_TYPES.some(
      (row) => row.slug === returnType && !productUsesSizeLadder(row.slug),
    )
      ? returnType
      : "flower-basket";
  const defaultFixedPrice =
    DEFAULT_FIXED_PRICES[
      defaultFixedType as keyof typeof DEFAULT_FIXED_PRICES
    ] ?? 600_000;

  return (
    <section className="admin-bulk-panel">
      <h2 className="admin-bulk-title">{t.products.bulkTitle}</h2>
      <p className="admin-bulk-hint">{t.products.bulkHint}</p>
      {notice ? <p className="admin-products-saved">{notice}</p> : null}

      <div className="admin-bulk-grid">
        <form action={bulkSetAbsolutePricesAction} className="admin-bulk-card">
          {hidden}
          <input type="hidden" name="productType" value="bouquet" />
          <h3>{t.products.bulkAbsoluteTitle}</h3>
          <p>{t.products.bulkAbsoluteBody}</p>
          <p className="admin-bulk-type-note">{t.products.bulkBouquetOnly}</p>
          <div className="admin-bulk-size-inputs">
            <label>
              <span>S</span>
              <input
                name="bulkSm"
                type="number"
                min={1000}
                step={1000}
                defaultValue={DEFAULT_SIZE_PRICES.sm}
                required
              />
            </label>
            <label>
              <span>M</span>
              <input
                name="bulkMd"
                type="number"
                min={1000}
                step={1000}
                defaultValue={DEFAULT_SIZE_PRICES.md}
                required
              />
            </label>
            <label>
              <span>L</span>
              <input
                name="bulkLg"
                type="number"
                min={1000}
                step={1000}
                defaultValue={DEFAULT_SIZE_PRICES.lg}
                required
              />
            </label>
          </div>
          <label className="admin-sell-chip">
            <input type="checkbox" name="clearWas" defaultChecked />
            <span>{t.products.bulkClearWas}</span>
          </label>
          <PublishScopeSelect t={t} />
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkAbsoluteCta}
          </button>
        </form>

        <form action={bulkSetFixedPriceAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkFixedTitle}</h3>
          <p>{t.products.bulkFixedBody}</p>
          <TypeSelect
            t={t}
            locale={locale}
            defaultValue={defaultFixedType}
            includeAll={false}
            onlyFixed
          />
          <label className="admin-filter-field">
            <span>{t.products.saleShort}</span>
            <input
              name="bulkFixedPrice"
              type="number"
              min={1000}
              step={1000}
              defaultValue={defaultFixedPrice}
              required
            />
          </label>
          <label className="admin-sell-chip">
            <input type="checkbox" name="clearWas" defaultChecked />
            <span>{t.products.bulkClearWas}</span>
          </label>
          <PublishScopeSelect t={t} />
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkFixedCta}
          </button>
        </form>

        <form action={bulkMarkupPricesAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkMarkupTitle}</h3>
          <p>{t.products.bulkMarkupBody}</p>
          <label className="admin-filter-field">
            <span>{t.products.bulkPercent}</span>
            <input
              name="markupPercent"
              type="number"
              step={0.5}
              defaultValue={15}
              required
            />
          </label>
          <TypeSelect
            t={t}
            locale={locale}
            defaultValue={returnType || "all"}
          />
          <PublishScopeSelect t={t} />
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkMarkupCta}
          </button>
        </form>

        <form action={bulkDiscountPricesAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkDiscountTitle}</h3>
          <p>{t.products.bulkDiscountBody}</p>
          <label className="admin-filter-field">
            <span>{t.products.bulkPercent}</span>
            <input
              name="discountPercent"
              type="number"
              min={1}
              max={99}
              step={1}
              defaultValue={15}
              required
            />
          </label>
          <TypeSelect
            t={t}
            locale={locale}
            defaultValue={returnType || "all"}
          />
          <PublishScopeSelect t={t} />
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkDiscountCta}
          </button>
        </form>

        <form action={bulkClearDiscountsAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkClearTitle}</h3>
          <p>{t.products.bulkClearBody}</p>
          <TypeSelect
            t={t}
            locale={locale}
            defaultValue={returnType || "all"}
          />
          <PublishScopeSelect t={t} />
          <button type="submit" className="admin-btn secondary admin-btn-sm">
            {t.products.bulkClearCta}
          </button>
        </form>
      </div>
    </section>
  );
}
