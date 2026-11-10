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
  /** Full wordmark with tulip — black ink */
  wordmarkBlack: "/brand/wordmark-black.png",
  /** Full wordmark with tulip — white ink */
  wordmarkWhite: "/brand/wordmark-white.png",
  /** Square mark on citrus (social / OG / profile) */
  markCitrus: "/brand/mark-citrus.png",
  /** App / PWA icons */
  icon192: "/brand/icon-192.png",
  icon512: "/brand/icon-512.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  /** Compact PNGs for transactional email HTML */
  emailWordmarkBlack: "/brand/email-wordmark-black.png",
  emailWordmarkWhite: "/brand/email-wordmark-white.png",
  emailMarkBlack: "/brand/email-mark-black.png",
  /** Default Open Graph image */
  ogDefault: "/brand/og-default.png",
} as const;

export type BrandTone = "onBrand" | "onLight" | "onDark";
