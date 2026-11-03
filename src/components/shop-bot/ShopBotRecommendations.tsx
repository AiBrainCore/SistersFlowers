"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatVnd } from "@/data/products";
import type { BotProduct } from "@/features/shop-bot/types";

export function ShopBotRecommendations({
  locale,
  items,
  onSelect,
  chooseLabel,
  viewLabel,
}: {
  locale: Locale;
  items: BotProduct[];
  onSelect: (productId: string) => void;
  chooseLabel: string;
  viewLabel: string;
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="overflow-hidden rounded-2xl border border-forest/10 bg-white/70"
        >
          <div className="flex gap-3 p-3">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] tracking-wide text-moss uppercase">
                  SF
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="serif text-lg leading-snug text-forest">{item.name}</p>
              {item.blurb ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-moss">
                  {item.blurb}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-medium text-citrus">
                {formatVnd(item.priceVnd, locale)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 border-t border-forest/8 px-3 py-2.5">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="min-h-11 flex-1 rounded-full bg-forest px-3 text-[11px] tracking-[0.14em] text-ivory uppercase"
            >
              {chooseLabel}
            </button>
            <Link
              href={item.productUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest/15 px-3 text-[11px] tracking-[0.12em] text-moss uppercase"
            >
              {viewLabel}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
