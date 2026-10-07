"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import {
  builderAddons,
  builderMoods,
  builderRibbons,
  builderSizes,
  builderWraps,
  calcBuilderTotal,
} from "@/data/bouquet-builder";
import { InquiryForm } from "@/components/inquiry-form";

type Labels = Dictionary["builder"];

function labelOf(labels: Labels["options"], id: string) {
  return labels[id as keyof typeof labels] ?? id;
}

export function BouquetBuilder({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.builder;
  const [sizeId, setSizeId] = useState("classic");
  const [moodId, setMoodId] = useState("soft-blush");
  const [wrapId, setWrapId] = useState("kraft");
  const [ribbonId, setRibbonId] = useState("satin");
  const [addonIds, setAddonIds] = useState<string[]>(["card"]);
  const [showForm, setShowForm] = useState(false);

  const total = useMemo(
    () => calcBuilderTotal({ sizeId, moodId, wrapId, ribbonId, addonIds }),
    [sizeId, moodId, wrapId, ribbonId, addonIds],
  );

  const summaryLines = useMemo(() => {
    const addons =
      addonIds.length > 0
        ? addonIds.map((id) => labelOf(t.options, id)).join(", ")
        : t.none;
    return [
      `${t.steps.size}: ${labelOf(t.options, sizeId)}`,
      `${t.steps.mood}: ${labelOf(t.options, moodId)}`,
      `${t.steps.wrap}: ${labelOf(t.options, wrapId)}`,
      `${t.steps.ribbon}: ${labelOf(t.options, ribbonId)}`,
      `${t.steps.addons}: ${addons}`,
      `${t.estimate}: ${formatVnd(total, locale)}`,
    ];
  }, [addonIds, locale, moodId, ribbonId, sizeId, t, total, wrapId]);

  const composedMessage = summaryLines.join("\n");

  function toggleAddon(id: string) {
    setAddonIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  const moodSwatch =
    builderMoods.find((o) => o.id === moodId)?.swatch ?? "#e7c6c4";
  const wrapSwatch =
    builderWraps.find((o) => o.id === wrapId)?.swatch ?? "#c4a574";
  const ribbonSwatch =
    builderRibbons.find((o) => o.id === ribbonId)?.swatch ?? "#c07a76";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-10">
        <Step title={t.steps.size} hint={t.hints.size}>
          <div className="grid gap-3 sm:grid-cols-3">
            {builderSizes.map((option) => (
              <Choice
                key={option.id}
                selected={sizeId === option.id}
                onClick={() => setSizeId(option.id)}
                title={labelOf(t.options, option.id)}
                price={formatVnd(option.price, locale)}
                swatch={option.swatch}
              />
            ))}
          </div>
        </Step>

        <Step title={t.steps.mood} hint={t.hints.mood}>
          <div className="grid gap-3 sm:grid-cols-2">
            {builderMoods.map((option) => (
              <Choice
                key={option.id}
                selected={moodId === option.id}
                onClick={() => setMoodId(option.id)}
                title={labelOf(t.options, option.id)}
                price={
                  option.price === 0
                    ? t.included
                    : `+${formatVnd(option.price, locale)}`
                }
                swatch={option.swatch}
              />
            ))}
          </div>
        </Step>

        <Step title={t.steps.wrap} hint={t.hints.wrap}>
          <div className="grid gap-3 sm:grid-cols-2">
            {builderWraps.map((option) => (
              <Choice
                key={option.id}
                selected={wrapId === option.id}
                onClick={() => setWrapId(option.id)}
                title={labelOf(t.options, option.id)}
                price={
                  option.price === 0
                    ? t.included
                    : `+${formatVnd(option.price, locale)}`
                }
                swatch={option.swatch}
              />
            ))}
          </div>
        </Step>

        <Step title={t.steps.ribbon} hint={t.hints.ribbon}>
          <div className="grid gap-3 sm:grid-cols-3">
            {builderRibbons.map((option) => (
              <Choice
                key={option.id}
                selected={ribbonId === option.id}
                onClick={() => setRibbonId(option.id)}
                title={labelOf(t.options, option.id)}
                price={
                  option.price === 0
                    ? t.included
                    : `+${formatVnd(option.price, locale)}`
                }
                swatch={option.swatch}
              />
            ))}
          </div>
        </Step>

        <Step title={t.steps.addons} hint={t.hints.addons}>
          <div className="grid gap-3 sm:grid-cols-2">
            {builderAddons.map((option) => {
              const selected = addonIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleAddon(option.id)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                    selected
                      ? "border-rose bg-blush/40"
                      : "border-forest/10 bg-white/50 hover:border-forest/25"
                  }`}
                >
                  <span>
                    <span className="block text-sm text-forest">
                      {labelOf(t.options, option.id)}
                    </span>
                    <span className="mt-1 block text-xs text-moss">
                      +{formatVnd(option.price, locale)}
                    </span>
                  </span>
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                      selected
                        ? "bg-forest text-ivory"
                        : "border border-forest/20 text-moss"
                    }`}
                  >
                    {selected ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-24 h-fit">
        <div className="overflow-hidden rounded-[2rem] border border-forest/10 bg-cream/70">
          <div
            className="relative h-44 transition-colors duration-500"
            style={{
              background: `linear-gradient(145deg, ${wrapSwatch} 0%, ${moodSwatch} 55%, ${ribbonSwatch} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.35),transparent_55%)]" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="text-[11px] tracking-[0.2em] text-forest/70 uppercase">
                {t.preview}
              </p>
              <p className="serif mt-1 text-2xl text-forest">
                {labelOf(t.options, sizeId)} · {labelOf(t.options, moodId)}
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            <ul className="space-y-2 text-sm text-moss">
              {summaryLines.slice(0, -1).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-end justify-between border-t border-forest/10 pt-5">
              <div>
                <p className="text-[11px] tracking-[0.16em] text-moss uppercase">
                  {t.estimate}
                </p>
                <p className="serif mt-1 text-3xl text-forest">
                  {formatVnd(total, locale)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-6 text-moss">{t.estimateNote}</p>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                window.setTimeout(() => {
                  document
                    .getElementById("custom-request")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="mt-6 w-full rounded-full bg-forest px-6 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase"
            >
              {t.cta}
            </button>
          </div>
        </div>

        {showForm ? (
          <div id="custom-request" className="mt-8 scroll-mt-24">
            <h3 className="serif text-3xl text-forest">{t.requestTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-moss">{t.requestBody}</p>
            <div className="mt-6">
              <InquiryForm
                dictionary={dictionary}
                variant="custom"
                presetMessage={composedMessage}
                notesLabel={t.extraNotes}
              />
            </div>
          </div>
        ) : null}
      </aside>
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
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  price: string;
  swatch?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? "border-rose bg-blush/35 shadow-[0_0_0_1px_rgba(192,122,118,0.35)]"
          : "border-forest/10 bg-white/50 hover:border-forest/25"
      }`}
    >
      {swatch ? (
        <span
          className="mb-3 block h-8 w-8 rounded-full border border-forest/10"
          style={{ background: swatch }}
        />
      ) : null}
      <span className="block text-sm text-forest">{title}</span>
      <span className="mt-1 block text-xs text-moss">{price}</span>
    </button>
  );
}
