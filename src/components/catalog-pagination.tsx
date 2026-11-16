import Link from "next/link";
import type { Locale } from "@/i18n/config";
import {
  catalogQueryToSearchParams,
  type CatalogQuery,
} from "@/lib/catalog-query";

function shopHref(locale: Locale, query: CatalogQuery, page: number) {
  const qs = catalogQueryToSearchParams({
    ...query,
    page: page > 1 ? page : undefined,
  }).toString();
  return `/${locale}/shop${qs ? `?${qs}` : ""}`;
}

/** Compact page window: always show first/last + neighbours around current. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (current >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
    set.add(total - 3);
  }
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("gap");
    out.push(n);
  }
  return out;
}

export function CatalogPagination({
  locale,
  query,
  page,
  totalPages,
  labels,
}: {
  locale: Locale;
  query: CatalogQuery;
  page: number;
  totalPages: number;
  labels: {
    previous: string;
    next: string;
    page: string;
  };
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const btn =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-forest/12 bg-white px-3 text-sm text-forest transition hover:border-citrus/40 hover:text-citrus disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-3"
      aria-label={labels.page}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Link
            href={shopHref(locale, query, page - 1)}
            className={btn}
            rel="prev"
          >
            {labels.previous}
          </Link>
        ) : (
          <span className={btn} aria-disabled>
            {labels.previous}
          </span>
        )}

        {pages.map((item, idx) =>
          item === "gap" ? (
            <span
              key={`gap-${idx}`}
              className="px-1 text-moss"
              aria-hidden
            >
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-citrus px-3 text-sm text-ivory"
              aria-current="page"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={shopHref(locale, query, item)}
              className={btn}
            >
              {item}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={shopHref(locale, query, page + 1)}
            className={btn}
            rel="next"
          >
            {labels.next}
          </Link>
        ) : (
          <span className={btn} aria-disabled>
            {labels.next}
          </span>
        )}
      </div>
    </nav>
  );
}
