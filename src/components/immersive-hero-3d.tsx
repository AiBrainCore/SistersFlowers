"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BouquetModelViewer } from "@/components/bouquet-model-viewer";

export function ImmersiveHero3D({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = dictionary.hero;
  const p = dictionary.hero3d;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(165deg,#fbf9f5_0%,#f3ebe0_40%,#f0d4cc_72%,#dfe9e6_100%)]">
      <div className="ih-bloom pointer-events-none absolute inset-0 opacity-90" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-[-8%] h-64 w-64 rounded-full bg-citrus/12 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-5 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:py-14">
        <div className="order-1 max-w-xl">
          <p className="serif text-2xl text-forest sm:text-3xl">{t.brand}</p>
          <p className="mt-3 text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.kicker}
          </p>
          <h1 className="serif mt-4 text-[2.35rem] leading-[1.05] text-forest sm:text-5xl lg:text-[3.25rem]">
            {t.titleBefore}
            <span className="italic text-citrus">{t.titleAccent}</span>
            {t.titleAfter}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-moss sm:text-base">
            {t.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/shop`}
              className="inline-flex min-h-12 items-center rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-ivory uppercase transition hover:bg-citrus/90"
            >
              {t.shop}
            </Link>
            <Link
              href={`/${locale}/custom`}
              className="inline-flex min-h-12 items-center rounded-full border border-forest/20 bg-white/55 px-6 text-[12px] tracking-[0.16em] text-forest uppercase transition hover:border-citrus/40"
            >
              {t.custom}
            </Link>
          </div>

          <div className="glass-premium mt-8 max-w-md rounded-2xl p-4">
            <p className="relative z-[1] text-[10px] tracking-[0.2em] text-citrus uppercase">
              {p.badge}
            </p>
            <p className="relative z-[1] mt-2 text-xs leading-relaxed text-moss">
              {p.disclaimer}
            </p>
          </div>

          <p className="mt-5 text-[11px] tracking-[0.06em] text-moss/80">
            {p.note}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.14em] uppercase">
            <Link
              href={`/${locale}`}
              className="min-h-10 inline-flex items-center text-citrus border-b border-citrus/40"
            >
              {p.back}
            </Link>
            <Link
              href={`/${locale}/hero-preview`}
              className="min-h-10 inline-flex items-center text-moss border-b border-forest/20"
            >
              {p.compare2d}
            </Link>
          </div>
        </div>

        <div className="order-2 relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] bottom-[4%] h-[12%] rounded-[100%] bg-forest/18 blur-2xl"
          />
          <BouquetModelViewer
            alt={
              locale === "vi"
                ? "Mẫu bó hoa 3D tương tác (CC0) — không phải sản phẩm Sisters"
                : "Interactive 3D flower sample (CC0) — not a Sisters product"
            }
            hint={p.hint}
          />
        </div>
      </div>
    </section>
  );
}
