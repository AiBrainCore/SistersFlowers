"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import {
  activeBuilderCatalog,
  calcBuilderBreakdown,
  DEFAULT_BUILDER_CATALOG,
  optionLabel,
  previewImageFor,
  type BuilderCatalog,
  type BuilderLocationId,
  type BuilderOption,
  DEFAULT_BUILDER_LOCATION,
} from "@/data/bouquet-builder";
import { InquiryForm } from "@/components/inquiry-form";
import { useLocation } from "@/context/location-context";

type Labels = Dictionary["builder"];

function priceLabel(option: BuilderOption, locale: Locale): string | null {
  if (option.price <= 0) return null;
  return `+${formatVnd(option.price, locale)}`;
}

export function BouquetBuilder({
  locale,
  dictionary,
  catalog = DEFAULT_BUILDER_CATALOG,
  locationId = DEFAULT_BUILDER_LOCATION,
}: {
  locale: Locale;
  dictionary: Dictionary;
  catalog?: BuilderCatalog;
  /** Fallback when LocationProvider is unavailable */
  locationId?: BuilderLocationId;
}) {
  const { activeCity } = useLocation();
  const activeLocationId: BuilderLocationId =
    activeCity.slug === "danang" || activeCity.slug === "dalat"
      ? activeCity.slug
      : locationId;
  void activeLocationId;

  const active = useMemo(() => activeBuilderCatalog(catalog), [catalog]);
  const t = dictionary.builder;

  const defaultSizeId = active.sizes[1]?.id ?? active.sizes[0]?.id ?? "classic";
  const defaultMoodId = active.moods[0]?.id ?? "soft-blush";
  const defaultWrapId = active.wraps[0]?.id ?? "kraft";
  const defaultRibbonId = active.ribbons[0]?.id ?? "satin";

  const [sizeId, setSizeId] = useState(defaultSizeId);
  const [moodId, setMoodId] = useState(defaultMoodId);
  const [wrapId, setWrapId] = useState(defaultWrapId);
  const [ribbonId, setRibbonId] = useState(defaultRibbonId);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cardNote, setCardNote] = useState("");

  const label = (option: BuilderOption | undefined, id: string) =>
    optionLabel(option, locale, id);

  const find = (list: BuilderOption[], id: string) =>
    list.find((o) => o.id === id);

  const selection = useMemo(
    () => ({ sizeId, moodId, wrapId, ribbonId, addonIds }),
    [sizeId, moodId, wrapId, ribbonId, addonIds],
  );

  const breakdown = useMemo(
    () => calcBuilderBreakdown(selection, catalog),
    [selection, catalog],
  );

  const previewSrc = previewImageFor(selection, catalog);
  const wrapSwatch = find(active.wraps, wrapId)?.swatch ?? "#c4a574";
  const moodSwatch = find(active.moods, moodId)?.swatch ?? "#e7c6c4";

  const summaryLines = useMemo(() => {
    const addons =
      addonIds.length > 0
        ? addonIds
            .map((id) => label(find(active.addons, id), id))
            .join(", ")
        : t.none;
    const lines = [
      `${t.steps.size}: ${label(find(active.sizes, sizeId), sizeId)}`,
      `${t.steps.mood}: ${label(find(active.moods, moodId), moodId)}`,
      `${t.steps.wrap}: ${label(find(active.wraps, wrapId), wrapId)}`,
      `${t.steps.ribbon}: ${label(find(active.ribbons, ribbonId), ribbonId)}`,
      `${t.steps.addons}: ${addons}`,
      `${t.estimate}: ${formatVnd(breakdown.subtotal, locale)}`,
    ];
    if (addonIds.includes("card") && cardNote.trim()) {
      lines.splice(5, 0, `Card note: ${cardNote.trim()}`);
    }
    return lines;
  }, [
    active,
    addonIds,
    breakdown.subtotal,
    cardNote,
    locale,
    moodId,
    ribbonId,
    sizeId,
    t,
    wrapId,
  ]);

  const composedMessage = summaryLines.join("\n");

  function toggleAddon(id: string) {
    setAddonIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function openRequest() {
    setShowForm(true);
    window.setTimeout(() => {
      document
        .getElementById("custom-request")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const pricePanel = (
    <PriceBreakdown
      t={t}
      locale={locale}
      breakdown={breakdown}
      optionLabel={(id) =>
        label(
          find(
            [
              ...active.sizes,
              ...active.moods,
              ...active.wraps,
              ...active.ribbons,
              ...active.addons,
            ],
            id,
          ),
          id,
        )
      }
    />
  );

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
                <Choice
                  key={option.id}
                  selected={sizeId === option.id}
                  onClick={() => setSizeId(option.id)}
                  title={label(option, option.id)}
                  price={formatVnd(option.price, locale)}
                  swatch={option.swatch}
                  compact
                />
              ))}
            </div>
          </Step>

          <Step title={t.steps.mood} hint={t.hints.mood}>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {active.moods.map((option) => (
                <Choice
                  key={option.id}
                  selected={moodId === option.id}
                  onClick={() => setMoodId(option.id)}
                  title={label(option, option.id)}
                  price={priceLabel(option, locale)}
                  swatch={option.swatch}
                  image={option.image}
                />
              ))}
            </div>
          </Step>

          <Step title={t.steps.wrap} hint={t.hints.wrap}>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {active.wraps.map((option) => (
                <Choice
                  key={option.id}
                  selected={wrapId === option.id}
                  onClick={() => setWrapId(option.id)}
                  title={label(option, option.id)}
                  price={priceLabel(option, locale)}
                  swatch={option.swatch}
                  image={option.image}
                />
              ))}
            </div>
          </Step>

          <Step title={t.steps.ribbon} hint={t.hints.ribbon}>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {active.ribbons.map((option) => (
                <Choice
                  key={option.id}
                  selected={ribbonId === option.id}
                  onClick={() => setRibbonId(option.id)}
                  title={label(option, option.id)}
                  price={priceLabel(option, locale)}
                  swatch={option.swatch}
                  compact
                />
              ))}
            </div>
          </Step>

          <Step title={t.steps.addons} hint={t.hints.addons}>
            <div className="grid gap-3 sm:grid-cols-2">
              {active.addons.map((option) => {
                const selected = addonIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleAddon(option.id)}
                    className={`group flex min-h-[4.5rem] items-stretch gap-3 overflow-hidden rounded-2xl border text-left transition ${
                      selected
                        ? "border-citrus/50 bg-citrus/5 shadow-[0_0_0_1px_rgba(176,84,44,0.25)]"
                        : "border-forest/10 bg-white/60 hover:border-citrus/30"
                    }`}
                  >
                    <span className="relative h-auto w-20 shrink-0 self-stretch overflow-hidden bg-cream">
                      {option.image ? (
                        <Image
                          src={option.image}
                          alt=""
                          fill
                          className="object-cover object-[center_25%]"
                          sizes="80px"
                        />
                      ) : null}
                    </span>
                    <span className="flex flex-1 items-center justify-between gap-2 py-3 pr-3">
                      <span>
                        <span className="block text-sm text-forest">
                          {label(option, option.id)}
                        </span>
                        <span className="mt-1 block text-xs text-moss">
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
                    </span>
                  </button>
                );
              })}
            </div>
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
        </div>

        <aside className="lg:sticky lg:top-28 h-fit space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-forest/10 bg-[linear-gradient(165deg,#ffffff_0%,#fff7f1_55%,#f3e4d8_100%)] shadow-[0_20px_50px_rgba(44,41,38,0.08)]">
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/6]">
              <Image
                key={previewSrc}
                src={previewSrc}
                alt=""
                fill
                className="object-cover object-[center_18%] transition duration-500"
                sizes="(min-width: 1024px) 40vw, 100vw"
                priority
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(160deg, ${wrapSwatch}55 0%, transparent 42%, ${moodSwatch}40 100%)`,
                }}
              />
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
                <p className="glass-premium rounded-full px-3 py-1.5 text-[10px] tracking-[0.16em] text-moss uppercase">
                  {t.preview}
                </p>
              </div>
              {addonIds.length > 0 ? (
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {breakdown.addons.map((addon) => (
                    <span
                      key={addon.id}
                      className="relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-paper/80 shadow-md"
                    >
                      {addon.image ? (
                        <Image
                          src={addon.image}
                          alt={label(addon, addon.id)}
                          fill
                          className="object-cover object-[center_25%]"
                          sizes="48px"
                        />
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div>
                <p className="serif text-2xl text-forest sm:text-3xl">
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
                  {t.steps.addons}:{" "}
                  {addonIds.length
                    ? addonIds
                        .map((id) => label(find(active.addons, id), id))
                        .join(", ")
                    : t.none}
                </li>
              </ul>

              {pricePanel}

              {t.deliveryNote ? (
                <p className="text-xs leading-6 text-moss">{t.deliveryNote}</p>
              ) : null}

              <button
                type="button"
                onClick={openRequest}
                className="hidden w-full min-h-12 rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-ivory uppercase transition hover:bg-citrus/90 lg:inline-flex lg:items-center lg:justify-center"
              >
                {t.cta}
              </button>
            </div>
          </div>

          {showForm ? (
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
            className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-citrus px-5 text-[11px] tracking-[0.14em] text-ivory uppercase"
          >
            {t.stickyCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceBreakdown({
  t,
  locale,
  breakdown,
  optionLabel,
}: {
  t: Labels;
  locale: Locale;
  breakdown: ReturnType<typeof calcBuilderBreakdown>;
  optionLabel: (id: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-sm text-moss">
        <span>{t.basePrice}</span>
        <span>{formatVnd(breakdown.sizePrice, locale)}</span>
      </div>
      {breakdown.moodPrice > 0 ||
      breakdown.wrapPrice > 0 ||
      breakdown.ribbonPrice > 0 ? (
        <div className="mt-2 space-y-1 border-t border-forest/8 pt-2 text-sm text-moss">
          {breakdown.moodPrice > 0 && breakdown.mood ? (
            <div className="flex justify-between gap-3">
              <span>{optionLabel(breakdown.mood.id)}</span>
              <span>+{formatVnd(breakdown.moodPrice, locale)}</span>
            </div>
          ) : null}
          {breakdown.wrapPrice > 0 && breakdown.wrap ? (
            <div className="flex justify-between gap-3">
              <span>{optionLabel(breakdown.wrap.id)}</span>
              <span>+{formatVnd(breakdown.wrapPrice, locale)}</span>
            </div>
          ) : null}
          {breakdown.ribbonPrice > 0 && breakdown.ribbon ? (
            <div className="flex justify-between gap-3">
              <span>{optionLabel(breakdown.ribbon.id)}</span>
              <span>+{formatVnd(breakdown.ribbonPrice, locale)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {breakdown.addons.length > 0 ? (
        <div className="mt-2 space-y-1 border-t border-forest/8 pt-2 text-sm text-moss">
          {breakdown.addons.map((addon) => (
            <div key={addon.id} className="flex justify-between gap-3">
              <span>{optionLabel(addon.id)}</span>
              <span>+{formatVnd(addon.price, locale)}</span>
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

function Choice({
  selected,
  onClick,
  title,
  price,
  swatch,
  image,
  compact = false,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  price: string | null;
  swatch?: string;
  image?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 ${
        selected
          ? "border-citrus/55 bg-citrus/5 shadow-[0_0_0_1px_rgba(176,84,44,0.28)]"
          : "border-forest/10 bg-white/60 hover:border-citrus/30"
      }`}
    >
      {image ? (
        <span className="relative block aspect-[4/5] w-full overflow-hidden bg-cream sm:aspect-[5/6]">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover object-[center_18%]"
            sizes="(min-width: 640px) 20vw, 45vw"
          />
          {swatch ? (
            <span
              className="absolute bottom-2 left-2 h-6 w-6 rounded-full border border-white/70 shadow"
              style={{ background: swatch }}
            />
          ) : null}
        </span>
      ) : swatch ? (
        <span
          className={`flex items-center gap-2.5 ${compact ? "px-2.5 pt-3 sm:px-3 sm:pt-3.5" : "px-4 pt-4"}`}
        >
          <span
            className={`block rounded-full border border-forest/10 ${compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-9 w-9"}`}
            style={{ background: swatch }}
          />
        </span>
      ) : null}
      <span
        className={`block ${compact ? "px-2.5 pb-3 pt-2 sm:px-3" : "px-4 pb-4 pt-3"}`}
      >
        <span
          className={`block text-forest ${compact ? "text-[12px] leading-snug sm:text-sm" : "text-sm"}`}
        >
          {title}
        </span>
        {price ? (
          <span
            className={`mt-1 block text-moss ${compact ? "text-[11px]" : "text-xs"}`}
          >
            {price}
          </span>
        ) : null}
      </span>
    </button>
  );
}
