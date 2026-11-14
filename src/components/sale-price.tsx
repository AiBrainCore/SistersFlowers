import { formatVnd } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { isOnSale } from "@/lib/product-sizes";

export function SalePrice({
  price,
  compareAt,
  locale,
  from = false,
  fromLabel,
  className = "",
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  locale: Locale;
  from?: boolean;
  fromLabel?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sale = isOnSale(price, compareAt);
  const priceClass =
    size === "lg"
      ? "serif text-3xl"
      : size === "sm"
        ? "text-sm font-medium"
        : "text-sm font-medium tracking-wide";

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`.trim()}
    >
      {from && fromLabel ? (
        <span className="text-[11px] tracking-[0.08em] text-moss uppercase">
          {fromLabel}
        </span>
      ) : null}
      {sale ? (
        <span className="text-sm text-moss line-through decoration-moss/70">
          {formatVnd(compareAt!, locale)}
        </span>
      ) : null}
      <span className={`${priceClass} ${sale ? "text-rose" : "text-citrus"}`}>
        {formatVnd(price, locale)}
      </span>
    </span>
  );
}
