import { prisma } from "@/lib/db";
import { slugify } from "@/lib/products";

export type AddonKind = "extra" | "partner";

export type AddonPublic = {
  id: string;
  slug: string;
  kind: AddonKind;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  price: number;
  image: string;
  requiresNote: boolean;
  partnerName: string;
  partnerCategory: string;
  commissionPercent: number;
  validityDays: number;
  sortOrder: number;
};

const DEFAULT_ADDONS = [
  {
    slug: "handwritten-card",
    kind: "extra",
    nameEn: "Handwritten card",
    nameVi: "Thiệp viết tay",
    descriptionEn: "A few warm words tucked with the flowers",
    descriptionVi: "Vài lời ấm áp gửi kèm bó hoa",
    price: 30000,
    requiresNote: true,
    partnerName: "",
    partnerCategory: "",
    commissionPercent: 0,
    validityDays: 90,
    sortOrder: 1,
  },
  {
    slug: "mini-teddy",
    kind: "extra",
    nameEn: "Mini teddy",
    nameVi: "Gấu bông mini",
    descriptionEn: "A soft little companion beside the wrap",
    descriptionVi: "Người bạn nhỏ mềm mại bên bó hoa",
    price: 120000,
    requiresNote: false,
    partnerName: "",
    partnerCategory: "",
    commissionPercent: 0,
    validityDays: 90,
    sortOrder: 2,
  },
  {
    slug: "chocolate-box",
    kind: "extra",
    nameEn: "Chocolate box",
    nameVi: "Hộp chocolate",
    descriptionEn: "A sweet bite to enjoy with the flowers",
    descriptionVi: "Chút ngọt ngào bên cạnh hoa",
    price: 90000,
    requiresNote: false,
    partnerName: "",
    partnerCategory: "",
    commissionPercent: 0,
    validityDays: 90,
    sortOrder: 3,
  },
  {
    slug: "spa-massage-dalat",
    kind: "partner",
    nameEn: "Spa treat",
    nameVi: "Trải nghiệm spa",
    descriptionEn: "A relaxing spa moment near our studio",
    descriptionVi: "Khoảnh khắc thư giãn tại spa gần studio",
    price: 450000,
    requiresNote: false,
    partnerName: "Local spa",
    partnerCategory: "spa",
    commissionPercent: 15,
    validityDays: 90,
    sortOrder: 10,
  },
  {
    slug: "hotel-night-upgrade",
    kind: "partner",
    nameEn: "Hotel treat",
    nameVi: "Trải nghiệm khách sạn",
    descriptionEn: "A hotel credit for a nicer stay near the flowers",
    descriptionVi: "Tín dụng khách sạn cho kỳ nghỉ dễ chịu hơn",
    price: 300000,
    requiresNote: true,
    partnerName: "Local hotel",
    partnerCategory: "hotel",
    commissionPercent: 12,
    validityDays: 90,
    sortOrder: 11,
  },
  {
    slug: "car-rental-day",
    kind: "partner",
    nameEn: "Car & taxi treat",
    nameVi: "Trải nghiệm xe / taxi",
    descriptionEn: "Credit for a comfortable ride around town",
    descriptionVi: "Tín dụng cho chuyến đi êm ái quanh phố",
    price: 800000,
    requiresNote: false,
    partnerName: "Local driver",
    partnerCategory: "car",
    commissionPercent: 10,
    validityDays: 90,
    sortOrder: 12,
  },
] as const;

/** Seed if empty; refresh buyer-facing copy for known default slugs. */
async function ensureDefaultAddons() {
  const count = await prisma.addon.count();
  if (count === 0) {
    for (const addon of DEFAULT_ADDONS) {
      await prisma.addon.create({
        data: {
          ...addon,
          image: "",
          active: true,
        },
      });
    }
    return;
  }

  for (const addon of DEFAULT_ADDONS) {
    await prisma.addon.updateMany({
      where: { slug: addon.slug },
      data: {
        nameEn: addon.nameEn,
        nameVi: addon.nameVi,
        descriptionEn: addon.descriptionEn,
        descriptionVi: addon.descriptionVi,
        partnerName: addon.partnerName,
      },
    });
  }
}

export async function listActiveAddons(): Promise<AddonPublic[]> {
  await ensureDefaultAddons();
  const rows = await prisma.addon.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
  return rows.map(toPublic);
}

export async function listAllAddons() {
  await ensureDefaultAddons();
  return prisma.addon.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

function toPublic(row: {
  id: string;
  slug: string;
  kind: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  price: number;
  image: string;
  requiresNote: boolean;
  partnerName: string;
  partnerCategory: string;
  commissionPercent: number;
  validityDays: number;
  sortOrder: number;
}): AddonPublic {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind === "partner" ? "partner" : "extra",
    nameEn: row.nameEn,
    nameVi: row.nameVi,
    descriptionEn: row.descriptionEn,
    descriptionVi: row.descriptionVi,
    price: row.price,
    image: row.image,
    requiresNote: row.requiresNote,
    partnerName: row.partnerName,
    partnerCategory: row.partnerCategory,
    commissionPercent: row.commissionPercent,
    validityDays: row.validityDays || 90,
    sortOrder: row.sortOrder,
  };
}

export function makeAddonSlug(nameEn: string) {
  return slugify(nameEn) || `addon-${Date.now().toString(36)}`;
}

export function commissionAmount(price: number, percent: number) {
  return Math.round((price * Math.max(0, percent)) / 100);
}
