/**
 * Guest reviews shown on the homepage.
 *
 * Quotes stay in the language the guest wrote them — they are NOT i18n strings.
 * Switching EN/VI only changes the section chrome (title, CTAs), never the quote text.
 *
 * Where guests write reviews today: Google Business Profile (Maps) for each studio.
 * There is no on-site review form yet. Google Places API returns at most ~5 reviews
 * per place (not the full 20+), so we curate a 5★ pool here and link out for “see all /
 * leave a review”. Paste real Google quotes into GUEST_REVIEW_POOL as you collect them.
 *
 * @see docs/guest-reviews.md
 */

export type GuestReviewSource = "google" | "studio";

export type GuestReview = {
  id: string;
  /** Verbatim guest text — never machine-translate for locale. */
  quote: string;
  name: string;
  /** Short context in the same language as the quote (or bilingual city name). */
  meta: string;
  stars: 5 | 4;
  source: GuestReviewSource;
  studio: "dalat" | "danang" | "both";
};

export type StudioGoogleProfile = {
  slug: "dalat" | "danang";
  /** Optional Place ID — unlocks writereview deep link + future Places API sync. */
  placeId?: string;
  /** Manual snapshot until Places API is wired (update when Maps numbers change). */
  rating: number;
  reviewCount: number;
  /** Public Maps search / listing URL. */
  mapsUrl: string;
};

/** Curated 5★ notes. Prefer real Google / guest wording; keep original language. */
export const GUEST_REVIEW_POOL: GuestReview[] = [
  {
    id: "emma-danang-hotel",
    quote:
      "Ordered from abroad for a hotel surprise in Da Nang. Clear English replies, photo before delivery, and it arrived on time.",
    name: "Emma",
    meta: "Hotel delivery · Da Nang",
    stars: 5,
    source: "studio",
    studio: "danang",
  },
  {
    id: "minh-dalat-birthday",
    quote:
      "Beautiful handcrafted bouquet. The studio confirmed the address and time on WhatsApp — easy from start to finish.",
    name: "Minh",
    meta: "Birthday · Da Lat",
    stars: 5,
    source: "studio",
    studio: "dalat",
  },
  {
    id: "james-danang-welcome",
    quote:
      "We needed flowers for a guest arrival. Reception coordination was smooth and the wrap looked exactly like the photo.",
    name: "James",
    meta: "Hotel welcome · Da Nang",
    stars: 5,
    source: "studio",
    studio: "danang",
  },
  // Paste real Google Business quotes below (verbatim, original language), e.g.:
  // { id: "google-dalat-…", quote: "…", name: "…", meta: "Google · Đà Lạt", stars: 5, source: "google", studio: "dalat" },
];

/**
 * Google listing snapshots. Fill `placeId` from Maps → Share → Place ID
 * (or Google Business Profile) when ready for writereview deep links / API sync.
 * Rating/count are manual until Places API is enabled.
 */
export const STUDIO_GOOGLE_PROFILES: StudioGoogleProfile[] = [
  {
    slug: "dalat",
    rating: 4.8,
    reviewCount: 22,
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Sisters Flowers 04 Chi Lang Ward 9 Da Lat"),
  },
  {
    slug: "danang",
    // Update rating/count from the live Maps listing (or set placeId + sync later).
    rating: 5,
    reviewCount: 0,
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        "Sisters Flowers 53 Luong Nhu Hoc Hoa Cuong Bac Da Nang",
      ),
  },
];

export function studioGoogleWriteReviewUrl(profile: StudioGoogleProfile) {
  if (profile.placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(profile.placeId)}`;
  }
  return profile.mapsUrl;
}

/** Deterministic daily pick so SSR and client stay in sync. */
export function pickGuestReviews(
  count = 3,
  dayKey = utcDayKey(new Date()),
): GuestReview[] {
  const pool = GUEST_REVIEW_POOL.filter((r) => r.stars === 5);
  if (pool.length <= count) return pool.slice();

  const order = seededOrder(pool.length, dayKey);
  return order.slice(0, count).map((i) => pool[i]!);
}

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function seededOrder(length: number, seed: string): number[] {
  let state = hashString(seed) || 1;
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices;
}

function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
