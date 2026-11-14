/**
 * Vietnamese florist market terminology for Da Nang / Da Lat.
 *
 * SOURCE CLASS: market terminology inferred from public Vietnamese florist
 * naming patterns and common Google SERP phrasing — NOT verified Keyword
 * Planner monthly volumes. Never claim these are “top searched” by volume.
 */

export type KeywordSource = "market_terminology" | "serp_observation";

export type KeywordEntry = {
  vi: string;
  en: string;
  /** Broad (city/category) vs product-specific intent */
  scope: "city" | "category" | "product";
  /** Attribute slugs this keyword may attach to */
  match: string[];
  source: KeywordSource;
};

export const CITY_LANDING_KEYWORDS: KeywordEntry[] = [
  {
    vi: "shop hoa Đà Nẵng",
    en: "flower shop Da Nang",
    scope: "city",
    match: ["danang"],
    source: "market_terminology",
  },
  {
    vi: "điện hoa Đà Nẵng",
    en: "flower delivery Da Nang",
    scope: "city",
    match: ["danang"],
    source: "market_terminology",
  },
  {
    vi: "shop hoa Đà Lạt",
    en: "flower shop Da Lat",
    scope: "city",
    match: ["dalat"],
    source: "market_terminology",
  },
  {
    vi: "điện hoa Đà Lạt",
    en: "flower delivery Da Lat",
    scope: "city",
    match: ["dalat"],
    source: "market_terminology",
  },
];

export const PRODUCT_KEYWORDS: KeywordEntry[] = [
  {
    vi: "bó hoa hồng",
    en: "rose bouquet",
    scope: "product",
    match: ["rose"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa hồng pastel",
    en: "pastel rose bouquet",
    scope: "product",
    match: ["rose", "pastel", "pink"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa hồng đỏ",
    en: "red rose bouquet",
    scope: "product",
    match: ["rose", "red"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa hồng màu hồng",
    en: "pink rose bouquet",
    scope: "product",
    match: ["rose", "pink"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa tặng sinh nhật",
    en: "birthday flower bouquet",
    scope: "product",
    match: ["birthday"],
    source: "market_terminology",
  },
  {
    vi: "hoa tặng người yêu",
    en: "romantic flower gift",
    scope: "product",
    match: ["romance", "romantic"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa chúc mừng",
    en: "congratulatory bouquet",
    scope: "product",
    match: ["congratulations"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa hướng dương",
    en: "sunflower bouquet",
    scope: "product",
    match: ["sunflower"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa baby",
    en: "baby's breath bouquet",
    scope: "product",
    match: ["baby-breath"],
    source: "market_terminology",
  },
  {
    vi: "bó hoa mix",
    en: "mixed flower bouquet",
    scope: "product",
    match: ["mixed-flowers"],
    source: "market_terminology",
  },
  {
    vi: "hoa khai trương",
    en: "opening ceremony flowers",
    scope: "category",
    match: ["congratulations"],
    source: "market_terminology",
  },
  {
    vi: "hoa tốt nghiệp",
    en: "graduation flowers",
    scope: "product",
    match: ["graduation"],
    source: "market_terminology",
  },
];

/** Pick product keywords whose match tags intersect analysis attribute slugs. */
export function matchProductKeywords(attributeSlugs: string[]): KeywordEntry[] {
  const set = new Set(attributeSlugs);
  return PRODUCT_KEYWORDS.filter((k) => k.match.some((m) => set.has(m)));
}
