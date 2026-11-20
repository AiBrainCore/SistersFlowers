/**
 * Guest reviews shown on the homepage.
 *
 * Quotes stay in the language the guest wrote them — they are NOT i18n strings.
 * Switching EN/VI only changes the section chrome (title, CTAs), never the quote text.
 *
 * Google Maps links MUST use Place IDs or lat/lng pins — never fuzzy
 * “Sisters Flowers Da Nang” search (Google can resolve that to a competitor).
 *
 * @see docs/guest-reviews.md
 */

import { STUDIO_CONTACTS, studioMapsUrl } from "@/lib/studio-contacts";

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
  /**
   * Google Place ID (ChIJ…) from Maps → Share / Place ID Finder.
   * Required before we show Google rating badges or writereview links.
   * Without it we never fuzzy-search the brand name (wrong shops).
   */
  placeId?: string;
  /** Only show when placeId is set and numbers match the live listing. */
  rating?: number;
  reviewCount?: number;
  /** Address pin for directions (lat/lng) — not a business-name search. */
  mapsUrl: string;
  facebookUrl: string;
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

function studioBySlug(slug: "dalat" | "danang") {
  return STUDIO_CONTACTS.find((s) => s.slug === slug)!;
}

/**
 * Studio review / Maps targets.
 *
 * Da Lat — verified GBP “Sisters Flowers Shop”
 *   https://www.google.com/maps/place/?q=place_id:ChIJD3G8K7YTcTERRCQM8wSngQc
 *   (also 0x317113b62bbc710f:0x781a704f30c2444)
 *
 * Da Nang — no public Sisters GBP under that name (Maps searches for
 * 0327453536 / sistersflowers.Danang / 53 Lương Nhữ Hộc all resolve to Da Lat
 * or unrelated shops). Keep Facebook until a Da Nang Place ID exists.
 */
export const STUDIO_GOOGLE_PROFILES: StudioGoogleProfile[] = [
  {
    slug: "dalat",
    placeId: "ChIJD3G8K7YTcTERRCQM8wSngQc",
    rating: 4.8,
    reviewCount: 21,
    mapsUrl: studioMapsUrl(studioBySlug("dalat")),
    facebookUrl: studioBySlug("dalat").socials.facebook,
  },
  {
    slug: "danang",
    mapsUrl: studioMapsUrl(studioBySlug("danang")),
    facebookUrl: studioBySlug("danang").socials.facebook,
  },
];

/** Google listing URL only when Place ID is known. */
export function studioGoogleListingUrl(profile: StudioGoogleProfile) {
  if (!profile.placeId) return null;
  return `https://www.google.com/maps/search/?api=1&query=Sisters+Flowers+Shop&query_place_id=${encodeURIComponent(profile.placeId)}`;
}

/**
 * Write-a-review: Google writereview when Place ID is set;
 * otherwise Facebook page (never fuzzy Maps search).
 */
export function studioReviewCtaUrl(profile: StudioGoogleProfile) {
  if (profile.placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(profile.placeId)}`;
  }
  return profile.facebookUrl;
}

export function studioReviewCtaIsGoogle(profile: StudioGoogleProfile) {
  return Boolean(profile.placeId);
}

/** @deprecated use studioReviewCtaUrl */
export function studioGoogleWriteReviewUrl(profile: StudioGoogleProfile) {
  return studioReviewCtaUrl(profile);
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
