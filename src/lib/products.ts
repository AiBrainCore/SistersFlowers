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

export type CatalogQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
};

export async function listPublishedProducts(
  query: CatalogQuery = {},
): Promise<Product[]> {
  await seedProductCategoriesIfEmpty();

  const where: {
    published: boolean;
    AND?: object[];
    categories?: object;
  } = { published: true };

  const and: object[] = [];

  const q = query.q?.trim();
  if (q) {
    and.push({
      OR: [
        { nameEn: { contains: q } },
        { nameVi: { contains: q } },
        { tagEn: { contains: q } },
        { tagVi: { contains: q } },
        { blurbEn: { contains: q } },
        { blurbVi: { contains: q } },
        { slug: { contains: q.toLowerCase() } },
      ],
    });
  }

  if (query.minPrice != null && Number.isFinite(query.minPrice)) {
    and.push({ price: { gte: query.minPrice } });
  }
  if (query.maxPrice != null && Number.isFinite(query.maxPrice)) {
    and.push({ price: { lte: query.maxPrice } });
  }

  if (query.category?.trim()) {
    where.categories = {
      some: { category: { slug: query.category.trim(), active: true } },
    };
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
  return rows.map(toProduct);
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
}): CatalogQuery {
  const one = (v?: string | string[]) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const q = one(input.q)?.trim() || undefined;
  const category = one(input.category)?.trim() || undefined;
  const minRaw = one(input.min);
  const maxRaw = one(input.max);
  const sortRaw = one(input.sort);

  const minPrice = minRaw != null && minRaw !== "" ? Number(minRaw) : undefined;
  const maxPrice = maxRaw != null && maxRaw !== "" ? Number(maxRaw) : undefined;

  const sort =
    sortRaw === "price-asc" ||
    sortRaw === "price-desc" ||
    sortRaw === "newest" ||
    sortRaw === "featured"
      ? sortRaw
      : "featured";

  return {
    q,
    category,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    sort,
  };
}
