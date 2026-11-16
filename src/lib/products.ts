import { prisma } from "@/lib/db";
import { toProduct, type Product } from "@/data/products";
import { seedProductCategoriesIfEmpty } from "@/lib/categories";
import { withCityPrice } from "@/lib/product-city";
import { minOfferedPrice } from "@/lib/product-sizes";
import type {
  CatalogQuery,
  CatalogSizeBand,
  CatalogStyle,
} from "@/lib/catalog-query";

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
  mini: { max: 524999 },
  classic: { min: 525000, max: 724999 },
  grand: { min: 725000 },
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

  const sizeBands = (query.sizes || []).filter((s) => SIZE_BANDS[s]);
  let minPrice = query.minPrice;
  let maxPrice = query.maxPrice;
  // Single size band can push into SQL; multiple bands stay post-filter (OR).
  if (sizeBands.length === 1) {
    const band = SIZE_BANDS[sizeBands[0]!];
    if (band.min != null) minPrice = band.min;
    if (band.max != null) maxPrice = band.max;
  }

  // Price filters apply after city overrides when cityId is set, or multi size OR.
  const deferPriceFilter =
    Boolean(query.cityId) || sizeBands.length > 1;
  if (!deferPriceFilter) {
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

  let products = rows.map((row) => {
    const product = toProduct(row);
    if (query.citySlug) return withCityPrice(product, query.citySlug);
    return {
      ...product,
      price: minOfferedPrice(product.sizePrices, undefined, product.price),
    };
  });

  if (deferPriceFilter) {
    if (sizeBands.length > 1) {
      products = products.filter((p) =>
        sizeBands.some((id) => {
          const band = SIZE_BANDS[id];
          if (band.min != null && p.price < band.min) return false;
          if (band.max != null && p.price > band.max) return false;
          return true;
        }),
      );
    } else {
      if (minPrice != null && Number.isFinite(minPrice)) {
        products = products.filter((p) => p.price >= minPrice!);
      }
      if (maxPrice != null && Number.isFinite(maxPrice)) {
        products = products.filter((p) => p.price <= maxPrice!);
      }
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

  if (query.styles?.length) {
    products = products.filter((product) => {
      const hay = stripDiacritics(`${product.tags.en} ${product.tags.vi}`);
      return query.styles!.some((style) => {
        const needles = STYLE_NEEDLES[style];
        return needles?.some((n) => hay.includes(n));
      });
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
