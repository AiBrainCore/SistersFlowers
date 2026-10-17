/** Curated Hero set — real studio bouquets with matching shop slugs. */
export const HERO_BOUQUET_SLUGS = [
  "hong-do-qua",
  "mix-keo-hong",
  "lily-mix",
] as const;

/** Soft detail crops paired to each Hero bouquet (existing assets only). */
export const HERO_BOUQUET_DETAILS: Record<
  (typeof HERO_BOUQUET_SLUGS)[number],
  string
> = {
  "hong-do-qua": "/bouquets/shown/w-11.jpg",
  "mix-keo-hong": "/bouquets/clean/p03.jpg",
  "lily-mix": "/bouquets/shown/w-13.jpg",
};

export type HeroBouquetItem = {
  slug: string | null;
  image: string;
  detail: string;
  name: string;
};
