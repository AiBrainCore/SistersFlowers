import { prisma } from "@/lib/db";
import type { AttributeKind } from "@/lib/catalog-ai/taxonomy";

export type AttributePublic = {
  id: string;
  kind: AttributeKind | string;
  slug: string;
  nameEn: string;
  nameVi: string;
  sortOrder: number;
  productCount?: number;
};

export async function listActiveAttributes(
  kind?: AttributeKind | string,
): Promise<AttributePublic[]> {
  const rows = await prisma.catalogAttribute.findMany({
    where: {
      active: true,
      ...(kind ? { kind } : {}),
    },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { nameEn: "asc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    slug: r.slug,
    nameEn: r.nameEn,
    nameVi: r.nameVi,
    sortOrder: r.sortOrder,
    productCount: r._count.products,
  }));
}

export async function listAttributesForFilterChips(kind: AttributeKind) {
  const all = await listActiveAttributes(kind);
  return all.filter((a) => (a.productCount || 0) > 0);
}
