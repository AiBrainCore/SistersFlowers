import { prisma } from "@/lib/db";
import {
  FEATURED_CATEGORY_SLUGS,
  type CategoryPublic,
} from "@/lib/category-constants";

export type { CategoryPublic };
export { FEATURED_CATEGORY_SLUGS };

export const DEFAULT_CATEGORIES = [
  { slug: "birthday", nameEn: "Birthday", nameVi: "Sinh nhật", sortOrder: 1 },
  { slug: "romance", nameEn: "Romance", nameVi: "Lãng mạn", sortOrder: 2 },
  { slug: "anniversary", nameEn: "Anniversary", nameVi: "Kỷ niệm", sortOrder: 3 },
  { slug: "wedding", nameEn: "Wedding", nameVi: "Cưới hỏi", sortOrder: 4 },
  { slug: "graduation", nameEn: "Graduation", nameVi: "Tốt nghiệp", sortOrder: 5 },
  { slug: "congratulations", nameEn: "Congratulations", nameVi: "Chúc mừng", sortOrder: 6 },
  { slug: "condolences", nameEn: "Condolences", nameVi: "Chia buồn", sortOrder: 7 },
  { slug: "hotel", nameEn: "Hotel gifts", nameVi: "Khách sạn", sortOrder: 8 },
  { slug: "everyday", nameEn: "Everyday", nameVi: "Hàng ngày", sortOrder: 9 },
  { slug: "premium", nameEn: "Premium", nameVi: "Cao cấp", sortOrder: 10 },
] as const;

/** Heuristic keywords → category slug for seeding existing products */
const ASSIGN_RULES: { slug: string; needles: string[] }[] = [
  { slug: "graduation", needles: ["tot-nghiep", "tốt nghiệp", "graduation", "graduate"] },
  { slug: "wedding", needles: ["cuoi", "cưới", "cau-hon", "cầu hôn", "bridal", "wedding"] },
  { slug: "romance", needles: ["valentine", "hong-do", "hồng đỏ", "love", "romance", "tim"] },
  { slug: "birthday", needles: ["sinh nhật", "birthday", "party"] },
  { slug: "condolences", needles: ["tang", "chia buồn", "condolence", "funeral", "white"] },
  { slug: "hotel", needles: ["hotel", "khách sạn", "room"] },
  { slug: "premium", needles: ["grand", "premium", "sang", "luxury"] },
];

export async function ensureDefaultCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameEn: cat.nameEn,
        nameVi: cat.nameVi,
        sortOrder: cat.sortOrder,
        active: true,
      },
      create: { ...cat, active: true },
    });
  }
}

export async function listActiveCategories(): Promise<CategoryPublic[]> {
  await ensureDefaultCategories();
  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: {
      _count: {
        select: {
          products: {
            where: { product: { published: true } },
          },
        },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameVi: row.nameVi,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  }));
}

export async function listAllCategories() {
  await ensureDefaultCategories();
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

export async function seedProductCategoriesIfEmpty() {
  await ensureDefaultCategories();
  const linkCount = await prisma.productCategory.count();
  if (linkCount > 0) return;

  const [products, categories] = await Promise.all([
    prisma.product.findMany(),
    prisma.category.findMany(),
  ]);
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const everydayId = bySlug.get("everyday");

  for (const product of products) {
    const haystack = [
      product.slug,
      product.nameEn,
      product.nameVi,
      product.tagEn,
      product.tagVi,
      product.blurbEn,
      product.blurbVi,
    ]
      .join(" ")
      .toLowerCase();

    const matched = new Set<string>();
    for (const rule of ASSIGN_RULES) {
      if (rule.needles.some((n) => haystack.includes(n.toLowerCase()))) {
        const id = bySlug.get(rule.slug);
        if (id) matched.add(id);
      }
    }
    if (matched.size === 0 && everydayId) matched.add(everydayId);

    for (const categoryId of matched) {
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId },
      });
    }
  }
}
