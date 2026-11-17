"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** After inline price save, restore scroll to the product that was edited. */
export function AdminScrollToProduct() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`product-${focus}`);
    if (!el) return;

    // Wait a tick for layout/images so scroll lands correctly
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ block: "center", behavior: "auto" });
      el.classList.add("admin-product-row-focus");
      window.setTimeout(() => {
        el.classList.remove("admin-product-row-focus");
      }, 2400);
    });
    return () => window.cancelAnimationFrame(id);
  }, [focus]);

  return null;
}
