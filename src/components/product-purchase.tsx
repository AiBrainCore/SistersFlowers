"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Product } from "@/data/products";
import { formatVnd } from "@/data/products";
import type { AddonPublic } from "@/lib/addons";
import { useCart } from "@/context/cart-context";
import { SalePrice } from "@/components/sale-price";
import {
  defaultSize,
  hasAnySizePrice,
  isOnSale,
  offeredSizes,
  productUsesSizeLadder,
  resolveCompareAt,
  resolveSizePrice,
  sizeLabel,
  type ProductSizeId,
} from "@/lib/product-sizes";

export function ProductPurchase({
  product,
  locale,
  dictionary,
  addons,
  citySlug,
}: {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
  addons: AddonPublic[];
  citySlug?: string;
}) {
  const { addProduct } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const citySizes = product.cityStock?.find(
    (s) => s.citySlug === citySlug,
  )?.sizePrices;
  const allowLadder = productUsesSizeLadder(product.productType);
  const sizes = allowLadder
    ? offeredSizes(product.sizePrices, citySizes)
    : [];
  const sized =
    allowLadder &&
    (hasAnySizePrice(product.sizePrices) ||
      Boolean(citySizes && hasAnySizePrice(citySizes)));
  const [size, setSize] = useState<ProductSizeId | null>(
    allowLadder ? defaultSize(product.sizePrices, citySizes) : null,
  );

  const unitPrice = size
    ? resolveSizePrice(size, product.sizePrices, citySizes, product.price)
    : product.price;
  const unitCompareAt = resolveCompareAt(
    size,
    product.compareAtPrices,
    product.compareAtPrice,
  );

  const extras = useMemo(
    () => addons.filter((a) => a.kind === "extra"),
    [addons],
  );
  const partners = useMemo(
    () => addons.filter((a) => a.kind === "partner"),
    [addons],
  );

  const selectedList = useMemo(() => {
    return addons
      .filter((addon) => selected[addon.id])
      .map((addon) => ({
        addon,
        note: notes[addon.id],
      }));
  }, [addons, selected, notes]);

  const extrasTotal = selectedList.reduce(
    (sum, item) => sum + item.addon.price,
    0,
  );
  const total = unitPrice + extrasTotal;

  function toggle(id: string) {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  }

  function renderGroup(title: string, hint: string, list: AddonPublic[]) {
    if (!list.length) return null;
    return (
      <div>
        <p className="text-[11px] tracking-[0.18em] text-moss uppercase">
          {title}
        </p>
        <p className="mt-2 text-sm text-moss">{hint}</p>
        <ul className="mt-4 space-y-3">
          {list.map((addon) => {
            const on = Boolean(selected[addon.id]);
            const name = locale === "vi" ? addon.nameVi : addon.nameEn;
            const description =
              locale === "vi" ? addon.descriptionVi : addon.descriptionEn;
            return (
              <li key={addon.id}>
                <button
                  type="button"
                  onClick={() => toggle(addon.id)}
                  className={`flex min-h-14 w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition ${
                    on
                      ? "border-citrus/40 bg-citrus/10 shadow-[0_8px_24px_rgba(176,84,44,0.12)]"
                      : "glass border-forest/10 hover:border-citrus/30"
                  }`}
                >
                  <span>
                    <span className="block text-sm text-forest">{name}</span>
                    {addon.kind === "partner" && addon.partnerName ? (
                      <span className="mt-1 block text-[11px] text-moss">
                        {addon.partnerName}
                      </span>
                    ) : null}
                    {description ? (
                      <span className="mt-1 block text-xs text-moss">
                        {description}
                      </span>
                    ) : null}
                    {addon.kind === "partner" ? (
                      <span className="mt-1 block text-[11px] text-moss">
                        {dictionary.product.voucherValidDays.replace(
                          "{days}",
                          String(addon.validityDays || 90),
                        )}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm text-forest">
                    +{formatVnd(addon.price, locale)}
                  </span>
                </button>
                {on &&
                addon.requiresNote &&
                addon.slug !== "handwritten-card" ? (
                  <input
                    type="text"
                    value={notes[addon.id] || ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [addon.id]: event.target.value,
                      }))
                    }
                    placeholder={dictionary.product.addonNotePlaceholder}
                    className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-citrus"
                  />
                ) : null}
                {on && addon.slug === "handwritten-card" ? (
                  <p className="mt-2 text-xs leading-5 text-moss">
                    {dictionary.product.handwrittenCardCheckoutHint}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {sized && sizes.length ? (
        <div>
          <p className="text-[11px] tracking-[0.18em] text-moss uppercase">
            {dictionary.product.sizeLabel}
          </p>
          <div
            className={`mt-3 grid gap-2 ${
              sizes.length >= 3
                ? "grid-cols-3"
                : sizes.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
            }`}
          >
            {sizes.map((id) => {
              const price = resolveSizePrice(
                id,
                product.sizePrices,
                citySizes,
                product.price,
              );
              const compareAt = resolveCompareAt(
                id,
                product.compareAtPrices,
                product.compareAtPrice,
              );
              const on = size === id;
              const sale = isOnSale(price, compareAt);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSize(id)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-2.5 text-center transition ${
                    on
                      ? "border-citrus bg-citrus text-ivory shadow-[0_8px_20px_rgba(176,84,44,0.16)]"
                      : "border-forest/15 bg-white text-forest hover:border-citrus/40"
                  }`}
                >
                  <span className="text-[12px] font-medium leading-tight tracking-wide">
                    {sizeLabel(id, locale)}
                  </span>
                  {sale ? (
                    <span
                      className={`text-[11px] leading-tight line-through ${
                        on ? "text-ivory/75" : "text-moss/80"
                      }`}
                    >
                      {formatVnd(compareAt!, locale)}
                    </span>
                  ) : null}
                  <span
                    className={`text-[12px] leading-tight tabular-nums ${
                      on ? "text-ivory" : "text-citrus"
                    }`}
                  >
                    {formatVnd(price, locale)}
                  </span>
                </button>
              );
            })}
          </div>
          {size && product.sizeNotes?.[size]?.[locale]?.trim() ? (
            <p className="mt-2 text-sm text-moss">
              {product.sizeNotes[size]![locale]}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-moss">
            {dictionary.product.customSizeHint}{" "}
            <Link
              href={`/${locale}/custom`}
              className="text-citrus underline-offset-2 hover:underline"
            >
              {dictionary.product.customSizeCta}
            </Link>
          </p>
        </div>
      ) : null}

      {renderGroup(
        dictionary.product.addonsTitle,
        dictionary.product.addonsHint,
        extras,
      )}
      {renderGroup(
        dictionary.product.partnersTitle,
        dictionary.product.partnersHint,
        partners,
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.14em] text-moss uppercase">
            {extrasTotal > 0
              ? dictionary.product.withExtras
              : dictionary.product.totalLabel}
          </p>
          {extrasTotal === 0 && isOnSale(unitPrice, unitCompareAt) ? (
            <div className="mt-1">
              <SalePrice
                price={unitPrice}
                compareAt={unitCompareAt}
                locale={locale}
                size="lg"
              />
            </div>
          ) : (
            <p className="serif mt-1 text-2xl text-citrus tabular-nums sm:text-3xl">
              {formatVnd(total, locale)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            addProduct(product, locale, selectedList, {
              size: size || undefined,
              unitPrice,
            });
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1600);
          }}
          className="min-h-12 shrink-0 rounded-full bg-citrus px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase transition hover:bg-citrus/90"
        >
          {added ? dictionary.product.added : dictionary.product.add}
        </button>
      </div>
    </div>
  );
}
