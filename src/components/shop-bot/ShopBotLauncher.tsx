"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { parseShopBotParams } from "@/features/shop-bot/params";

/** Heavy panel/flow JS only downloads after the launcher opens. */
const ShopBotPanel = dynamic(
  () => import("./ShopBotPanel").then((m) => m.ShopBotPanel),
  { ssr: false },
);

const FAB_SIZE = 56;
const STORAGE_KEY = "sf-shopbot-fab-bottom";
const EDGE_GAP = 16;
const DRAG_THRESHOLD = 8;

function clampBottom(bottom: number, viewportHeight: number) {
  const min = EDGE_GAP;
  const max = Math.max(min, viewportHeight - FAB_SIZE - EDGE_GAP);
  return Math.min(max, Math.max(min, bottom));
}

export function ShopBotLauncher({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLink = useMemo(
    () => parseShopBotParams(searchParams),
    [searchParams],
  );
  const hideOnAssistant = Boolean(pathname?.includes("/assistant"));
  // Custom builder has its own sticky Request CTA — hide Help Me Choose so it does not cover it.
  const hideOnCustom = Boolean(pathname?.includes("/custom"));
  const hideLauncher = hideOnAssistant || hideOnCustom;
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedAuto, setDismissedAuto] = useState(false);
  const [bottom, setBottom] = useState(EDGE_GAP);
  const [dragging, setDragging] = useState(false);
  const bottomRef = useRef(EDGE_GAP);

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);

  const setBottomSafe = useCallback((value: number) => {
    bottomRef.current = value;
    setBottom(value);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    const next = Number.isFinite(parsed)
      ? clampBottom(parsed, window.innerHeight)
      : EDGE_GAP;
    setBottomSafe(next);
  }, [setBottomSafe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      setBottomSafe(clampBottom(bottomRef.current, window.innerHeight));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setBottomSafe]);

  const persistBottom = useCallback((value: number) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startBottom: bottomRef.current,
      moved: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const deltaY = drag.startY - e.clientY;
    if (!drag.moved && Math.abs(deltaY) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setDragging(true);
    setBottomSafe(clampBottom(drag.startBottom + deltaY, window.innerHeight));
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const wasDrag = drag.moved;
    dragRef.current = null;
    setDragging(false);
    if (wasDrag) {
      persistBottom(bottomRef.current);
      return;
    }
    setManualOpen(true);
  };

  const autoOpen = Boolean(deepLink.open) && !hideLauncher && !dismissedAuto;
  const open = manualOpen || autoOpen;

  if (hideLauncher) return null;

  return (
    <>
      <button
        type="button"
        aria-label={dictionary.shopBot.launcherAria}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`fixed right-4 z-40 flex h-14 w-14 touch-none items-center justify-center rounded-full bg-citrus text-ivory shadow-[0_14px_32px_rgba(176,84,44,0.38)] transition hover:bg-citrus/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus sm:right-6 ${
          dragging ? "cursor-grabbing scale-105" : "cursor-grab"
        }`}
        style={{
          bottom: `max(${bottom}px, env(safe-area-inset-bottom, 0px))`,
        }}
        title={dictionary.shopBot.launcher}
      >
        <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
            <path d="M12 3.2c.7 1.8.6 3.3 0 4.4 1.2-.9 2.8-1.2 4.4-.8-.4 1.9-1.4 3.2-2.8 3.7 1.6.4 2.8 1.6 3.3 3.3-1.8.3-3.3-.1-4.3-1.1.2 1.7-.3 3.3-1.6 4.5-1.3-1.2-1.8-2.8-1.6-4.5-1 .1-2.5 1.4-4.3 1.1.5-1.7 1.7-2.9 3.3-3.3C7 9.8 6 8.5 5.6 6.6c1.6-.4 3.2-.1 4.4.8-.6-1.1-.7-2.6 0-4.4.7 0 1.4 0 2 0Z" />
          </svg>
        </span>
      </button>
      {open ? (
        <ShopBotPanel
          locale={locale}
          dictionary={dictionary}
          open={open}
          onClose={() => {
            setManualOpen(false);
            setDismissedAuto(true);
          }}
          deepLink={deepLink}
        />
      ) : null}
    </>
  );
}
