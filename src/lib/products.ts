import { prisma } from "@/lib/db";
import { toProduct, type Product } from "@/data/products";

export async function listPublishedProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toProduct);
}

export async function listAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(
  slug: string,
  opts?: { includeDraft?: boolean },
): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row) return null;
  if (!opts?.includeDraft && !row.published) return null;
  return toProduct(row);
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id } });
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
