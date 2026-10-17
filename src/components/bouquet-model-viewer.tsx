"use client";

import { useEffect, useState } from "react";

const MODEL = "/models/khronos-glass-vase-flowers.glb";
const POSTER = "/bouquets/b-16.jpg";

export function BouquetModelViewer({
  alt,
  hint,
}: {
  alt: string;
  hint: string;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);

    let cancelled = false;
    void import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      mq.removeEventListener("change", apply);
    };
  }, []);

  if (failed) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER}
          alt={alt}
          className="h-full w-full object-cover"
        />
        <p className="absolute inset-x-0 bottom-0 bg-forest/70 p-3 text-center text-xs text-ivory">
          3D viewer unavailable — static fallback
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] sm:max-w-[500px] lg:max-w-none">
      {!ready ? (
        <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 flex items-end justify-center p-4">
            <span className="glass-premium rounded-full px-4 py-2 text-[10px] tracking-[0.16em] text-forest uppercase">
              Loading 3D…
            </span>
          </div>
        </div>
      ) : null}

      {ready ? (
        <model-viewer
          src={MODEL}
          poster={POSTER}
          alt={alt}
          camera-controls=""
          touch-action="pan-y"
          {...(reduced
            ? {}
            : {
                "auto-rotate": "",
                "auto-rotate-delay": "2500",
                "rotation-per-second": "18deg",
              })}
          shadow-intensity="1"
          shadow-softness="0.85"
          exposure="1.05"
          environment-image="neutral"
          interaction-prompt="auto"
          interaction-prompt-threshold={1500}
          loading="eager"
          style={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(ellipse at 50% 70%, rgba(255,255,255,0.55), rgba(243,235,224,0.35) 55%, transparent)",
            borderRadius: "1.75rem",
            minHeight: "100%",
          }}
        />
      ) : null}

      <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-paper/75 px-3 py-1 text-[10px] tracking-[0.14em] text-moss uppercase backdrop-blur-sm">
        {hint}
      </p>
    </div>
  );
}
