/**
 * Curated Shop-by-Occasion visuals — Sisters studio photos by mood.
 * Links use Catalog 2.0 category slugs.
 */
export const OCCASION_SHOWCASE = [
  {
    slug: "birthday",
    image: "/home/occasion-birthday.jpg",
    mood: "playful" as const,
  },
  {
    slug: "romance",
    image: "/home/occasion-romance.jpg",
    mood: "warm" as const,
  },
  {
    slug: "congratulations",
    image: "/home/occasion-congrats.jpg",
    mood: "playful" as const,
  },
  {
    slug: "anniversary",
    image: "/home/occasion-anniversary.jpg",
    mood: "warm" as const,
  },
  {
    slug: "wedding",
    image: "/home/occasion-wedding.jpg",
    mood: "refined" as const,
  },
  {
    slug: "graduation",
    image: "/home/occasion-graduation.jpg",
    mood: "playful" as const,
  },
  {
    slug: "condolences",
    image: "/home/occasion-condolences.jpg",
    mood: "calm" as const,
  },
  {
    slug: "everyday",
    image: "/home/occasion-everyday.jpg",
    mood: "refined" as const,
  },
] as const;

export type OccasionShowcaseSlug = (typeof OCCASION_SHOWCASE)[number]["slug"];
