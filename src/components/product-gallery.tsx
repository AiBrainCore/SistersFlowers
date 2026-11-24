"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export type ProductGalleryImage = {
  src: string;
  fallback?: string | null;
  alt: string;
};

/**
 * Studio-frame PDP media — fixed max box so it never outgrows the buy card
 * or slips under the sticky header. No sticky positioning.
 */
export function ProductGallery({ images }: { images: ProductGalleryImage[] }) {
  const slides = images.filter((img) => img.src?.trim());
  const [active, setActive] = useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))];

  if (!current) return null;

  return (
    <div className="w-full">
      {/*
        Hard size cap: ~18rem wide → ~24rem tall at 3:4, stays under typical buy panel.
        max-h + w-auto keeps mat visible on all sides inside the figure.
      */}
      <figure className="mx-auto box-border w-full max-w-[18rem] rounded-[1.35rem] border border-[#B58B65]/50 bg-white p-2.5 shadow-[0_14px_32px_rgba(44,41,38,0.1)] sm:max-w-[20rem] sm:p-3">
        <div
          className="relative mx-auto overflow-hidden rounded-[1rem] bg-cream"
          style={{
            aspectRatio: "3 / 4",
            width: "100%",
            maxHeight: "min(52vh, 26rem)",
          }}
        >
          <ProductImage
            src={current.src}
            fallback={current.fallback}
            alt={current.alt}
            fill
            priority
            quality={72}
            className="object-cover object-center"
            sizes="(min-width: 640px) 20rem, 18rem"
          />
        </div>
      </figure>

      {slides.length > 1 ? (
        <ul className="mx-auto mt-3 flex max-w-[20rem] gap-2 overflow-x-auto pb-1">
          {slides.slice(0, 4).map((img, index) => {
            const on = index === active;
            return (
              <li key={`${img.src}-${index}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={img.alt}
                  aria-current={on ? "true" : undefined}
                  className={`relative block h-14 w-12 overflow-hidden rounded-xl border bg-white transition ${
                    on
                      ? "border-citrus ring-2 ring-citrus/35"
                      : "border-[#B58B65]/35 opacity-85 hover:opacity-100"
                  }`}
                >
                  <ProductImage
                    src={img.src}
                    fallback={img.fallback}
                    alt=""
                    fill
                    quality={55}
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
