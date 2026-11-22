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

/**
 * Real Google Business 5★ quotes (verbatim, original language).
 * Homepage shows 3/day via pickGuestReviews — mixed across cities when possible.
 * City CTAs below the cards still open each studio’s own Google listing.
 */
export const GUEST_REVIEW_POOL: GuestReview[] = [
  {
    id: "google-dalat-thu-nguyen",
    quote:
      "Hoa đẹp,phối hoa siêu ưng. C chủ deth nhiệt tình,tư vấn hoa cho chồng mình niềm nở và mình cực kì ưng hoa ở đây. Chồng mình lựa bó nào mình cũng ưng. Shopp 10đ nhé",
    name: "Thu",
    meta: "Đà Lạt",
    stars: 5,
    source: "google",
    studio: "dalat",
  },
  {
    id: "google-dalat-meo-mun",
    quote:
      "Lần đầu mình mua hoa tại shop để tặng bạn. Rất ưng ý lại đặt bó nữa về chưng lên bàn cho đẹp. Cô chủ dễ thương, cắm hoa đẹp. Shop trang trí cũng xinh nữa. Sẽ quay lại ủng hộ",
    name: "Mèo Mun",
    meta: "Đà Lạt",
    stars: 5,
    source: "google",
    studio: "dalat",
  },
  {
    id: "google-dalat-sandy",
    quote:
      "Shop dễ thương, nhiệt tình. Sản phẩm mình nhận được vượt cả sự mong đợi, giá cả thì rất phải chăng. Một shop hoa xinh đẹp giữa lòng Đà Lạt. Mọi người lên Đà Lạt có đặt hoa thì ủng hộ shop nha.",
    name: "Sandy",
    meta: "Đà Lạt",
    stars: 5,
    source: "google",
    studio: "dalat",
  },
  {
    id: "google-dalat-nhung",
    quote: "Chủ shop nhiệt tình, hoa đẹp lắm ạ",
    name: "Nhung",
    meta: "Đà Lạt",
    stars: 5,
    source: "google",
    studio: "dalat",
  },
  {
    id: "google-dalat-phuong",
    quote:
      "Hoa tươi, mix màu dễ thương đúng ý mình, chủ shop nhiệt tình, ship nhanh. 10 điểm cho sự chỉnh chu này, sẽ ủng hộ dài dài",
    name: "Phương",
    meta: "Đà Lạt",
    stars: 5,
    source: "google",
    studio: "dalat",
  },
  {
    id: "google-danang-albert",
    quote:
      "Beautiful flowers, lovely atmosphere, and friendly staff. Highly recommend!",
    name: "Albert",
    meta: "Đà Nẵng",
    stars: 5,
    source: "google",
    studio: "danang",
  },
  {
    id: "google-danang-thu-tinh",
    quote:
      "Shop hoa xinh lắm luôn, ngay mặt đường dễ tìm, chủ shop tư vấn rất nhiệt tình, mình sẽ qua lại nữa… mua được bó hoa xinh xỉu",
    name: "Thu Tình",
    meta: "Đà Nẵng",
    stars: 5,
    source: "google",
    studio: "danang",
  },
];

function studioBySlug(slug: "dalat" | "danang") {
  return STUDIO_CONTACTS.find((s) => s.slug === slug)!;
}

/**
 * Studio review / Maps targets — Google only (never Facebook, never fuzzy name search).
 *
 * Da Lat — GBP “Sisters Flowers Shop” (Thi Sách / Chi Lăng)
 *   place_id: ChIJD3G8K7YTcTERRCQM8wSngQc
 *   ftid: 0x317113b62bbc710f:0x781a704f30c2444
 *
 * Da Nang — GBP “Sisters Flowers Shop” (53 Lương Nhữ Hộc)
 *   place_id: ChIJR3OPOi4ZQjERSv5_hslH2oQ
 *   ftid: 0x3142192e3a8f7347:0x84da47c9867ffe4a
 *   maps: …/data=!4m8!4m7!1m0!1m5!1m1!1s0x3142192e3a8f7347:0x84da47c9867ffe4a!2m2!1d108.2117846!2d16.0414349
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
    placeId: "ChIJR3OPOi4ZQjERSv5_hslH2oQ",
    rating: 5.0,
    reviewCount: 2,
    mapsUrl: studioMapsUrl(studioBySlug("danang")),
    facebookUrl: studioBySlug("danang").socials.facebook,
  },
];

/** Google listing URL — Place ID required (never fuzzy brand search). */
export function studioGoogleListingUrl(profile: StudioGoogleProfile) {
  if (!profile.placeId) return null;
  return `https://www.google.com/maps/search/?api=1&query=Sisters+Flowers+Shop&query_place_id=${encodeURIComponent(profile.placeId)}`;
}

/** Write-a-review on Google when Place ID is set. */
export function studioReviewCtaUrl(profile: StudioGoogleProfile) {
  if (!profile.placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(profile.placeId)}`;
}

export function studioReviewCtaIsGoogle(profile: StudioGoogleProfile) {
  return Boolean(profile.placeId);
}

/** @deprecated use studioReviewCtaUrl */
export function studioGoogleWriteReviewUrl(profile: StudioGoogleProfile) {
  return studioReviewCtaUrl(profile);
}

/**
 * Deterministic daily pick so SSR and client stay in sync.
 * When both cities have quotes, prefer at least one from each in the first slots.
 */
export function pickGuestReviews(
  count = 3,
  dayKey = utcDayKey(new Date()),
): GuestReview[] {
  const pool = GUEST_REVIEW_POOL.filter((r) => r.stars === 5);
  if (pool.length <= count) return pool.slice();

  const order = seededOrder(pool.length, dayKey);
  const picked: GuestReview[] = [];
  const used = new Set<number>();

  for (const studio of ["dalat", "danang"] as const) {
    if (picked.length >= count) break;
    const idx = order.find((i) => !used.has(i) && pool[i]!.studio === studio);
    if (idx === undefined) continue;
    used.add(idx);
    picked.push(pool[idx]!);
  }

  for (const i of order) {
    if (picked.length >= count) break;
    if (used.has(i)) continue;
    used.add(i);
    picked.push(pool[i]!);
  }

  return picked;
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
