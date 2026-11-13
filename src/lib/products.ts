import { prisma } from "@/lib/db";
import { toProduct, type Product } from "@/data/products";
import { seedProductCategoriesIfEmpty } from "@/lib/categories";
import {
  applyOverrideMap,
  getCityPriceOverrideMap,
} from "@/lib/product-city";

const categoryInclude = {
  categories: {
    include: {
      category: true,
    },
  },
} as const;

const cityStockInclude = {
  cityStock: {
    include: {
      city: {
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameVi: true,
        },
      },
    },
  },
} as const;

const productInclude = {
  ...categoryInclude,
  ...cityStockInclude,
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
  /** Apply priceOverride for this city after fetch. */
  cityId?: string;
  /** Product kind: bouquet | flower-basket | stand-* */
  productType?: string;
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
    productType?: string;
    AND?: object[];
    categories?: object;
  } = { published: true };

  if (query.productType?.trim()) {
    where.productType = query.productType.trim();
  }

  const and: object[] = [];
  const q = query.q?.trim();

  let minPrice = query.minPrice;
  let maxPrice = query.maxPrice;
  if (query.size && SIZE_BANDS[query.size]) {
    const band = SIZE_BANDS[query.size];
    if (band.min != null) minPrice = band.min;
    if (band.max != null) maxPrice = band.max;
  }

  // Price filters apply after city overrides when cityId is set.
  const deferPriceFilter = Boolean(query.cityId);
  if (!deferPriceFilter) {
    if (minPrice != null && Number.isFinite(minPrice)) {
      and.push({ price: { gte: minPrice } });
    }
    if (maxPrice != null && Number.isFinite(maxPrice)) {
      and.push({ price: { lte: maxPrice } });
    }
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
    include: productInclude,
    orderBy,
  });

  const overrides = query.cityId
    ? await getCityPriceOverrideMap(query.cityId)
    : null;

  let products = rows.map((row) => applyOverrideMap(toProduct(row), overrides));

  if (deferPriceFilter) {
    if (minPrice != null && Number.isFinite(minPrice)) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice != null && Number.isFinite(maxPrice)) {
      products = products.filter((p) => p.price <= maxPrice);
    }
  }

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

  if (query.cityId && (sort === "price-asc" || sort === "price-desc")) {
    products = [...products].sort((a, b) =>
      sort === "price-asc" ? a.price - b.price : b.price - a.price,
    );
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
    include: productInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(
  slug: string,
  opts?: { includeDraft?: boolean; cityId?: string; citySlug?: string },
): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!row) return null;
  if (!opts?.includeDraft && !row.published) return null;
  let product = toProduct(row);
  if (opts?.cityId) {
    const blocked = row.cityStock?.some(
      (s) => s.city.id === opts.cityId && !s.available,
    );
    if (blocked) return null;
    const overrides = await getCityPriceOverrideMap(opts.cityId);
    product = applyOverrideMap(product, overrides);
  }
  return product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
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
  type?: string | string[];
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
  const productType = one(input.type)?.trim() || undefined;
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
    productType,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort,
    accent,
    style,
    size,
  };
}
