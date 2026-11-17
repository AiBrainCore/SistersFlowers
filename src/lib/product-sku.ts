/**
 * Short staff-facing product codes (not the opaque cuid, not the URL slug).
 * Format: SF-7878 — editable, unique, case-insensitive.
 */

const SKU_PREFIX = "SF-";

/** Normalize staff input → uppercase A-Z / 0-9 / hyphen. */
export function normalizeSku(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

/** Digits from import slugs like bouquet-img-7878 → 7878. */
export function digitsFromSlug(slug: string): string | null {
  const img = slug.match(/(?:^|-)img-(\d{3,})(?:-|$)/i);
  if (img?.[1]) return img[1];
  const tail = slug.match(/(\d{3,})$/);
  if (tail?.[1]) return tail[1];
  return null;
}

/** Suggest SF-7878 from slug, or SF- + short id tail. */
export function suggestSku(opts: {
  slug?: string | null;
  sourceKey?: string | null;
  id?: string | null;
}): string {
  const fromSlug = opts.slug ? digitsFromSlug(opts.slug) : null;
  if (fromSlug) return `${SKU_PREFIX}${fromSlug}`;
  const fromKey = opts.sourceKey
    ? digitsFromSlug(slugish(opts.sourceKey))
    : null;
  if (fromKey) return `${SKU_PREFIX}${fromKey}`;
  const tail = (opts.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  if (tail) return `${SKU_PREFIX}${tail.toUpperCase()}`;
  return `${SKU_PREFIX}${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function slugish(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-");
}

/**
 * Resolve form SKU: use staff value when present, else suggest, then uniquify.
 * `taken` returns true when another product already owns that sku.
 */
export async function resolveUniqueSku(opts: {
  raw: string;
  slug: string;
  id?: string | null;
  sourceKey?: string | null;
  taken: (sku: string) => Promise<boolean>;
}): Promise<string> {
  let base = normalizeSku(opts.raw);
  if (!base) {
    base = normalizeSku(
      suggestSku({
        slug: opts.slug,
        sourceKey: opts.sourceKey,
        id: opts.id,
      }),
    );
  }
  if (!base.startsWith("SF") && /^\d+$/.test(base)) {
    base = `${SKU_PREFIX}${base}`;
  }
  let candidate = base;
  let n = 2;
  while (await opts.taken(candidate)) {
    candidate = `${base}-${n}`.slice(0, 32);
    n += 1;
    if (n > 99) {
      candidate = `${base}-${Date.now().toString(36).toUpperCase()}`.slice(
        0,
        32,
      );
      break;
    }
  }
  return candidate;
}
