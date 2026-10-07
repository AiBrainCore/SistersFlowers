"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { useCart } from "@/context/cart-context";

export function CartDrawer({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const { items, open, setOpen, remove, setQty, subtotal } = useCart();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-forest/30"
        onClick={() => setOpen(false)}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-forest/10 px-6 py-5">
          <h2 className="serif text-2xl">{dictionary.cart.title}</h2>
          <button
            type="button"
            className="text-[11px] tracking-[0.18em] uppercase"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="text-sm leading-7 text-moss">
              <p>{dictionary.cart.empty}</p>
              <Link
                href={`/${locale}/shop`}
                onClick={() => setOpen(false)}
                className="mt-4 inline-block border-b border-rose pb-0.5"
              >
                {dictionary.cart.emptyCta}
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4">
                  <div className="relative h-20 w-16 overflow-hidden rounded-sm bg-cream">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] tracking-[0.14em] text-moss uppercase">
                      {item.type === "addon"
                        ? item.addonKind === "partner"
                          ? dictionary.cart.partnerLabel
                          : dictionary.cart.addonLabel
                        : dictionary.cart.bouquetLabel}
                    </p>
                    <p className="serif text-lg leading-tight">{item.name}</p>
                    {item.partnerName ? (
                      <p className="mt-1 text-[10px] tracking-[0.1em] text-rose uppercase">
                        {item.partnerName}
                      </p>
                    ) : null}
                    {item.note ? (
                      <p className="mt-1 text-xs text-moss italic">“{item.note}”</p>
                    ) : null}
                    <p className="mt-1 text-xs text-moss">
                      {formatVnd(item.price, locale)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full border border-forest/20 text-sm"
                        onClick={() => setQty(item.key, item.qty - 1)}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="text-sm tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full border border-forest/20 text-sm"
                        onClick={() => setQty(item.key, item.qty + 1)}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-[11px] tracking-[0.12em] text-rose uppercase"
                      onClick={() => remove(item.key)}
                    >
                      {dictionary.cart.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-forest/10 px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span>{dictionary.cart.total}</span>
            <span className="serif text-xl">{formatVnd(subtotal, locale)}</span>
          </div>
          <p className="mt-3 text-xs leading-6 text-moss">
            {dictionary.cart.note}
          </p>
          {items.length > 0 ? (
            <Link
              href={`/${locale}/checkout`}
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-forest px-4 py-3 text-center text-[11px] tracking-[0.16em] text-ivory uppercase"
            >
              {dictionary.cart.checkout}
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
