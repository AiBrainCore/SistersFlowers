/**
 * Curated Shop-by-Occasion visuals — real Sisters studio photos,
 * chosen for occasion mood (not random product assignment).
 * Links still use Catalog 2.0 category slugs.
 */
export const OCCASION_SHOWCASE = [
  {
    slug: "birthday",
    image: "/bouquets/shown/w-01.jpg",
    mood: "playful" as const,
  },
  {
    slug: "romance",
    image: "/bouquets/shown/w-06.jpg",
    mood: "warm" as const,
  },
  {
    slug: "congratulations",
    image: "/bouquets/shown/w-01.jpg",
    mood: "playful" as const,
  },
  {
    slug: "anniversary",
    image: "/bouquets/shown/w-08.jpg",
    mood: "warm" as const,
  },
  {
    slug: "wedding",
    image: "/bouquets/shown/w-04.jpg",
    mood: "refined" as const,
  },
  {
    slug: "graduation",
    image: "/bouquets/shown/w-03.jpg",
    mood: "playful" as const,
  },
  {
    slug: "condolences",
    image: "/bouquets/shown/w-18.jpg",
    mood: "calm" as const,
  },
  {
    slug: "everyday",
    image: "/bouquets/shown/w-07.jpg",
    mood: "refined" as const,
  },
] as const;

export type OccasionShowcaseSlug = (typeof OCCASION_SHOWCASE)[number]["slug"];
