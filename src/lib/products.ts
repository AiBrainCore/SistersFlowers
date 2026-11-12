import { prisma } from "@/lib/db";
import { toProduct, type Product } from "@/data/products";
import { seedProductCategoriesIfEmpty } from "@/lib/categories";

const categoryInclude = {
  categories: {
    include: {
      category: true,
    },
  },
} as const;

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "featured";

export type CatalogSizeBand = "mini" | "classic" | "grand" | "luxury";
export type CatalogStyle = "rose" | "mix" | "garden" | "ribbon" | "wrapped";

export type CatalogQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  /** Colour mood from product.accent */
  accent?: string;
  /** Bouquet style matched from tags */
  style?: CatalogStyle;
  /** Size band approximated from price */
  size?: CatalogSizeBand;
  /** When set, apply city assortment (null list = all published). */
  cityProductIds?: string[] | null;
};

const SIZE_BANDS: Record<CatalogSizeBand, { min?: number; max?: number }> = {
  mini: { max: 549999 },
  classic: { min: 550000, max: 899999 },
  grand: { min: 900000, max: 1299999 },
  luxury: { min: 1300000 },
};

const STYLE_NEEDLES: Record<CatalogStyle, string[]> = {
  rose: ["rose"],
  mix: ["mix"],
  garden: ["garden"],
  ribbon: ["ribbon"],
  wrapped: ["wrap", "wrapped"],
};

export async function listPublishedProducts(
  query: CatalogQuery = {},
): Promise<Product[]> {
  await seedProductCategoriesIfEmpty();

  const where: {
    published: boolean;
    id?: { in: string[] };
    AND?: object[];
    categories?: object;
  } = { published: true };

  const and: object[] = [];
  const q = query.q?.trim();

  let minPrice = query.minPrice;
  let maxPrice = query.maxPrice;
  if (query.size && SIZE_BANDS[query.size]) {
    const band = SIZE_BANDS[query.size];
    if (band.min != null) minPrice = band.min;
    if (band.max != null) maxPrice = band.max;
  }

  if (minPrice != null && Number.isFinite(minPrice)) {
    and.push({ price: { gte: minPrice } });
  }
  if (maxPrice != null && Number.isFinite(maxPrice)) {
    and.push({ price: { lte: maxPrice } });
  }

  if (query.accent?.trim()) {
    and.push({ accent: query.accent.trim() });
  }

  if (query.category?.trim()) {
    where.categories = {
      some: { category: { slug: query.category.trim(), active: true } },
    };
  }

  if (query.cityProductIds) {
    where.id = { in: query.cityProductIds };
  }

  if (and.length) where.AND = and;

  const sort = query.sort || "featured";
  const orderBy =
    sort === "price-asc"
      ? [{ price: "asc" as const }, { sortOrder: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }, { sortOrder: "asc" as const }]
        : sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

  const rows = await prisma.product.findMany({
    where,
    include: categoryInclude,
    orderBy,
  });

  let products = rows.map(toProduct);

  // Accent-insensitive EN/VI search (SQLite has no unaccent)
  if (q) {
    const needle = stripDiacritics(q);
    products = products.filter((product) => {
      const hay = stripDiacritics(
        [
          product.slug,
          product.names.en,
          product.names.vi,
          product.tags.en,
          product.tags.vi,
          product.blurb.en,
          product.blurb.vi,
        ].join(" "),
      );
      return hay.includes(needle);
    });
  }

  if (query.style && STYLE_NEEDLES[query.style]) {
    const needles = STYLE_NEEDLES[query.style];
    products = products.filter((product) => {
      const hay = stripDiacritics(`${product.tags.en} ${product.tags.vi}`);
      return needles.some((n) => hay.includes(n));
    });
  }

  return products;
}

export function stripDiacritics(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function listAllProducts(): Promise<Product[]> {
  await seedProductCategoriesIfEmpty();
  const rows = await prisma.product.findMany({
    include: categoryInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(
  slug: string,
  opts?: { includeDraft?: boolean },
): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: categoryInclude,
  });
  if (!row) return null;
  if (!opts?.includeDraft && !row.published) return null;
  return toProduct(row);
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: categoryInclude,
  });
  return row ? toProduct(row) : null;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export function parseCatalogSearchParams(input: {
  q?: string | string[];
  category?: string | string[];
  min?: string | string[];
  max?: string | string[];
  sort?: string | string[];
  accent?: string | string[];
  style?: string | string[];
  size?: string | string[];
}): CatalogQuery {
  const one = (v?: string | string[]) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const q = one(input.q)?.trim() || undefined;
  const category = one(input.category)?.trim() || undefined;
  const minRaw = one(input.min);
  const maxRaw = one(input.max);
  const sortRaw = one(input.sort);
  const accent = one(input.accent)?.trim() || undefined;
  const styleRaw = one(input.style)?.trim();
  const sizeRaw = one(input.size)?.trim();

  const minPrice = minRaw != null && minRaw !== "" ? Number(minRaw) : undefined;
  const maxPrice = maxRaw != null && maxRaw !== "" ? Number(maxRaw) : undefined;

  const sort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "newest" ||
    sortRaw === "featured"
      ? sortRaw
      : "featured";

  const style =
    styleRaw === "rose" ||
    styleRaw === "mix" ||
    styleRaw === "garden" ||
    styleRaw === "ribbon" ||
    styleRaw === "wrapped"
      ? styleRaw
      : undefined;

  const size =
    sizeRaw === "mini" ||
    sizeRaw === "classic" ||
    sizeRaw === "grand" ||
    sizeRaw === "luxury"
      ? sizeRaw
      : undefined;

  return {
    q,
    category,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort,
    accent,
    style,
    size,
  };
}
