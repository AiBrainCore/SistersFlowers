/**
 * Official Sisters Flowers brand asset paths (served from /public/brand).
 * Use white variants on citrus/dark; black on cream/paper; citrus squares for social.
 */
export const BRAND = {
  name: "Sisters Flowers",
  /** SF + tulip monogram — black ink, transparent */
  markBlack: "/brand/mark-black.png",
  /** SF + tulip monogram — white ink, transparent */
  markWhite: "/brand/mark-white.png",
  /** Full wordmark (1 line) with tulip — black ink */
  wordmarkBlack: "/brand/wordmark-black.png",
  /** Full wordmark (1 line) with tulip — white ink */
  wordmarkWhite: "/brand/wordmark-white.png",
  /** Stacked 2-line wordmark — black ink */
  wordmarkStackedBlack: "/brand/wordmark-stacked-black.png",
  /** Stacked 2-line wordmark — white ink */
  wordmarkStackedWhite: "/brand/wordmark-stacked-white.png",
  /** Square mark on citrus (social / OG / profile) */
  markCitrus: "/brand/mark-citrus.png",
  /** Stacked wordmark on citrus square */
  wordmarkStackedCitrus: "/brand/wordmark-stacked-citrus.png",
  /** App / PWA icons */
  icon192: "/brand/icon-192.png",
  icon512: "/brand/icon-512.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  /** Compact PNGs for transactional email HTML */
  emailWordmarkBlack: "/brand/email-wordmark-black.png",
  emailWordmarkWhite: "/brand/email-wordmark-white.png",
  emailWordmarkStackedBlack: "/brand/email-wordmark-stacked-black.png",
  emailWordmarkStackedWhite: "/brand/email-wordmark-stacked-white.png",
  emailMarkBlack: "/brand/email-mark-black.png",
  /** Default Open Graph image */
  ogDefault: "/brand/og-default.png",
} as const;

export type BrandTone = "onBrand" | "onLight" | "onDark";
export type BrandVariant = "wordmark" | "stacked" | "mark";
