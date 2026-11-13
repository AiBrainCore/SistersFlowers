import Image from "next/image";

/**
 * Prefer WebP (`src`) with JPEG fallback (`fallback`) for picky clients.
 * Uses <picture> when fallback differs; otherwise standard next/image.
 */
export function ProductImage({
  src,
  fallback,
  alt,
  fill,
  className,
  sizes,
  priority,
  unoptimized,
}: {
  src: string;
  fallback?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
}) {
  const jpeg = fallback && fallback !== src ? fallback : null;

  if (jpeg) {
    return (
      <picture>
        <source srcSet={src} type="image/webp" />
        <Image
          src={jpeg}
          alt={alt}
          fill={fill}
          className={className}
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
        />
      </picture>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}
