import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const CITY_COOKIE = "sf_city";
/** Da Nang is the primary / first studio in the network UI. */
export const DEFAULT_CITY_SLUG = "danang";

export const STUDIO_PHONE_E164 = "+84327453536";
export const STUDIO_PHONE_DISPLAY = "032 745 3536";
/** Digits only for wa.me / tel links (primary Da Nang WhatsApp) */
export const STUDIO_PHONE_DIGITS = "84327453536";

export type StudioPhone = {
  display: string;
  /** E.164 without +, for tel:/wa.me */
  digits: string;
};

export type StudioContact = {
  slug: "danang" | "dalat";
  nameEn: string;
  nameVi: string;
  addressEn: string;
  addressVi: string;
  phones: StudioPhone[];
};

/** Public contact cards for the footer — one block per shop. */
export const STUDIO_CONTACTS: StudioContact[] = [
  {
    slug: "danang",
    nameEn: "Da Nang",
    nameVi: "Đà Nẵng",
    addressEn: "53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau, Da Nang",
    addressVi: "53 Lương Nhữ Hộc, Hòa Cường Bắc, Hải Châu, Đà Nẵng",
    phones: [
      { display: "0904 985 761", digits: "84904985761" },
      { display: "032 745 3536", digits: "84327453536" },
    ],
  },
  {
    slug: "dalat",
    nameEn: "Da Lat",
    nameVi: "Đà Lạt",
    addressEn: "04 Chi Lang, Ward 9, Da Lat, Lam Dong",
    addressVi: "Số 04 Chi Lăng, P. 9, TP. Đà Lạt, Lâm Đồng",
    phones: [
      { display: "0904 985 761", digits: "84904985761" },
      { display: "0964 889 329", digits: "84964889329" },
    ],
  },
];

export type CityStatus = "open" | "coming_soon" | "inactive";

export type BranchPublic = {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  status: CityStatus;
  isPrimary: boolean;
  addressEn: string;
  addressVi: string;
};

export type CityPublic = {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  status: CityStatus;
  sortOrder: number;
  acceptsOrders: boolean;
  branches: BranchPublic[];
  primaryBranch: BranchPublic | null;
};

const SEED_CITIES = [
  {
    slug: "danang",
    nameEn: "Da Nang",
    nameVi: "Đà Nẵng",
    status: "open" as const,
    sortOrder: 1,
    branch: {
      slug: "danang-studio",
      nameEn: "Sisters Flowers Da Nang",
      nameVi: "Sisters Flowers Đà Nẵng",
      status: "open" as const,
      isPrimary: true,
      addressEn: "53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau, Da Nang",
      addressVi: "53 Lương Nhữ Hộc, Hòa Cường Bắc, Hải Châu, Đà Nẵng",
    },
  },
  {
    slug: "dalat",
    nameEn: "Da Lat",
    nameVi: "Đà Lạt",
    status: "open" as const,
    sortOrder: 2,
    branch: {
      slug: "dalat-studio",
      nameEn: "Sisters Flowers Da Lat",
      nameVi: "Sisters Flowers Đà Lạt",
      status: "open" as const,
      isPrimary: true,
      addressEn: "04 Chi Lang, Ward 9, Da Lat, Lam Dong",
      addressVi: "Số 04 Chi Lăng, P. 9, TP. Đà Lạt, Lâm Đồng",
    },
  },
] as const;

function toStatus(value: string): CityStatus {
  if (value === "open" || value === "coming_soon" || value === "inactive") {
    return value;
  }
  return "coming_soon";
}

function mapCity(row: {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  status: string;
  sortOrder: number;
  branches: {
    id: string;
    slug: string;
    nameEn: string;
    nameVi: string;
    status: string;
    isPrimary: boolean;
    addressEn: string;
    addressVi: string;
  }[];
}): CityPublic {
  const branches: BranchPublic[] = row.branches.map((b) => ({
    id: b.id,
    slug: b.slug,
    nameEn: b.nameEn,
    nameVi: b.nameVi,
    status: toStatus(b.status),
    isPrimary: b.isPrimary,
    addressEn: b.addressEn,
    addressVi: b.addressVi,
  }));
  const primary =
    branches.find((b) => b.isPrimary) ?? branches[0] ?? null;
  const status = toStatus(row.status);
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameVi: row.nameVi,
    status,
    sortOrder: row.sortOrder,
    acceptsOrders: status === "open",
    branches,
    primaryBranch: primary,
  };
}

export async function ensureNetworkLocations() {
  for (const city of SEED_CITIES) {
    const saved = await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        nameEn: city.nameEn,
        nameVi: city.nameVi,
        status: city.status,
        sortOrder: city.sortOrder,
      },
      create: {
        slug: city.slug,
        nameEn: city.nameEn,
        nameVi: city.nameVi,
        status: city.status,
        sortOrder: city.sortOrder,
      },
    });

    const existing = await prisma.branch.findFirst({
      where: { cityId: saved.id, slug: city.branch.slug },
    });
    if (existing) {
      await prisma.branch.update({
        where: { id: existing.id },
        data: {
          nameEn: city.branch.nameEn,
          nameVi: city.branch.nameVi,
          status: city.branch.status,
          isPrimary: city.branch.isPrimary,
          addressEn: city.branch.addressEn,
          addressVi: city.branch.addressVi,
        },
      });
    } else {
      await prisma.branch.create({
        data: {
          cityId: saved.id,
          slug: city.branch.slug,
          nameEn: city.branch.nameEn,
          nameVi: city.branch.nameVi,
          status: city.branch.status,
          isPrimary: city.branch.isPrimary,
          addressEn: city.branch.addressEn,
          addressVi: city.branch.addressVi,
          sortOrder: 1,
        },
      });
    }
  }
}

export async function listCities(): Promise<CityPublic[]> {
  await ensureNetworkLocations();
  const rows = await prisma.city.findMany({
    where: { status: { not: "inactive" } },
    orderBy: { sortOrder: "asc" },
    include: {
      branches: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map(mapCity);
}

export async function getCityBySlug(
  slug: string,
): Promise<CityPublic | null> {
  await ensureNetworkLocations();
  const row = await prisma.city.findUnique({
    where: { slug },
    include: { branches: { orderBy: { sortOrder: "asc" } } },
  });
  return row ? mapCity(row) : null;
}

export async function resolveActiveCity(
  preferredSlug?: string | null,
): Promise<CityPublic> {
  const cities = await listCities();
  const preferredDefault =
    cities.find((c) => c.slug === DEFAULT_CITY_SLUG && c.acceptsOrders) ??
    cities.find((c) => c.acceptsOrders) ??
    cities[0];
  if (!preferredDefault) {
    throw new Error("No Sisters Flowers cities configured");
  }
  if (!preferredSlug) return preferredDefault;
  const match = cities.find((c) => c.slug === preferredSlug);
  return match ?? preferredDefault;
}

export async function readCitySlugFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CITY_COOKIE)?.value ?? null;
}

export async function getActiveCity(): Promise<CityPublic> {
  const slug = await readCitySlugFromCookie();
  return resolveActiveCity(slug);
}

/** Product IDs available in a city. null = all published (no city assortment rows). */
export async function listAvailableProductIdsForCity(
  cityId: string,
): Promise<string[] | null> {
  const count = await prisma.productCityAvailability.count({
    where: { cityId },
  });
  if (count === 0) return null;
  const rows = await prisma.productCityAvailability.findMany({
    where: { cityId, available: true },
    select: { productId: true },
  });
  return rows.map((r) => r.productId);
}
