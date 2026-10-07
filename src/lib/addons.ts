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

const VOUCHER_RULE_EN =
  "Money voucher: use at partner; pay the difference if more; unused balance is not refunded.";
const VOUCHER_RULE_VI =
  "Phiếu tiền: dùng tại đối tác; thiếu thì trả thêm; dư không hoàn.";

const DEFAULT_ADDONS = [
  {
    slug: "handwritten-card",
    kind: "extra",
    nameEn: "Handwritten card",
    nameVi: "Thiệp viết tay",
    descriptionEn: "A short note with the bouquet",
    descriptionVi: "Lời nhắn ngắn kèm bó hoa",
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
    descriptionEn: "Small soft companion for the wrap",
    descriptionVi: "Gấu nhỏ dễ thương kèm bó",
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
    descriptionEn: "Sweet add-on beside the flowers",
    descriptionVi: "Thêm ngọt bên cạnh hoa",
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
    nameEn: "Spa money voucher 450k",
    nameVi: "Phiếu spa 450k",
    descriptionEn: `${VOUCHER_RULE_EN} Partner spa in Da Lat.`,
    descriptionVi: `${VOUCHER_RULE_VI} Spa đối tác tại Đà Lạt.`,
    price: 450000,
    requiresNote: false,
    partnerName: "Da Lat Partner Spa",
    partnerCategory: "spa",
    commissionPercent: 15,
    validityDays: 90,
    sortOrder: 10,
  },
  {
    slug: "hotel-night-upgrade",
    kind: "partner",
    nameEn: "Hotel money voucher 300k",
    nameVi: "Phiếu khách sạn 300k",
    descriptionEn: `${VOUCHER_RULE_EN} Partner hotel in Da Lat.`,
    descriptionVi: `${VOUCHER_RULE_VI} Khách sạn đối tác tại Đà Lạt.`,
    price: 300000,
    requiresNote: true,
    partnerName: "Partner Hotel Da Lat",
    partnerCategory: "hotel",
    commissionPercent: 12,
    validityDays: 90,
    sortOrder: 11,
  },
  {
    slug: "car-rental-day",
    kind: "partner",
    nameEn: "Car / taxi money voucher 800k",
    nameVi: "Phiếu xe / taxi 800k",
    descriptionEn: `${VOUCHER_RULE_EN} Partner car / taxi.`,
    descriptionVi: `${VOUCHER_RULE_VI} Xe / taxi đối tác.`,
    price: 800000,
    requiresNote: false,
    partnerName: "Da Lat Drive Partner",
    partnerCategory: "car",
    commissionPercent: 10,
    validityDays: 90,
    sortOrder: 12,
  },
] as const;

async function ensureDefaultAddons() {
  const count = await prisma.addon.count();
  if (count > 0) return;
  for (const addon of DEFAULT_ADDONS) {
    await prisma.addon.create({
      data: {
        ...addon,
        image: "",
        active: true,
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
