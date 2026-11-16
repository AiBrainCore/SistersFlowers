import Image from "next/image";

/**
 * Always go through next/image so /_next/image resizes remote WebP/JPEG.
 * Do not put the raw Supabase URL in a <picture><source> — that bypasses
 * the optimizer and ships multi‑MB originals (shop scroll jank).
 */
export function ProductImage({
  src,
  fallback,
  alt,
  fill,
  className,
  sizes = "(min-width: 1280px) 33vw, 50vw",
  priority,
  quality = 72,
  unoptimized,
}: {
  src: string;
  /** Kept for API compat; optimizer negotiates AVIF/WebP from `src`. */
  fallback?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
}) {
  void fallback;
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
    />
  );
}
