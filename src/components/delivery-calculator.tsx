"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { calcDeliveryFee, type DeliveryConfig, type DeliveryZonePublic } from "@/lib/delivery";

export function DeliveryCalculator({
  locale,
  dictionary,
  config,
  zones,
  compact = false,
  onChange,
  namePrefix = "delivery",
}: {
  locale: Locale;
  dictionary: Dictionary;
  config: DeliveryConfig;
  zones: DeliveryZonePublic[];
  compact?: boolean;
  onChange?: (value: { km: number; fee: number | null; zone: string }) => void;
  namePrefix?: string;
}) {
  const t = dictionary.delivery;
  const initial = zones[0];
  const [zoneId, setZoneId] = useState(initial?.id ?? "");

  const selected = useMemo(
    () => zones.find((zone) => zone.id === zoneId) ?? zones[0],
    [zoneId, zones],
  );

  const km = selected?.km ?? 0;
  const zoneName = selected
    ? locale === "vi"
      ? selected.nameVi
      : selected.nameEn
    : "";
  const note = selected
    ? locale === "vi"
      ? selected.noteVi
      : selected.noteEn
    : "";
  const fee = useMemo(() => {
    if (!selected || selected.quoteOnly) return null;
    return calcDeliveryFee(selected.km, config);
  }, [selected, config]);

  useEffect(() => {
    if (!selected) return;
    onChange?.({ km: selected.km, fee, zone: zoneName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, fee, zoneName]);

  if (!zones.length) {
    return (
      <p className="text-sm text-moss">{t.noZones}</p>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-forest/10 bg-cream/50 p-5"
          : "rounded-[2rem] bg-[linear-gradient(145deg,#efe4d4_0%,#fbf7f0_50%,#e7c6c4_100%)] p-8 sm:p-10"
      }
    >
      {!compact ? (
        <>
          <p className="text-[11px] tracking-[0.22em] text-rose uppercase">
            {t.calculatorKicker}
          </p>
          <h2 className="serif mt-3 text-3xl text-forest sm:text-4xl">
            {t.calculatorTitle}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-moss">
            {t.calculatorBody.replace("{studio}", config.studioName)}
          </p>
        </>
      ) : (
        <p className="text-[11px] tracking-[0.16em] text-moss uppercase">
          {t.zoneLabel}
        </p>
      )}

      <div className={`grid gap-3 ${compact ? "mt-4" : "mt-8"} sm:grid-cols-2`}>
        {zones.map((zone) => {
          const name = locale === "vi" ? zone.nameVi : zone.nameEn;
          const zoneFee = zone.quoteOnly
            ? null
            : calcDeliveryFee(zone.km, config);
          const selectedNow = zone.id === selected?.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => setZoneId(zone.id)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                selectedNow
                  ? "border-rose bg-blush/40"
                  : "border-forest/10 bg-white/55 hover:border-forest/25"
              }`}
            >
              <span className="block text-sm text-forest">{name}</span>
              <span className="mt-2 flex items-center justify-between gap-3 text-xs text-moss">
                <span>
                  {zone.quoteOnly ? t.quoted : `~${zone.km} km`}
                </span>
                <span className="text-forest">
                  {zoneFee === null ? t.quoted : formatVnd(zoneFee, locale)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={`flex items-end justify-between gap-4 border-t border-forest/10 ${compact ? "mt-5 pt-4" : "mt-8 pt-6"}`}
      >
        <div>
          <p className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {t.selectedLabel}
          </p>
          <p className="serif mt-1 text-2xl text-forest">{zoneName}</p>
          {note ? <p className="mt-2 text-sm text-moss">{note}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {t.feeLabel}
          </p>
          <p className="serif mt-1 text-3xl text-forest">
            {fee === null ? t.quoted : formatVnd(fee, locale)}
          </p>
          {!selected?.quoteOnly ? (
            <p className="mt-1 text-xs text-moss">~{km} km</p>
          ) : null}
        </div>
      </div>

      {fee === null ? (
        <p className="mt-5 text-sm leading-6 text-moss">{t.beyondNote}</p>
      ) : (
        <p className="mt-5 text-sm leading-6 text-moss">{t.feeNote}</p>
      )}

      <input type="hidden" name={`${namePrefix}Km`} value={km} />
      <input type="hidden" name={`${namePrefix}Fee`} value={fee ?? ""} />
      <input type="hidden" name={`${namePrefix}Zone`} value={zoneName} />
    </div>
  );
}
