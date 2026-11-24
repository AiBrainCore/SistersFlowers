"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export type ProductGalleryImage = {
  src: string;
  fallback?: string | null;
  alt: string;
};

/**
 * Studio-frame PDP media: equal white mat on all sides (no bottom clip),
 * sticky on desktop. Thumbs when 2–4 images exist.
 */
export function ProductGallery({ images }: { images: ProductGalleryImage[] }) {
  const slides = images.filter((img) => img.src?.trim());
  const [active, setActive] = useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))];

  if (!current) return null;

  return (
    <div className="bg-[linear-gradient(165deg,#fff8f2_0%,#f3ebe0_55%,#efe4d6_100%)] px-4 py-6 sm:px-6 sm:py-8 lg:sticky lg:top-[4.5rem] lg:self-start lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-[36rem] lg:max-w-none">
        {/*
          Mat must live on the figure with overflow visible.
          overflow-hidden + viewport height on a parent was clipping the bottom mat.
        */}
        <figure className="box-border rounded-[1.5rem] border border-[#B58B65]/50 bg-white p-3 shadow-[0_18px_40px_rgba(44,41,38,0.1)] sm:p-3.5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.1rem] bg-cream">
            <ProductImage
              src={current.src}
              fallback={current.fallback}
              alt={current.alt}
              fill
              priority
              quality={72}
              className="object-cover object-center"
              sizes="(min-width: 1024px) 42vw, 92vw"
            />
          </div>
        </figure>

        {slides.length > 1 ? (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-3.5 sm:gap-2.5">
            {slides.slice(0, 4).map((img, index) => {
              const on = index === active;
              return (
                <li key={`${img.src}-${index}`} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={img.alt}
                    aria-current={on ? "true" : undefined}
                    className={`relative block h-16 w-14 overflow-hidden rounded-xl border bg-white transition sm:h-[4.5rem] sm:w-16 ${
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
                      sizes="64px"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
