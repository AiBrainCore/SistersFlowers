"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import {
  activeBuilderCatalog,
  buildOrderSnapshot,
  calcBuilderBreakdown,
  DEFAULT_BUILDER_CATALOG,
  optionLabel,
  serializeBuilderQuery,
  type BuilderCatalog,
  type BuilderLocationId,
  type BuilderOption,
  type BuilderSelection,
  DEFAULT_BUILDER_LOCATION,
} from "@/data/bouquet-builder";
import { BouquetPreviewSvg } from "@/components/bouquet-preview-svg";
import { InquiryForm } from "@/components/inquiry-form";
import { useLocation } from "@/context/location-context";
import { cityDisplayName } from "@/lib/storefront";

type Labels = Dictionary["builder"];

export function BouquetBuilder({
  locale,
  dictionary,
  catalog = DEFAULT_BUILDER_CATALOG,
  locationId = DEFAULT_BUILDER_LOCATION,
  initialSelection,
}: {
  locale: Locale;
  dictionary: Dictionary;
  catalog?: BuilderCatalog;
  locationId?: BuilderLocationId;
  initialSelection?: Partial<BuilderSelection>;
}) {
  const { activeCity } = useLocation();
  const activeLocationId: BuilderLocationId =
    activeCity.slug === "danang" || activeCity.slug === "dalat"
      ? activeCity.slug
      : locationId;
  void activeLocationId;

  const active = useMemo(() => activeBuilderCatalog(catalog), [catalog]);
  const t = dictionary.builder;

  const defaultSizeId =
    initialSelection?.sizeId ??
    active.sizes[1]?.id ??
    active.sizes[0]?.id ??
    "classic";
  const defaultMoodId =
    initialSelection?.moodId ?? active.moods[0]?.id ?? "soft-blush";
  const defaultWrapId =
    initialSelection?.wrapId ?? active.wraps[0]?.id ?? "kraft";
  const defaultRibbonId =
    initialSelection?.ribbonId ?? active.ribbons[0]?.id ?? "satin";

  const [sizeId, setSizeId] = useState(defaultSizeId);
  const [moodId, setMoodId] = useState(defaultMoodId);
  const [wrapId, setWrapId] = useState(defaultWrapId);
  const [ribbonId, setRibbonId] = useState(defaultRibbonId);
  const [premiumIds, setPremiumIds] = useState<string[]>(
    initialSelection?.premiumIds ?? [],
  );
  const [addonIds, setAddonIds] = useState<string[]>(
    initialSelection?.addonIds ?? [],
  );
  const [specialRequest, setSpecialRequest] = useState("");
  const [cardNote, setCardNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">(
    "idle",
  );

  const label = (option: BuilderOption | undefined, id: string) =>
    optionLabel(option, locale, id);
  const find = (list: BuilderOption[], id: string) =>
    list.find((o) => o.id === id);

  const selection: BuilderSelection = useMemo(
    () => ({ sizeId, moodId, wrapId, ribbonId, premiumIds, addonIds }),
    [sizeId, moodId, wrapId, ribbonId, premiumIds, addonIds],
  );

  const breakdown = useMemo(
    () => calcBuilderBreakdown(selection, catalog),
    [selection, catalog],
  );

  const moodSwatch = find(active.moods, moodId)?.swatch ?? "#f0d5d2";
  const wrapSwatch = find(active.wraps, wrapId)?.swatch ?? "#c4a574";
  const ribbonSwatch = find(active.ribbons, ribbonId)?.swatch ?? "#c07a76";

  const cityName = cityDisplayName(activeCity, locale);

  const composedMessage = useMemo(() => {
    let snap = buildOrderSnapshot(
      selection,
      catalog,
      locale,
      cityName,
      specialRequest,
    );
    if (addonIds.includes("card") && cardNote.trim()) {
      snap += `\nCard message: ${cardNote.trim()}`;
    }
    return snap;
  }, [
    selection,
    catalog,
    locale,
    cityName,
    specialRequest,
    addonIds,
    cardNote,
  ]);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const id = window.setTimeout(() => setShareStatus("idle"), 2200);
    return () => window.clearTimeout(id);
  }, [shareStatus]);

  function toggleId(
    id: string,
    current: string[],
    set: (next: string[]) => void,
  ) {
    set(
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function openRequest() {
    if (!activeCity.acceptsOrders) return;
    setShowForm(true);
    window.setTimeout(() => {
      document
        .getElementById("custom-request")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const canOrder = activeCity.acceptsOrders;

  async function shareBouquet() {
    const query = serializeBuilderQuery(selection);
    const url = `${window.location.origin}/${locale}/custom?${query}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: dictionary.custom.title,
          text: t.shareText,
          url,
        });
        setShareStatus("shared");
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
    } catch {
      setShareStatus("idle");
    }
  }

  const sizeCols =
    active.sizes.length === 3
      ? "grid-cols-3"
      : active.sizes.length === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2";

  return (
    <div className="relative pb-28 lg:pb-0">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
        <div className="space-y-10">
          <Step title={t.steps.size} hint={t.hints.size}>
            <div className={`grid gap-2 sm:gap-2.5 ${sizeCols}`}>
              {active.sizes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={sizeId === option.id}
                  onClick={() => setSizeId(option.id)}
                  className={`min-h-20 rounded-2xl border px-2.5 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:px-3 ${
                    sizeId === option.id
                      ? "border-citrus/55 bg-citrus/5 shadow-[0_0_0_1px_rgba(176,84,44,0.28)]"
                      : "border-forest/10 bg-white/70 hover:border-citrus/30"
                  }`}
                >
                  <span
                    className="mx-auto mb-2 block h-7 w-7 rounded-full border border-forest/10"
                    style={{ background: option.swatch }}
                  />
                  <span className="block text-[12px] leading-snug text-forest sm:text-sm">
                    {label(option, option.id)}
                  </span>
                  <span className="mt-1 block text-[11px] text-moss">
                    {formatVnd(option.price, locale)}
                  </span>
                </button>
              ))}
            </div>
          </Step>

          <Step title={t.steps.mood} hint={t.hints.mood}>
            <SwatchRow
              options={active.moods}
              selectedId={moodId}
              onSelect={setMoodId}
              locale={locale}
            />
          </Step>

          <Step title={t.steps.wrap} hint={t.hints.wrap}>
            <SwatchRow
              options={active.wraps}
              selectedId={wrapId}
              onSelect={setWrapId}
              locale={locale}
            />
          </Step>

          <Step title={t.steps.ribbon} hint={t.hints.ribbon}>
            <SwatchRow
              options={active.ribbons}
              selectedId={ribbonId}
              onSelect={setRibbonId}
              locale={locale}
            />
          </Step>

          {active.premiums.length > 0 ? (
            <Step title={t.steps.premiums} hint={t.hints.premiums}>
              <ToggleList
                options={active.premiums}
                selectedIds={premiumIds}
                onToggle={(id) => toggleId(id, premiumIds, setPremiumIds)}
                locale={locale}
              />
            </Step>
          ) : null}

          <Step title={t.steps.addons} hint={t.hints.addons}>
            <ToggleList
              options={active.addons}
              selectedIds={addonIds}
              onToggle={(id) => toggleId(id, addonIds, setAddonIds)}
              locale={locale}
            />
            {addonIds.includes("card") ? (
              <label className="mt-4 grid gap-2">
                <span className="text-[11px] tracking-[0.14em] text-moss uppercase">
                  {t.cardMessage}
                </span>
                <textarea
                  value={cardNote}
                  onChange={(e) => setCardNote(e.target.value)}
                  rows={3}
                  placeholder={t.cardMessagePlaceholder}
                  className="min-h-24 rounded-2xl border border-forest/15 bg-white/80 px-4 py-3 text-sm text-forest outline-none focus:border-citrus"
                />
              </label>
            ) : null}
          </Step>

          <Step title={t.steps.special} hint={t.hints.special}>
            <textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              rows={3}
              placeholder={t.specialPlaceholder}
              className="w-full min-h-24 rounded-2xl border border-forest/15 bg-white/80 px-4 py-3 text-sm text-forest outline-none focus:border-citrus"
            />
            <p className="mt-2 text-xs leading-5 text-moss">{t.specialNote}</p>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-28 h-fit space-y-5">
          <div className="overflow-hidden rounded-[1.75rem] border border-forest/10 bg-white/80 shadow-[0_20px_50px_rgba(44,41,38,0.08)]">
            <BouquetPreviewSvg
              mood={moodSwatch}
              wrap={wrapSwatch}
              ribbon={ribbonSwatch}
              className="aspect-[4/5] w-full"
            />
            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div>
                <p className="text-[10px] tracking-[0.16em] text-citrus uppercase">
                  {t.preview}
                </p>
                <p className="serif mt-1 text-2xl text-forest sm:text-3xl">
                  {label(find(active.sizes, sizeId), sizeId)}
                  <span className="text-moss"> · </span>
                  {label(find(active.moods, moodId), moodId)}
                </p>
                <p className="mt-2 text-xs leading-5 text-moss">
                  {t.previewNote}
                </p>
              </div>

              <ul className="space-y-1.5 text-sm text-moss">
                <li>
                  {t.steps.wrap}: {label(find(active.wraps, wrapId), wrapId)}
                </li>
                <li>
                  {t.steps.ribbon}:{" "}
                  {label(find(active.ribbons, ribbonId), ribbonId)}
                </li>
                <li>
                  {t.cityLabel}: {cityName}
                </li>
                <li>
                  {t.steps.premiums}:{" "}
                  {premiumIds.length
                    ? premiumIds
                        .map((id) => label(find(active.premiums, id), id))
                        .join(", ")
                    : t.none}
                </li>
                <li>
                  {t.steps.addons}:{" "}
                  {addonIds.length
                    ? addonIds
                        .map((id) => label(find(active.addons, id), id))
                        .join(", ")
                    : t.none}
                </li>
              </ul>

              <PriceBreakdown t={t} locale={locale} breakdown={breakdown} />

              <p className="text-xs leading-6 text-moss">{t.floristNote}</p>
              {t.deliveryNote ? (
                <p className="text-xs leading-6 text-moss">{t.deliveryNote}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={shareBouquet}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-citrus/40 px-5 text-[11px] tracking-[0.14em] text-citrus uppercase transition hover:bg-citrus/5"
                >
                  {shareStatus === "copied"
                    ? t.shareCopied
                    : shareStatus === "shared"
                      ? t.shareDone
                      : t.share}
                </button>
                <button
                  type="button"
                  onClick={openRequest}
                  disabled={!canOrder}
                  className="hidden min-h-12 flex-1 rounded-full bg-citrus px-5 text-[11px] tracking-[0.14em] text-ivory uppercase transition hover:bg-citrus/90 disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex lg:items-center lg:justify-center"
                >
                  {t.cta}
                </button>
              </div>
              {!canOrder ? (
                <p className="text-xs leading-5 text-moss">{t.cityUnavailable}</p>
              ) : null}
            </div>
          </div>

          {showForm && canOrder ? (
            <div id="custom-request" className="scroll-mt-24">
              <div className="glass-premium rounded-[1.75rem] p-5 sm:p-6">
                <h3 className="serif text-3xl text-forest">{t.requestTitle}</h3>
                <p className="mt-2 text-sm leading-7 text-moss">
                  {t.requestBody}
                </p>
                <div className="mt-6">
                  <InquiryForm
                    dictionary={dictionary}
                    variant="custom"
                    presetMessage={composedMessage}
                    notesLabel={t.extraNotes}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-paper/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.16em] text-moss uppercase">
              {t.estimate}
            </p>
            <p className="serif truncate text-xl text-forest">
              {formatVnd(breakdown.subtotal, locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={openRequest}
            disabled={!canOrder}
            className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-citrus px-5 text-[11px] tracking-[0.14em] text-ivory uppercase disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.stickyCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function SwatchRow({
  options,
  selectedId,
  onSelect,
  locale,
}: {
  options: BuilderOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  locale: Locale;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const selected = selectedId === option.id;
        const name = optionLabel(option, locale, option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-label={name}
            aria-pressed={selected}
            title={name}
            onClick={() => onSelect(option.id)}
            className={`group flex w-[4.75rem] flex-col items-center gap-2 rounded-2xl p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:w-20 ${
              selected ? "bg-citrus/8" : "hover:bg-white/70"
            }`}
          >
            <span
              className={`block h-11 w-11 rounded-full border-2 sm:h-12 sm:w-12 ${
                selected
                  ? "border-citrus shadow-[0_0_0_3px_rgba(194,71,18,0.18)]"
                  : "border-white shadow-[0_0_0_1px_rgba(44,41,38,0.12)]"
              }`}
              style={{ background: option.swatch || "#ddd" }}
            />
            <span className="line-clamp-2 text-center text-[10px] leading-tight text-forest sm:text-[11px]">
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleList({
  options,
  selectedIds,
  onToggle,
  locale,
}: {
  options: BuilderOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  locale: Locale;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((option) => {
        const selected = selectedIds.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(option.id)}
            className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 ${
              selected
                ? "border-citrus/50 bg-citrus/5"
                : "border-forest/10 bg-white/70 hover:border-citrus/30"
            }`}
          >
            <span>
              <span className="block text-sm text-forest">
                {optionLabel(option, locale, option.id)}
              </span>
              <span className="mt-0.5 block text-xs text-moss">
                +{formatVnd(option.price, locale)}
              </span>
            </span>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] ${
                selected
                  ? "bg-citrus text-ivory"
                  : "border border-forest/20 text-moss"
              }`}
            >
              {selected ? "✓" : "+"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PriceBreakdown({
  t,
  locale,
  breakdown,
}: {
  t: Labels;
  locale: Locale;
  breakdown: ReturnType<typeof calcBuilderBreakdown>;
}) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-sm text-moss">
        <span>{t.basePrice}</span>
        <span>{formatVnd(breakdown.sizePrice, locale)}</span>
      </div>
      {breakdown.premiums.length > 0 ? (
        <div className="mt-2 space-y-1 border-t border-forest/8 pt-2 text-sm text-moss">
          {breakdown.premiums.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{optionLabel(item, locale, item.id)}</span>
              <span>+{formatVnd(item.price, locale)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {breakdown.addons.length > 0 ? (
        <div className="mt-2 space-y-1 border-t border-forest/8 pt-2 text-sm text-moss">
          {breakdown.addons.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{optionLabel(item, locale, item.id)}</span>
              <span>+{formatVnd(item.price, locale)}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-forest/10 pt-3">
        <p className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.estimate}
        </p>
        <p className="serif text-3xl text-forest">
          {formatVnd(breakdown.subtotal, locale)}
        </p>
      </div>
    </div>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="serif text-2xl text-forest sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-moss">{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
