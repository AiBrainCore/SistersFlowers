import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { toProduct, type Product } from "@/data/products";
import { seedProductCategoriesIfEmpty } from "@/lib/categories";
import { withCityPrice } from "@/lib/product-city";
import { minOfferedPrice } from "@/lib/product-sizes";
import {
  paginateCatalog,
  SHOP_PAGE_SIZE,
  type CatalogQuery,
  type CatalogSizeBand,
  type CatalogStyle,
} from "@/lib/catalog-query";
import { SHOP_CATALOG_TAG } from "@/lib/shop-cache";

export type {
  CatalogQuery,
  CatalogSizeBand,
  CatalogSort,
  CatalogStyle,
} from "@/lib/catalog-query";
export {
  catalogFirstCategory,
  catalogQueryToSearchParams,
  paginateCatalog,
  parseCatalogSearchParams,
  SHOP_PAGE_SIZE,
} from "@/lib/catalog-query";

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

const attributeInclude = {
  attributes: {
    include: {
      attribute: true,
    },
  },
} as const;

const productInclude = {
  ...categoryInclude,
  ...cityStockInclude,
  ...attributeInclude,
} as const;

const SIZE_BANDS: Record<CatalogSizeBand, { min?: number; max?: number }> = {
  under500: { max: 499999 },
  mid500: { min: 500000, max: 799999 },
  mid800: { min: 800000, max: 1199999 },
  over1200: { min: 1200000 },
  // Legacy aliases (normalized away in parse, kept for type safety)
  mini: { max: 499999 },
  classic: { min: 500000, max: 799999 },
  grand: { min: 1200000 },
};

const STYLE_NEEDLES: Record<CatalogStyle, string[]> = {
  rose: ["rose"],
  mix: ["mix"],
  garden: ["garden"],
  ribbon: ["ribbon"],
  wrapped: ["wrap", "wrapped"],
};

type CatalogWhere = {
  published: boolean;
  id?: { in: string[] };
  productType?: string;
  AND?: object[];
  categories?: object;
};

function resolvePriceBounds(query: CatalogQuery) {
  const sizeBands = (query.sizes || []).filter((s) => SIZE_BANDS[s]);
  let minPrice = query.minPrice;
  let maxPrice = query.maxPrice;
  if (sizeBands.length === 1) {
    const band = SIZE_BANDS[sizeBands[0]!];
    if (band.min != null) minPrice = band.min;
    if (band.max != null) maxPrice = band.max;
  }
  return { sizeBands, minPrice, maxPrice };
}

/** Price filters need city overrides in JS; multi size bands are OR in JS. */
function deferPriceFilter(query: CatalogQuery, sizeBands: CatalogSizeBand[]) {
  return Boolean(query.cityId) || sizeBands.length > 1;
}

function buildCatalogWhere(query: CatalogQuery): {
  where: CatalogWhere;
  q?: string;
  sizeBands: CatalogSizeBand[];
  minPrice?: number;
  maxPrice?: number;
  deferPrice: boolean;
  sort: NonNullable<CatalogQuery["sort"]> | "featured";
} {
  const where: CatalogWhere = { published: true };
  if (query.productType?.trim()) {
    where.productType = query.productType.trim();
  }

  const and: object[] = [];
  const q = query.q?.trim() || undefined;
  const { sizeBands, minPrice, maxPrice } = resolvePriceBounds(query);
  const deferPrice = deferPriceFilter(query, sizeBands);

  if (!deferPrice) {
    if (minPrice != null && Number.isFinite(minPrice)) {
      and.push({ price: { gte: minPrice } });
    }
    if (maxPrice != null && Number.isFinite(maxPrice)) {
      and.push({ price: { lte: maxPrice } });
    }
  }

  if (query.accents?.length) {
    and.push({ accent: { in: query.accents } });
  }

  if (query.categories?.length) {
    where.categories = {
      some: {
        category: { slug: { in: query.categories }, active: true },
      },
    };
  }

  if (query.flowers?.length) {
    and.push({
      attributes: {
        some: {
          attribute: { slug: { in: query.flowers }, kind: "flower" },
        },
      },
    });
  }
  if (query.colors?.length) {
    and.push({
      attributes: {
        some: {
          attribute: { slug: { in: query.colors }, kind: "color" },
        },
      },
    });
  }
  if (query.attrStyles?.length) {
    and.push({
      attributes: {
        some: {
          attribute: { slug: { in: query.attrStyles }, kind: "style" },
        },
      },
    });
  }

  // Prefer relational city block over a huge `id IN (...)` list.
  if (query.cityId) {
    and.push({
      NOT: {
        cityStock: {
          some: { cityId: query.cityId, available: false },
        },
      },
    });
  } else if (query.cityProductIds) {
    where.id = { in: query.cityProductIds };
  }

  if (and.length) where.AND = and;

  const sort = query.sort || "featured";
  return { where, q, sizeBands, minPrice, maxPrice, deferPrice, sort };
}

function catalogOrderBy(sort: string) {
  return sort === "price-asc"
    ? [{ price: "asc" as const }, { sortOrder: "asc" as const }]
    : sort === "price-desc"
      ? [{ price: "desc" as const }, { sortOrder: "asc" as const }]
      : sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];
}

function applyPostFilters(
  products: Product[],
  query: CatalogQuery,
  opts: {
    q?: string;
    sizeBands: CatalogSizeBand[];
    minPrice?: number;
    maxPrice?: number;
    deferPrice: boolean;
    sort: string;
  },
) {
  let next = products;

  if (opts.deferPrice) {
    if (opts.sizeBands.length > 1) {
      next = next.filter((p) =>
        opts.sizeBands.some((id) => {
          const band = SIZE_BANDS[id];
          if (band.min != null && p.price < band.min) return false;
          if (band.max != null && p.price > band.max) return false;
          return true;
        }),
      );
    } else {
      if (opts.minPrice != null && Number.isFinite(opts.minPrice)) {
        next = next.filter((p) => p.price >= opts.minPrice!);
      }
      if (opts.maxPrice != null && Number.isFinite(opts.maxPrice)) {
        next = next.filter((p) => p.price <= opts.maxPrice!);
      }
    }
  }

  if (opts.q) {
    const tokens = stripDiacritics(opts.q)
      .split(/[\s,./|+-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tokens.length) {
      next = next.filter((product) => {
        const hay = stripDiacritics(
          [
            product.sku || "",
            product.slug,
            product.productType || "",
            product.names.en,
            product.names.vi,
            product.tags.en,
            product.tags.vi,
            product.blurb.en,
            product.blurb.vi,
          ].join(" "),
        );
        // Every word must match (accent-insensitive) so “red rose” finds roses.
        return tokens.every((token) => hay.includes(token));
      });
    }
  }

  if (query.styles?.length) {
    next = next.filter((product) => {
      const hay = stripDiacritics(`${product.tags.en} ${product.tags.vi}`);
      return query.styles!.some((style) => {
        const needles = STYLE_NEEDLES[style];
        return needles?.some((n) => hay.includes(n));
      });
    });
  }

  if (query.cityId && (opts.sort === "price-asc" || opts.sort === "price-desc")) {
    next = [...next].sort((a, b) =>
      opts.sort === "price-asc" ? a.price - b.price : b.price - a.price,
    );
  }

  return next;
}

/** True when we cannot `take`/`skip` in SQL and must filter/sort in memory. */
function needsMemoryPagination(query: CatalogQuery, opts: {
  q?: string;
  sizeBands: CatalogSizeBand[];
  minPrice?: number;
  maxPrice?: number;
  deferPrice: boolean;
  sort: string;
}) {
  if (opts.q) return true;
  if (query.styles?.length) return true;
  if (
    query.cityId &&
    (opts.sort === "price-asc" || opts.sort === "price-desc")
  ) {
    return true;
  }
  if (opts.deferPrice) {
    if (opts.sizeBands.length > 1) return true;
    if (opts.minPrice != null && Number.isFinite(opts.minPrice)) return true;
    if (opts.maxPrice != null && Number.isFinite(opts.maxPrice)) return true;
  }
  return false;
}

const shopCardSelect = (citySlug?: string) =>
  ({
    id: true,
    sku: true,
    slug: true,
    price: true,
    priceSm: true,
    priceMd: true,
    priceLg: true,
    priceGrand: true,
    compareAtPrice: true,
    compareAtSm: true,
    compareAtMd: true,
    compareAtLg: true,
    compareAtGrand: true,
    image: true,
    imageFallback: true,
    productType: true,
    accent: true,
    nameEn: true,
    nameVi: true,
    tagEn: true,
    tagVi: true,
    published: true,
    sortOrder: true,
    createdAt: true,
    cityStock: {
      ...(citySlug ? { where: { city: { slug: citySlug } } } : {}),
      select: {
        available: true,
        priceOverride: true,
        priceSm: true,
        priceMd: true,
        priceLg: true,
        priceGrand: true,
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
  }) as const;

function toShopCardProduct(
  row: Omit<
    Parameters<typeof toProduct>[0],
    "blurbEn" | "blurbVi" | "storyEn" | "storyVi"
  > & {
    blurbEn?: string;
    blurbVi?: string;
  },
  citySlug?: string,
): Product {
  const product = toProduct({
    ...row,
    blurbEn: row.blurbEn ?? "",
    blurbVi: row.blurbVi ?? "",
    storyEn: "",
    storyVi: "",
  });
  const priced = citySlug
    ? withCityPrice(product, citySlug)
    : {
        ...product,
        price: minOfferedPrice(product.sizePrices, undefined, product.price),
      };
  // Dates are not cache-safe via unstable_cache JSON — cards don't need them.
  return { ...priced, createdAt: undefined, updatedAt: undefined };
}

export type ShopCatalogPage = {
  items: Product[];
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

function shopCatalogCacheKey(query: CatalogQuery, kind: "page" | "count") {
  return [
    "shop-catalog-v2",
    kind,
    query.citySlug || "",
    query.cityId || "",
    String(query.page || 1),
    query.q || "",
    query.productType || "",
    query.sort || "featured",
    (query.categories || []).slice().sort().join(","),
    (query.accents || []).slice().sort().join(","),
    (query.styles || []).slice().sort().join(","),
    (query.sizes || []).slice().sort().join(","),
    (query.flowers || []).slice().sort().join(","),
    (query.colors || []).slice().sort().join(","),
    (query.attrStyles || []).slice().sort().join(","),
    query.minPrice == null ? "" : String(query.minPrice),
    query.maxPrice == null ? "" : String(query.maxPrice),
  ];
}

async function listShopCatalogPageUncached(
  query: CatalogQuery,
): Promise<ShopCatalogPage> {
  const built = buildCatalogWhere(query);
  const orderBy = catalogOrderBy(built.sort);
  const pageSize = SHOP_PAGE_SIZE;
  const memory = needsMemoryPagination(query, built);
  const select = shopCardSelect(query.citySlug);

  if (!memory) {
    const page = Math.max(1, query.page || 1);
    const [total, rows] = await Promise.all([
      prisma.product.count({ where: built.where }),
      prisma.product.findMany({
        where: built.where,
        select,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const items = rows.map((row) => toShopCardProduct(row, query.citySlug));
    if (safePage !== page && total > 0) {
      const lastRows = await prisma.product.findMany({
        where: built.where,
        select,
        orderBy,
        take: pageSize,
        skip: (safePage - 1) * pageSize,
      });
      return {
        items: lastRows.map((row) => toShopCardProduct(row, query.citySlug)),
        page: safePage,
        totalPages,
        total,
        pageSize,
      };
    }
    return { items, page: safePage, totalPages, total, pageSize };
  }

  const rows = await prisma.product.findMany({
    where: built.where,
    select: {
      ...select,
      blurbEn: true,
      blurbVi: true,
    },
    orderBy,
  });
  let products = rows.map((row) => toShopCardProduct(row, query.citySlug));
  products = applyPostFilters(products, query, built);
  return paginateCatalog(products, query.page, pageSize);
}

async function countShopCatalogUncached(query: CatalogQuery): Promise<number> {
  const built = buildCatalogWhere(query);
  if (!needsMemoryPagination(query, built)) {
    return prisma.product.count({ where: built.where });
  }
  const rows = await prisma.product.findMany({
    where: built.where,
    select: {
      ...shopCardSelect(query.citySlug),
      blurbEn: true,
      blurbVi: true,
    },
    orderBy: catalogOrderBy(built.sort),
  });
  const products = applyPostFilters(
    rows.map((row) => toShopCardProduct(row, query.citySlug)),
    query,
    built,
  );
  return products.length;
}

/**
 * Shop grid only — lean columns, active-city stock, real take/skip when
 * filters allow. 60s cache keyed by city + filters (admin bumps tag).
 */
export async function listShopCatalogPage(
  query: CatalogQuery = {},
): Promise<ShopCatalogPage> {
  return unstable_cache(
    () => listShopCatalogPageUncached(query),
    shopCatalogCacheKey(query, "page"),
    { revalidate: 60, tags: [SHOP_CATALOG_TAG] },
  )();
}

/** Fast filter-drawer count — cached with the same shop-catalog tag. */
export async function countShopCatalog(
  query: CatalogQuery = {},
): Promise<number> {
  return unstable_cache(
    () => countShopCatalogUncached(query),
    shopCatalogCacheKey(query, "count"),
    { revalidate: 60, tags: [SHOP_CATALOG_TAG] },
  )();
}

export async function listPublishedProducts(
  query: CatalogQuery = {},
): Promise<Product[]> {
  await seedProductCategoriesIfEmpty();

  const built = buildCatalogWhere(query);
  const orderBy = catalogOrderBy(built.sort);

  const rows = await prisma.product.findMany({
    where: built.where,
    include: productInclude,
    orderBy,
  });

  let products = rows.map((row) => {
    const product = toProduct(row);
    if (query.citySlug) return withCityPrice(product, query.citySlug);
    return {
      ...product,
      price: minOfferedPrice(product.sizePrices, undefined, product.price),
    };
  });

  return applyPostFilters(products, query, built);
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

/**
 * Admin product list only — skips categories/attributes/SEO/story blobs so
 * bulk pricing redirects do not OOM or time out rebuilding the page.
 */
export async function listAdminProducts(): Promise<Product[]> {
  await seedProductCategoriesIfEmpty();
  const rows = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      sku: true,
      price: true,
      priceSm: true,
      priceMd: true,
      priceLg: true,
      priceGrand: true,
      compareAtPrice: true,
      compareAtSm: true,
      compareAtMd: true,
      compareAtLg: true,
      compareAtGrand: true,
      image: true,
      imageFallback: true,
      productType: true,
      accent: true,
      nameEn: true,
      nameVi: true,
      tagEn: true,
      tagVi: true,
      published: true,
      sortOrder: true,
      createdAt: true,
      cityStock: {
        select: {
          available: true,
          priceOverride: true,
          priceSm: true,
          priceMd: true,
          priceLg: true,
          priceGrand: true,
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
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) =>
    toProduct({
      ...row,
      blurbEn: "",
      blurbVi: "",
      storyEn: "",
      storyVi: "",
    }),
  );
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
  }
  if (opts?.citySlug || opts?.cityId) {
    const slug =
      opts.citySlug ||
      row.cityStock?.find((s) => s.city.id === opts.cityId)?.city.slug;
    product = withCityPrice(product, slug);
  } else {
    product = {
      ...product,
      price: minOfferedPrice(product.sizePrices, undefined, product.price),
    };
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
