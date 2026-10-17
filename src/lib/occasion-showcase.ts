/**
 * Curated Shop-by-Occasion visuals — real Sisters studio photos,
 * chosen for occasion mood (not random product assignment).
 * Links still use Catalog 2.0 category slugs.
 */
export const OCCASION_SHOWCASE = [
  {
    slug: "birthday",
    image: "/bouquets/shown/w-01.jpg",
    /** Cheerful pink hydrangea mix */
    mood: "playful" as const,
  },
  {
    slug: "romance",
    image: "/bouquets/shown/w-06.jpg",
    /** Pink roses + eucalyptus */
    mood: "warm" as const,
  },
  {
    slug: "graduation",
    image: "/bouquets/shown/w-03.jpg",
    /** Soft pastel celebration wrap */
    mood: "playful" as const,
  },
  {
    slug: "wedding",
    image: "/bouquets/shown/w-04.jpg",
    /** Elegant pink tulips */
    mood: "refined" as const,
  },
  {
    slug: "condolences",
    image: "/bouquets/shown/w-18.jpg",
    /** Calm white baby's breath — respectful tone */
    mood: "calm" as const,
  },
] as const;

export type OccasionShowcaseSlug = (typeof OCCASION_SHOWCASE)[number]["slug"];
