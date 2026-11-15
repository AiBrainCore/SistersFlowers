"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLocation } from "@/context/location-context";
import { isCityQuerySlug } from "@/lib/city-slugs";

/**
 * Soft-nav footer SEO links (`?city=dalat`) must flip Delivering in + catalog.
 * Layout often stays mounted, so cookie/header alone is not enough — sync here.
 */
export function CityQuerySync() {
  const searchParams = useSearchParams();
  const { activeCity, setCity, cities, pending } = useLocation();
  const applyingRef = useRef(false);

  useEffect(() => {
    const raw = searchParams.get("city")?.trim().toLowerCase() || "";
    if (!isCityQuerySlug(raw)) return;
    if (raw === activeCity.slug) return;
    if (pending || applyingRef.current) return;
    if (!cities.some((city) => city.slug === raw)) return;

    applyingRef.current = true;
    void setCity(raw).finally(() => {
      applyingRef.current = false;
    });
  }, [searchParams, activeCity.slug, setCity, cities, pending]);

  return null;
}
