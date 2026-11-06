"use client";

import type { Locale } from "@/i18n/config";
import { formatVnd } from "@/data/products";
import type { AddonPublic } from "@/lib/addons";

export function ShopBotExtras({
  locale,
  addons,
  selectedIds,
  onToggle,
  extrasTitle,
  vouchersTitle,
}: {
  locale: Locale;
  addons: AddonPublic[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  extrasTitle: string;
  vouchersTitle: string;
}) {
  const extras = addons.filter((a) => a.kind === "extra");
  const vouchers = addons.filter((a) => a.kind === "partner");

  return (
    <div className="space-y-5">
      {extras.length ? (
        <section>
          <h3 className="text-[11px] tracking-[0.18em] text-moss uppercase">
            {extrasTitle}
          </h3>
          <ul className="mt-2 space-y-2">
            {extras.map((addon) => (
              <AddonRow
                key={addon.id}
                locale={locale}
                addon={addon}
                selected={selectedIds.includes(addon.id)}
                onToggle={() => onToggle(addon.id)}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {vouchers.length ? (
        <section>
          <h3 className="text-[11px] tracking-[0.18em] text-moss uppercase">
            {vouchersTitle}
          </h3>
          <ul className="mt-2 space-y-2">
            {vouchers.map((addon) => (
              <AddonRow
                key={addon.id}
                locale={locale}
                addon={addon}
                selected={selectedIds.includes(addon.id)}
                onToggle={() => onToggle(addon.id)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function AddonRow({
  locale,
  addon,
  selected,
  onToggle,
}: {
  locale: Locale;
  addon: AddonPublic;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = locale === "vi" ? addon.nameVi : addon.nameEn;
  const description =
    locale === "vi" ? addon.descriptionVi : addon.descriptionEn;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
          selected
            ? "border-citrus/50 bg-citrus-soft/30"
            : "border-forest/10 bg-white/70 hover:border-forest/20"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
            selected
              ? "border-citrus bg-citrus text-ivory"
              : "border-forest/25 text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-forest">{name}</span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-5 text-moss">
              {description}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-sm text-citrus">
          {formatVnd(addon.price, locale)}
        </span>
      </button>
    </li>
  );
}
