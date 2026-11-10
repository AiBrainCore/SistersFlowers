import Image from "next/image";
import Link from "next/link";
import { BRAND, type BrandTone } from "@/lib/brand";

type BrandLogoProps = {
  locale: string;
  tone?: BrandTone;
  /** wordmark = full name; mark = SF monogram only */
  variant?: "wordmark" | "mark";
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

function srcFor(tone: BrandTone, variant: "wordmark" | "mark") {
  if (variant === "mark") {
    return tone === "onLight" ? BRAND.markBlack : BRAND.markWhite;
  }
  return tone === "onLight" ? BRAND.wordmarkBlack : BRAND.wordmarkWhite;
}

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
  const isMark = variant === "mark";

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
        width={isMark ? 40 : 168}
        height={isMark ? 36 : 29}
        className={
          isMark
            ? "h-8 w-auto sm:h-9"
            : "h-7 w-auto max-w-[9.5rem] sm:h-8 sm:max-w-[11.5rem]"
        }
        priority={priority}
      />
    </Link>
  );
}
