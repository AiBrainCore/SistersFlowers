"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export type ProductGalleryImage = {
  src: string;
  fallback?: string | null;
  alt: string;
};

/**
 * Studio-frame PDP media — full column width, moderated height.
 * ~25% shorter than the old stretch-to-buy-card frame so 14″ laptops fit
 * the photo without endless scroll; width stays the left grid column.
 */
export function ProductGallery({ images }: { images: ProductGalleryImage[] }) {
  const slides = images.filter((img) => img.src?.trim());
  const [active, setActive] = useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))];

  if (!current) return null;

  return (
    <div className="flex w-full flex-col">
      <figure className="box-border w-full rounded-[1.5rem] border border-[#B58B65]/50 bg-white p-3 shadow-[0_14px_32px_rgba(44,41,38,0.1)] sm:p-3.5">
        {/*
          Width: 100% of left column.
          Height: capped (~21rem / ~30rem) — was 28rem / 40rem + stretch.
        */}
        <div className="relative h-[21rem] w-full overflow-hidden rounded-[1.15rem] bg-cream sm:h-[24rem] lg:h-[30rem]">
          <ProductImage
            src={current.src}
            fallback={current.fallback}
            alt={current.alt}
            fill
            priority
            quality={72}
            className="object-cover object-center"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        </div>
      </figure>

      {slides.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
