import { prisma } from "@/lib/db";
import {
  defaultDeliveryConfig,
  type DeliveryConfig,
  type DeliveryZonePublic,
} from "@/lib/delivery";

export type { DeliveryZonePublic };

export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  const row = await prisma.deliverySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...defaultDeliveryConfig },
  });

  return {
    studioName: row.studioName,
    includedKm: row.includedKm,
    baseFee: row.baseFee,
    midKm: row.midKm,
    midFee: row.midFee,
    maxKm: row.maxKm,
    maxFee: row.maxFee,
  };
}

export async function listActiveDeliveryZones(): Promise<DeliveryZonePublic[]> {
  await ensureDefaultZones();
  const rows = await prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    nameEn: row.nameEn,
    nameVi: row.nameVi,
    km: row.km,
    quoteOnly: row.quoteOnly,
    noteEn: row.noteEn,
    noteVi: row.noteVi,
    sortOrder: row.sortOrder,
  }));
}

export async function listAllDeliveryZones() {
  await ensureDefaultZones();
  return prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

const DEFAULT_ZONES = [
  {
    nameEn: "Da Lat centre · Xuan Huong",
    nameVi: "Trung tâm Đà Lạt · Xuân Hương",
    km: 3,
    noteEn: "Lake, centre hotels, walking streets",
    noteVi: "Hồ, khách sạn trung tâm, phố đi bộ",
    sortOrder: 1,
  },
  {
    nameEn: "Central market area",
    nameVi: "Khu chợ Đà Lạt",
    km: 4,
    noteEn: "Near Cho Da Lat and nearby guesthouses",
    noteVi: "Gần chợ Đà Lạt và nhà nghỉ quanh đó",
    sortOrder: 2,
  },
  {
    nameEn: "Crazy House / centre south",
    nameVi: "Crazy House / phía nam trung tâm",
    km: 6,
    noteEn: "Popular hotel belt just outside the core",
    noteVi: "Khu khách sạn phổ biến sát trung tâm",
    sortOrder: 3,
  },
  {
    nameEn: "Valley of Love side",
    nameVi: "Hướng Thung lũng Tình Yêu",
    km: 8,
    noteEn: "Villas and stays toward the valley",
    noteVi: "Villa và homestay hướng thung lũng",
    sortOrder: 4,
  },
  {
    nameEn: "Tuyen Lam lake",
    nameVi: "Hồ Tuyền Lâm",
    km: 12,
    noteEn: "Resorts and dinner venues by the lake",
    noteVi: "Resort và tiệc quanh hồ",
    sortOrder: 5,
  },
  {
    nameEn: "Prenn / further outskirts",
    nameVi: "Prenn / ngoại ô xa hơn",
    km: 18,
    noteEn: "Longer road from the studio",
    noteVi: "Đường xa hơn từ studio",
    sortOrder: 6,
  },
  {
    nameEn: "Other / I am not sure",
    nameVi: "Khác / tôi chưa chắc",
    km: 99,
    quoteOnly: true,
    noteEn: "Leave your address — we confirm the fee",
    noteVi: "Để địa chỉ — chúng tôi xác nhận phí",
    sortOrder: 99,
  },
] as const;

async function ensureDefaultZones() {
  const count = await prisma.deliveryZone.count();
  if (count > 0) return;

  for (const zone of DEFAULT_ZONES) {
    await prisma.deliveryZone.create({
      data: {
        nameEn: zone.nameEn,
        nameVi: zone.nameVi,
        km: zone.km,
        quoteOnly: "quoteOnly" in zone ? Boolean(zone.quoteOnly) : false,
        noteEn: zone.noteEn,
        noteVi: zone.noteVi,
        sortOrder: zone.sortOrder,
        active: true,
      },
    });
  }
}
