"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export type ProductGalleryImage = {
  src: string;
  fallback?: string | null;
  alt: string;
};

/**
 * Studio-frame PDP media: cream mat, wood/citrus frame, 3:4 main,
 * thumb row ready for up to 4 photos (hidden until 2+ exist).
 */
export function ProductGallery({ images }: { images: ProductGalleryImage[] }) {
  const slides = images.filter((img) => img.src?.trim());
  const [active, setActive] = useState(0);
  const current = slides[Math.min(active, Math.max(slides.length - 1, 0))];

  if (!current) return null;

  return (
    <div className="flex h-full min-h-[22rem] flex-col justify-center bg-[linear-gradient(165deg,#fff8f2_0%,#f3ebe0_55%,#efe4d6_100%)] px-4 py-8 sm:min-h-[28rem] sm:px-8 sm:py-12 lg:min-h-[calc(100vh-4.5rem)] lg:px-10 lg:py-14">
      <div className="mx-auto w-full max-w-[28rem]">
        <figure className="overflow-hidden rounded-[1.35rem] border border-[#B58B65]/45 bg-white p-2 shadow-[0_18px_40px_rgba(44,41,38,0.1)] sm:p-2.5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.05rem] bg-cream">
            <ProductImage
              src={current.src}
              fallback={current.fallback}
              alt={current.alt}
              fill
              priority
              quality={70}
              className="object-cover object-center"
              sizes="(min-width: 1024px) 28rem, 90vw"
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
