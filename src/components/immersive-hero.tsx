"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { HeroBouquetItem } from "@/lib/hero-bouquets";

type Pose = { rx: number; ry: number; px: number; py: number };

const REST: Pose = { rx: -4, ry: 8, px: 0, py: 0 };

const SWIPE_MIN = 48;

type DragSession = {
  active: boolean;
  x: number;
  y: number;
  ry: number;
  rx: number;
  mode: "pending" | "pose" | "swipe";
  moved: boolean;
};

export function ImmersiveHero({
  locale,
  dictionary,
  bouquets,
}: {
  locale: Locale;
  dictionary: Dictionary;
  bouquets: HeroBouquetItem[];
}) {
  const t = dictionary.hero;
  const items =
    bouquets.length > 0
      ? bouquets
      : [
          {
            slug: null as string | null,
            image: "/bouquets/shown/w-04.jpg",
            detail: "/bouquets/clean/p03.jpg",
            name: t.studioLine,
          },
        ];

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const target = useRef<Pose>({ ...REST });
  const current = useRef<Pose>({ ...REST });
  const drag = useRef<DragSession | null>(null);
  const suppressNav = useRef(false);
  const [pose, setPose] = useState<Pose>(REST);
  const [reduced, setReduced] = useState(false);
  const [index, setIndex] = useState(0);

  const active = items[Math.min(index, items.length - 1)]!;
  const href = active.slug
    ? `/${locale}/shop/${active.slug}`
    : `/${locale}/shop`;

  const tick = useCallback(() => {
    const c = current.current;
    const g = target.current;
    const ease = 0.12;
    c.rx += (g.rx - c.rx) * ease;
    c.ry += (g.ry - c.ry) * ease;
    c.px += (g.px - c.px) * ease;
    c.py += (g.py - c.py) * ease;
    setPose({ ...c });
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) {
      target.current = { ...REST };
      current.current = { ...REST };
      setPose(REST);
      return;
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reduced, tick]);

  function goTo(next: number) {
    const len = items.length;
    if (len < 2) return;
    setIndex(((next % len) + len) % len);
    target.current = { ...REST };
    current.current = { ...REST };
    setPose(REST);
  }

  function setFromPointer(clientX: number, clientY: number, amplify = 1) {
    const el = stageRef.current;
    if (!el || reduced) return;
    const rect = el.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
    target.current = {
      rx: REST.rx + ny * -7 * amplify,
      ry: REST.ry + nx * 14 * amplify,
      px: nx * 10 * amplify,
      py: ny * 8 * amplify,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const session = drag.current;
    if (!session?.active) {
      if (!reduced) setFromPointer(event.clientX, event.clientY, 1);
      return;
    }

    const dx = event.clientX - session.x;
    const dy = event.clientY - session.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) session.moved = true;

    if (session.mode === "pending") {
      if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        session.mode = "swipe";
      } else if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        session.mode = "pose";
      }
    }

    if (session.mode === "swipe" || reduced) return;

    if (session.mode === "pose") {
      target.current = {
        rx: Math.max(-16, Math.min(10, session.rx + dy * 0.08)),
        ry: Math.max(-22, Math.min(28, session.ry + dx * 0.12)),
        px: dx * 0.04,
        py: dy * 0.03,
      };
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      ry: target.current.ry,
      rx: target.current.rx,
      mode: "pending",
      moved: false,
    };
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const session = drag.current;
    if (session?.active) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      if (session.mode === "swipe") {
        const dx = event.clientX - session.x;
        if (dx <= -SWIPE_MIN) goTo(index + 1);
        else if (dx >= SWIPE_MIN) goTo(index - 1);
        suppressNav.current = true;
      } else if (session.moved) {
        suppressNav.current = true;
      }
    }
    drag.current = null;
    if (!reduced) {
      target.current = { ...target.current, px: 0, py: 0 };
    }
  }

  function onPointerLeave() {
    if (!drag.current?.active && !reduced) {
      target.current = { ...REST };
    }
  }

  function onMainClick(event: React.MouseEvent) {
    if (suppressNav.current) {
      event.preventDefault();
      suppressNav.current = false;
    }
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
      return;
    }
    if (reduced) return;
    const step = 3;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      target.current = {
        ...target.current,
        rx: Math.max(-16, target.current.rx - step),
      };
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      target.current = {
        ...target.current,
        rx: Math.min(10, target.current.rx + step),
      };
    }
  }

  const bouquetTransform = reduced
    ? "rotateX(-4deg) rotateY(8deg)"
    : `rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) translate3d(${pose.px}px, ${pose.py}px, 0)`;

  const atmosphereTransform = reduced
    ? "none"
    : `translate3d(${pose.px * -0.45}px, ${pose.py * -0.35}px, -80px) scale(1.08)`;

  const accentTransform = reduced
    ? "none"
    : `translate3d(${pose.px * 0.7}px, ${pose.py * 0.55}px, 40px) rotate(${pose.ry * 0.15}deg)`;

  const glassTransform = reduced
    ? "none"
    : `translate3d(${pose.px * -0.25}px, ${pose.py * -0.2}px, 60px)`;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(165deg,#fbf9f5_0%,#f3ebe0_42%,#f0d4cc_78%,#dfe9e6_100%)]">
      <div className="ih-bloom pointer-events-none absolute inset-0 opacity-90" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-citrus/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-5 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-16">
        <div className="order-1 max-w-xl">
          <p className="serif text-2xl text-forest sm:text-3xl">{t.brand}</p>
          <p className="mt-3 text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.kicker}
          </p>
          <h1 className="serif mt-4 text-[2.35rem] leading-[1.05] text-forest sm:text-5xl lg:text-[3.35rem]">
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
              className="inline-flex min-h-12 items-center rounded-full border border-forest/20 bg-white/50 px-6 text-[12px] tracking-[0.16em] text-forest uppercase transition hover:border-citrus/40"
            >
              {t.custom}
            </Link>
          </div>
        </div>

        <div className="order-2">
          <div
            ref={stageRef}
            role="group"
            aria-label={t.imageAlt}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
            className="ih-stage relative mx-auto aspect-[4/5] w-full max-w-[420px] touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:max-w-[480px] lg:max-w-none lg:aspect-[5/6]"
            style={{ cursor: reduced ? "default" : "grab" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[12%] bottom-[6%] h-[14%] rounded-[100%] bg-forest/20 blur-2xl"
              style={{
                transform: reduced
                  ? undefined
                  : `translateX(${pose.ry * 0.6}px) scale(${1 + Math.abs(pose.ry) * 0.004})`,
              }}
            />

            <div
              className="ih-layer pointer-events-none absolute inset-[8%] overflow-hidden rounded-[2rem] opacity-50"
              style={{ transform: atmosphereTransform }}
            >
              <Image
                key={`atm-${active.image}`}
                src={active.image}
                alt=""
                fill
                className="object-cover blur-[2px] scale-110"
                sizes="(min-width: 1024px) 40vw, 80vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-petal/20" />
            </div>

            <div
              className="ih-layer pointer-events-none absolute top-[8%] right-[2%] h-[28%] w-[28%] overflow-hidden rounded-2xl opacity-70 shadow-[0_12px_30px_rgba(36,53,42,0.12)]"
              style={{ transform: accentTransform }}
            >
              <Image
                key={`det-${active.detail}`}
                src={active.detail}
                alt=""
                fill
                className="object-cover"
                sizes="120px"
              />
            </div>

            <Link
              href={href}
              onClick={onMainClick}
              aria-label={`${t.openBouquet}: ${active.name}`}
              className="ih-layer absolute inset-[10%] overflow-hidden rounded-[1.75rem] shadow-[0_28px_60px_rgba(36,53,42,0.22)]"
              style={{ transform: bouquetTransform }}
            >
              <Image
                key={`main-${active.image}`}
                src={active.image}
                alt={active.name}
                fill
                priority={index === 0}
                className="object-cover object-[center_20%]"
                sizes="(min-width: 1024px) 42vw, 85vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/25 via-transparent to-white/10" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35" />
            </Link>

            <div
              className="ih-layer absolute bottom-[10%] left-[6%] z-10 max-w-[11.5rem]"
              style={{ transform: glassTransform }}
            >
              <Link
                href={href}
                onClick={onMainClick}
                className="glass-premium block rounded-2xl px-4 py-3 transition hover:ring-1 hover:ring-citrus/30"
              >
                <p className="relative z-[1] text-[10px] tracking-[0.2em] text-citrus uppercase">
                  {t.badge}
                </p>
                <p className="relative z-[1] mt-1 text-xs leading-snug text-forest">
                  {active.name}
                </p>
              </Link>
            </div>
          </div>

          {items.length > 1 ? (
            <div
              className="mx-auto mt-5 flex max-w-[420px] items-center justify-center gap-3 sm:max-w-[480px] lg:max-w-none"
              role="tablist"
              aria-label={t.selectBouquet}
            >
              {items.map((item, i) => {
                const selected = i === index;
                return (
                  <button
                    key={`${item.slug ?? "shop"}-${item.image}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`${t.selectBouquet}: ${item.name}`}
                    onClick={() => goTo(i)}
                    className={`relative h-14 w-14 overflow-hidden rounded-2xl transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:h-16 sm:w-16 ${
                      selected
                        ? "ring-2 ring-citrus/70 ring-offset-2 ring-offset-paper shadow-[0_8px_20px_rgba(36,53,42,0.14)]"
                        : "ring-1 ring-forest/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover object-[center_25%]"
                      sizes="64px"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
