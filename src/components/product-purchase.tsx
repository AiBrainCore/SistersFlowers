"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Product } from "@/data/products";
import { formatVnd } from "@/data/products";
import type { AddonPublic } from "@/lib/addons";
import { useCart } from "@/context/cart-context";

export function ProductPurchase({
  product,
  locale,
  dictionary,
  addons,
}: {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
  addons: AddonPublic[];
}) {
  const { addProduct } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

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
  const total = product.price + extrasTotal;

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
                  className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    on
                      ? "border-rose bg-blush/35"
                      : "border-forest/10 bg-white/50 hover:border-forest/25"
                  }`}
                >
                  <span>
                    <span className="block text-sm text-forest">{name}</span>
                    {addon.kind === "partner" && addon.partnerName ? (
                      <span className="mt-1 block text-[11px] tracking-[0.08em] text-rose uppercase">
                        {addon.partnerName}
                        {addon.partnerCategory
                          ? ` · ${addon.partnerCategory}`
                          : ""}
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
                {on && addon.requiresNote ? (
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
                    className="mt-2 w-full rounded-full border border-forest/15 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-rose"
                  />
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            addProduct(product, locale, selectedList);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1600);
          }}
          className="rounded-full bg-forest px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase"
        >
          {added ? dictionary.product.added : dictionary.product.add}
        </button>
        {extrasTotal > 0 ? (
          <p className="text-sm text-moss">
            {dictionary.product.withExtras}:{" "}
            <span className="text-forest">{formatVnd(total, locale)}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
