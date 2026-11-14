import type { AdminDictionary } from "@/i18n/admin-dictionaries";
import {
  bulkClearDiscountsAction,
  bulkDiscountPricesAction,
  bulkMarkupPricesAction,
  bulkSetAbsolutePricesAction,
  bulkSetDefaultSizeLadderAction,
} from "@/app/admin/actions";
import { DEFAULT_SIZE_PRICES } from "@/lib/product-sizes";

export function ProductsBulkPricing({
  t,
  returnQ,
  returnStatus,
  notice,
}: {
  t: AdminDictionary;
  returnQ: string;
  returnStatus: string;
  notice?: string | null;
}) {
  const hidden = (
    <>
      <input type="hidden" name="returnQ" value={returnQ} />
      <input type="hidden" name="returnStatus" value={returnStatus} />
    </>
  );

  return (
    <section className="admin-bulk-panel">
      <h2 className="admin-bulk-title">{t.products.bulkTitle}</h2>
      <p className="admin-bulk-hint">{t.products.bulkHint}</p>
      {notice ? <p className="admin-products-saved">{notice}</p> : null}

      <div className="admin-bulk-grid">
        <form action={bulkSetDefaultSizeLadderAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkLadderTitle}</h3>
          <p>
            S {DEFAULT_SIZE_PRICES.sm.toLocaleString("en-US")} · M{" "}
            {DEFAULT_SIZE_PRICES.md.toLocaleString("en-US")} · L{" "}
            {DEFAULT_SIZE_PRICES.lg.toLocaleString("en-US")} — {t.products.bulkLadderBody}
          </p>
          <label className="admin-filter-field">
            <span>{t.products.bulkScope}</span>
            <select name="scope" defaultValue="all">
              <option value="all">{t.products.filterAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="hidden">{t.common.hidden}</option>
            </select>
          </label>
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkLadderCta}
          </button>
        </form>

        <form action={bulkSetAbsolutePricesAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkAbsoluteTitle}</h3>
          <p>{t.products.bulkAbsoluteBody}</p>
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
          <label className="admin-filter-field">
            <span>{t.products.bulkScope}</span>
            <select name="scope" defaultValue="all">
              <option value="all">{t.products.filterAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="hidden">{t.common.hidden}</option>
            </select>
          </label>
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkAbsoluteCta}
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
          <label className="admin-filter-field">
            <span>{t.products.bulkScope}</span>
            <select name="scope" defaultValue="all">
              <option value="all">{t.products.filterAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="hidden">{t.common.hidden}</option>
            </select>
          </label>
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
          <label className="admin-filter-field">
            <span>{t.products.bulkScope}</span>
            <select name="scope" defaultValue="all">
              <option value="all">{t.products.filterAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="hidden">{t.common.hidden}</option>
            </select>
          </label>
          <button type="submit" className="admin-btn admin-btn-sm">
            {t.products.bulkDiscountCta}
          </button>
        </form>

        <form action={bulkClearDiscountsAction} className="admin-bulk-card">
          {hidden}
          <h3>{t.products.bulkClearTitle}</h3>
          <p>{t.products.bulkClearBody}</p>
          <label className="admin-filter-field">
            <span>{t.products.bulkScope}</span>
            <select name="scope" defaultValue="all">
              <option value="all">{t.products.filterAll}</option>
              <option value="published">{t.common.published}</option>
              <option value="hidden">{t.common.hidden}</option>
            </select>
          </label>
          <button type="submit" className="admin-btn secondary admin-btn-sm">
            {t.products.bulkClearCta}
          </button>
        </form>
      </div>
    </section>
  );
}
