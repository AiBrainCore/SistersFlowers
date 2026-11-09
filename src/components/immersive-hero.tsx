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
import { CitySwitcher } from "@/components/city-switcher";
import { useLocation } from "@/context/location-context";
import {
  IconBloom,
  IconHeart,
  IconTruck,
} from "@/components/nav-icons";

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
  const { activeCity } = useLocation();
  const cityName = locale === "vi" ? activeCity.nameVi : activeCity.nameEn;
  const items =
    bouquets.length > 0
      ? bouquets
      : [
          {
            slug: null as string | null,
            image: "/bouquets/shown/w-04.jpg",
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
      } else if (session.mode === "pose" && session.moved) {
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
  }

  const bouquetTransform = reduced
    ? "rotateX(-4deg) rotateY(8deg)"
    : `rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) translate3d(${pose.px}px, ${pose.py}px, 0)`;

  const atmosphereTransform = reduced
    ? "none"
    : `translate3d(${pose.px * -0.45}px, ${pose.py * -0.35}px, -80px) scale(1.08)`;

  const glassTransform = reduced
    ? "none"
    : `translate3d(${pose.px * -0.25}px, ${pose.py * -0.2}px, 60px)`;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(168deg,#fff8f2_0%,#ffe9dc_42%,#f7d7c6_100%)]">
      <div className="ih-bloom pointer-events-none absolute inset-0 opacity-70" />

      {/* Soft flower petals around the composition */}
      <div
        aria-hidden
        className="hero-petal -left-8 top-16 h-28 w-28 opacity-40 sm:left-2 sm:h-36 sm:w-36"
      >
        <Image src="/bouquets/shown/w-06.jpg" alt="" fill sizes="160px" />
      </div>
      <div
        aria-hidden
        className="hero-petal -right-6 top-28 h-24 w-24 rotate-12 opacity-45 sm:right-4 sm:h-32 sm:w-32"
      >
        <Image src="/bouquets/shown/w-01.jpg" alt="" fill sizes="140px" />
      </div>
      <div
        aria-hidden
        className="hero-petal bottom-28 -left-10 hidden h-32 w-32 -rotate-6 opacity-35 sm:block"
      >
        <Image src="/bouquets/shown/w-08.jpg" alt="" fill sizes="140px" />
      </div>
      <div
        aria-hidden
        className="hero-petal right-[8%] bottom-40 hidden h-20 w-20 rotate-[-10deg] opacity-40 lg:block"
      >
        <Image src="/bouquets/shown/w-03.jpg" alt="" fill sizes="100px" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-7 pb-8 sm:gap-8 sm:px-5 sm:pt-12 sm:pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:pt-14 lg:pb-12">
        <div className="order-1 max-w-xl">
          <CitySwitcher
            locale={locale}
            dictionary={dictionary}
            variant="hero"
          />
          <h1 className="serif mt-6 text-[2.45rem] leading-[1.02] text-forest sm:mt-7 sm:text-5xl lg:text-[3.6rem]">
            {t.titleBefore}
            <span className="italic text-citrus">{t.titleAccent}</span>
            {t.titleAfter}
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-moss sm:mt-5 sm:text-lg sm:leading-8">
            {t.subtitleLead}{" "}
            <span className="serif italic text-citrus">{cityName}</span>.
          </p>
          <div className="mt-6 flex w-full flex-col items-center gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start">
            <Link
              href={`/${locale}/shop`}
              className="inline-flex min-h-12 w-full max-w-[16.5rem] items-center justify-center rounded-full bg-citrus px-6 text-center text-sm tracking-[0.08em] text-ivory uppercase transition hover:bg-citrus/90 sm:w-auto sm:max-w-none"
            >
              {t.shop}
            </Link>
            <Link
              href={`/${locale}/custom`}
              className="inline-flex min-h-12 w-full max-w-[16.5rem] items-center justify-center rounded-full border border-forest/15 bg-white/70 px-6 text-center text-sm tracking-[0.08em] text-forest uppercase transition hover:border-citrus/40 sm:w-auto sm:max-w-none"
            >
              {t.custom}
            </Link>
          </div>
        </div>

        <div className="order-2">
          <div
            ref={stageRef}
            role="group"
            aria-label={`${active.name}. ${t.imageAlt}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
            className="ih-stage relative mx-auto aspect-[5/6] w-full max-w-[380px] touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:max-w-[480px] sm:aspect-[4/5] lg:max-w-none lg:aspect-[5/6]"
            style={{ cursor: reduced ? "default" : "grab" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] top-[10%] bottom-[8%] rounded-[2rem] bg-[#f3c9b8]/70 shadow-[0_24px_50px_rgba(176,84,44,0.16)] sm:rounded-[2.25rem]"
              style={{ transform: atmosphereTransform }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[14%] bottom-[4%] h-[12%] rounded-[100%] bg-forest/15 blur-2xl"
              style={{
                transform: reduced
                  ? undefined
                  : `translateX(${pose.ry * 0.6}px) scale(${1 + Math.abs(pose.ry) * 0.004})`,
              }}
            />

            <Link
              href={href}
              onClick={onMainClick}
              aria-label={`${t.openBouquet}: ${active.name}`}
              className="ih-layer absolute inset-[9%] overflow-hidden rounded-[1.5rem] shadow-[0_28px_60px_rgba(36,53,42,0.18)] sm:inset-[11%] sm:rounded-[1.85rem]"
              style={{ transform: bouquetTransform }}
            >
              <Image
                key={`main-${active.image}`}
                src={active.image}
                alt={active.name}
                fill
                priority={index === 0}
                className="object-cover object-[center_22%]"
                sizes="(min-width: 1024px) 42vw, 85vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/20 via-transparent to-white/10" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
            </Link>

            <div
              className="ih-layer absolute bottom-[9%] left-[5%] z-10 max-w-[10.5rem] sm:bottom-[11%] sm:left-[7%] sm:max-w-[11.5rem]"
              style={{ transform: glassTransform }}
            >
              <Link
                href={href}
                onClick={onMainClick}
                className="glass-premium block rounded-2xl px-3.5 py-2.5 transition hover:ring-1 hover:ring-citrus/30 sm:px-4 sm:py-3"
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
              className="mx-auto mt-3 flex max-w-[380px] items-center justify-center gap-2 sm:mt-5 sm:max-w-[480px] sm:gap-2.5 lg:max-w-none"
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
                    className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-xl transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citrus/50 sm:h-11 sm:w-11 sm:rounded-2xl lg:h-12 lg:w-12 ${
                      selected
                        ? "ring-2 ring-citrus/70 ring-offset-2 ring-offset-[#ffe9dc] shadow-[0_8px_20px_rgba(36,53,42,0.14)]"
                        : "ring-1 ring-forest/10 opacity-65 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover object-[center_25%]"
                      sizes="56px"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-5 sm:pb-10">
        <div className="glass-hero-features grid grid-cols-3 divide-x divide-citrus/15 rounded-[1.35rem] px-2 py-3.5 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
          <div className="flex flex-col items-center gap-1.5 px-2 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3">
            <IconTruck className="h-5 w-5 text-citrus" />
            <p className="text-[10px] leading-snug font-medium text-citrus sm:text-[12px]">
              {t.featureDelivery}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3">
            <IconBloom className="h-5 w-5 text-citrus" />
            <p className="text-[10px] leading-snug font-medium text-citrus sm:text-[12px]">
              {t.featureFresh}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3">
            <IconHeart className="h-5 w-5 text-citrus" />
            <p className="text-[10px] leading-snug font-medium text-citrus sm:text-[12px]">
              {t.featureHandcrafted}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
