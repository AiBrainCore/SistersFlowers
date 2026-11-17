"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "sf-admin-product-focus";

type StoredFocus = {
  id: string;
  y: number;
  at: number;
};

function readStored(): StoredFocus | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFocus;
    if (!parsed?.id || typeof parsed.y !== "number") return null;
    // Ignore stale entries from a previous session day.
    if (Date.now() - parsed.at > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearStored() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function rememberFocusFromSubmit(form: HTMLFormElement) {
  const idInput = form.querySelector<HTMLInputElement>('input[name="id"]');
  const focusAfter = form.querySelector<HTMLInputElement>(
    'input[name="focusAfter"]',
  );
  const id = (focusAfter?.value || idInput?.value || "").trim();
  if (!id) return;
  try {
    const payload: StoredFocus = {
      id,
      y: window.scrollY,
      at: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/**
 * After inline save / edit / delete, keep the admin on the same product row
 * instead of dumping them at the list top.
 */
export function AdminScrollToProduct() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  // Redirects include a changing `_` so re-saving the same row re-runs scroll.
  const tick = searchParams.get("_");

  useEffect(() => {
    function onSubmit(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) return;
      if (!target.closest(".admin-products-list, .admin-card")) return;
      rememberFocusFromSubmit(target);
    }
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const stored = readStored();
    const focusId = focus || stored?.id || "";
    if (!focusId && stored == null) return;

    let cancelled = false;
    let attempts = 0;
    let highlightTimer = 0;

    const apply = () => {
      if (cancelled) return true;
      const el = focusId
        ? document.getElementById(`product-${focusId}`)
        : null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        el.classList.add("admin-product-row-focus");
        highlightTimer = window.setTimeout(() => {
          el.classList.remove("admin-product-row-focus");
        }, 2400);
        clearStored();
        return true;
      }
      // Product gone (delete) — fall back to the pre-submit scroll Y.
      if (stored && attempts >= 4) {
        window.scrollTo({ top: stored.y, behavior: "auto" });
        clearStored();
        return true;
      }
      return false;
    };

    const retry = () => {
      if (cancelled) return;
      if (apply() || attempts++ > 24) return;
      window.setTimeout(retry, 40);
    };

    const frame = window.requestAnimationFrame(retry);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (highlightTimer) window.clearTimeout(highlightTimer);
    };
  }, [focus, tick]);

  return null;
}
