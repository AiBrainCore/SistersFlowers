import Image from "next/image";
import Link from "next/link";
import { BRAND, type BrandTone, type BrandVariant } from "@/lib/brand";

type BrandLogoProps = {
  locale: string;
  tone?: BrandTone;
  /** wordmark = 1-line; stacked = 2-line; mark = SF monogram */
  variant?: BrandVariant;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

function srcFor(tone: BrandTone, variant: BrandVariant) {
  const light = tone === "onLight";
  if (variant === "mark") return light ? BRAND.markBlack : BRAND.markWhite;
  if (variant === "stacked") {
    return light ? BRAND.wordmarkStackedBlack : BRAND.wordmarkStackedWhite;
  }
  return light ? BRAND.wordmarkBlack : BRAND.wordmarkWhite;
}

const SIZE: Record<
  BrandVariant,
  { width: number; height: number; className: string }
> = {
  mark: {
    width: 40,
    height: 36,
    className: "h-8 w-auto sm:h-9",
  },
  wordmark: {
    width: 168,
    height: 29,
    className: "h-7 w-auto max-w-[9.5rem] sm:h-8 sm:max-w-[11.5rem]",
  },
  stacked: {
    width: 140,
    height: 86,
    className: "h-12 w-auto sm:h-14",
  },
};

/**
 * Graphic Sisters Flowers logo for header, footer, and confirmation screens.
 * Accessible name stays in alt + aria-label; never rely on decorative text.
 */
export function BrandLogo({
  locale,
  tone = "onBrand",
  variant = "wordmark",
  className = "",
  priority = false,
  onClick,
}: BrandLogoProps) {
  const src = srcFor(tone, variant);
  const size = SIZE[variant];

  return (
    <Link
      href={`/${locale}`}
      aria-label={BRAND.name}
      className={`inline-flex items-center ${className}`}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={BRAND.name}
        width={size.width}
        height={size.height}
        className={size.className}
        priority={priority}
      />
    </Link>
  );
}
