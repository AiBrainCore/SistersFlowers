/** Shared city query helpers — safe for client + middleware (no Prisma). */

export const CITY_COOKIE = "sf_city";
export const CITY_HEADER = "x-sf-city";
export const DEFAULT_CITY_SLUG = "danang";
export const CITY_QUERY_SLUGS = ["danang", "dalat"] as const;

export type CityQuerySlug = (typeof CITY_QUERY_SLUGS)[number];

export function isCityQuerySlug(
  value: string | null | undefined,
): value is CityQuerySlug {
  return Boolean(
    value && (CITY_QUERY_SLUGS as readonly string[]).includes(value),
  );
}
