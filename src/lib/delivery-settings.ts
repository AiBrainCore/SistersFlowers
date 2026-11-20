import { prisma } from "@/lib/db";
import {
  DEFAULT_CITY_SLUG,
  isCityQuerySlug,
  type CityQuerySlug,
} from "@/lib/city-slugs";
import {
  defaultDeliveryConfig,
  type DeliveryConfig,
  type DeliveryZonePublic,
} from "@/lib/delivery";

export type { DeliveryZonePublic };

const CITY_DEFAULTS: Record<
  CityQuerySlug,
  DeliveryConfig & { id: CityQuerySlug }
> = {
  dalat: {
    id: "dalat",
    studioName: "Da Lat",
    includedKm: 8,
    baseFee: 30000,
    midKm: 20,
    midFee: 60000,
    maxKm: 45,
    maxFee: 120000,
  },
  danang: {
    id: "danang",
    studioName: "Da Nang",
    includedKm: 6,
    baseFee: 25000,
    midKm: 15,
    midFee: 50000,
    maxKm: 35,
    maxFee: 100000,
  },
};

export function normalizeDeliveryCity(
  citySlug?: string | null,
): CityQuerySlug {
  return isCityQuerySlug(citySlug) ? citySlug : DEFAULT_CITY_SLUG;
}

export async function getDeliveryConfig(
  citySlug?: string | null,
): Promise<DeliveryConfig> {
  const city = normalizeDeliveryCity(citySlug);
  const defaults = CITY_DEFAULTS[city];
  try {
    const row = await prisma.deliverySettings.upsert({
      where: { id: city },
      update: {},
      create: {
        id: city,
        studioName: defaults.studioName,
        includedKm: defaults.includedKm,
        baseFee: defaults.baseFee,
        midKm: defaults.midKm,
        midFee: defaults.midFee,
        maxKm: defaults.maxKm,
        maxFee: defaults.maxFee,
      },
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
  } catch (error) {
    console.error("getDeliveryConfig fallback", error);
    return {
      studioName: defaults.studioName,
      includedKm: defaults.includedKm,
      baseFee: defaults.baseFee,
      midKm: defaults.midKm,
      midFee: defaults.midFee,
      maxKm: defaults.maxKm,
      maxFee: defaults.maxFee,
    };
  }
}

export async function listActiveDeliveryZones(
  citySlug?: string | null,
): Promise<DeliveryZonePublic[]> {
  const city = normalizeDeliveryCity(citySlug);
  try {
    await ensureDefaultZones(city);
    const rows = await prisma.deliveryZone.findMany({
      where: { active: true, citySlug: city },
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
  } catch (error) {
    console.error("listActiveDeliveryZones fallback", error);
    return fallbackZones(city);
  }
}

export async function listAllDeliveryZones(citySlug?: string | null) {
  const city = normalizeDeliveryCity(citySlug);
  await ensureDefaultZones(city);
  return prisma.deliveryZone.findMany({
    where: { citySlug: city },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
}

const DALAT_ZONES = [
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

const DANANG_ZONES = [
  {
    nameEn: "Hai Chau / centre",
    nameVi: "Hải Châu / trung tâm",
    km: 3,
    noteEn: "Downtown hotels, offices, apartments",
    noteVi: "Khách sạn, văn phòng, căn hộ trung tâm",
    sortOrder: 1,
  },
  {
    nameEn: "Hoa Cuong / near studio",
    nameVi: "Hòa Cường / gần studio",
    km: 2,
    noteEn: "Around Luong Nhu Hoc and nearby streets",
    noteVi: "Quanh Lương Nhữ Hộc và phố gần studio",
    sortOrder: 2,
  },
  {
    nameEn: "Son Tra / My Khe",
    nameVi: "Sơn Trà / Mỹ Khê",
    km: 8,
    noteEn: "Beach hotels and apartments",
    noteVi: "Khách sạn và căn hộ ven biển",
    sortOrder: 3,
  },
  {
    nameEn: "Ngu Hanh Son / marble mountains",
    nameVi: "Ngũ Hành Sơn",
    km: 12,
    noteEn: "South beach and resort belt",
    noteVi: "Phía nam biển và khu resort",
    sortOrder: 4,
  },
  {
    nameEn: "Cam Le / further west",
    nameVi: "Cẩm Lệ / phía tây",
    km: 10,
    noteEn: "Residential areas west of the river",
    noteVi: "Khu dân cư phía tây sông",
    sortOrder: 5,
  },
  {
    nameEn: "Airport / Lien Chieu side",
    nameVi: "Sân bay / Liên Chiểu",
    km: 16,
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

function zoneSeed(city: CityQuerySlug) {
  return city === "danang" ? DANANG_ZONES : DALAT_ZONES;
}

function fallbackZones(city: CityQuerySlug): DeliveryZonePublic[] {
  return zoneSeed(city).map((zone, index) => ({
    id: `fallback-${city}-${index}`,
    nameEn: zone.nameEn,
    nameVi: zone.nameVi,
    km: zone.km,
    quoteOnly: "quoteOnly" in zone ? Boolean(zone.quoteOnly) : false,
    noteEn: zone.noteEn,
    noteVi: zone.noteVi,
    sortOrder: zone.sortOrder,
  }));
}

async function ensureDefaultZones(city: CityQuerySlug) {
  const count = await prisma.deliveryZone.count({ where: { citySlug: city } });
  if (count > 0) return;

  for (const zone of zoneSeed(city)) {
    await prisma.deliveryZone.create({
      data: {
        citySlug: city,
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
