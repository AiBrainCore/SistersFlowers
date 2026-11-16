import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { AttributeKind } from "@/lib/catalog-ai/taxonomy";
import { SHOP_ATTRS_TAG } from "@/lib/shop-cache";

export type AttributePublic = {
  id: string;
  kind: AttributeKind | string;
  slug: string;
  nameEn: string;
  nameVi: string;
  sortOrder: number;
  productCount?: number;
};

async function listActiveAttributesUncached(
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

export const listActiveAttributes = cache(
  async (kind?: AttributeKind | string): Promise<AttributePublic[]> =>
    unstable_cache(
      () => listActiveAttributesUncached(kind),
      ["active-attributes-v1", kind || "all"],
      { revalidate: 60, tags: [SHOP_ATTRS_TAG] },
    )(),
);

export const listAttributesForFilterChips = cache(
  async (kind: AttributeKind) => {
    const all = await listActiveAttributes(kind);
    return all.filter((a) => (a.productCount || 0) > 0);
  },
);
