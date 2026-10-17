"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  CITY_COOKIE,
  DEFAULT_CITY_SLUG,
  getCityBySlug,
} from "@/lib/locations";

export type SetCityResult =
  | { ok: true; slug: string; acceptsOrders: boolean; clearedCartHint: boolean }
  | { ok: false; error: string };

export async function setActiveCityAction(
  slug: string,
  options?: { hadCartItems?: boolean },
): Promise<SetCityResult> {
  const city = await getCityBySlug(slug);
  if (!city) {
    return { ok: false, error: "unknown_city" };
  }

  const jar = await cookies();
  jar.set(CITY_COOKIE, city.slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");

  return {
    ok: true,
    slug: city.slug,
    acceptsOrders: city.acceptsOrders,
    clearedCartHint: Boolean(options?.hadCartItems),
  };
}

export async function clearCityCookieAction() {
  const jar = await cookies();
  jar.set(CITY_COOKIE, DEFAULT_CITY_SLUG, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
