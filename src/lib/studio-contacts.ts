/** Client-safe studio contact cards (no cookies / Prisma). */

export const STUDIO_PHONE_E164 = "+84327453536";
export const STUDIO_PHONE_DISPLAY = "032 745 3536";
/** Digits only for wa.me / tel links (primary Da Nang WhatsApp) */
export const STUDIO_PHONE_DIGITS = "84327453536";

export type StudioPhone = {
  display: string;
  /** E.164 without +, for tel:/wa.me */
  digits: string;
};

export type StudioSocials = {
  facebook: string;
  /** Facebook Messenger deep link for the page */
  messenger: string;
  tiktok: string;
};

export type StudioContact = {
  slug: "danang" | "dalat";
  nameEn: string;
  nameVi: string;
  addressEn: string;
  addressVi: string;
  /** Studio atmosphere photo for footer / contact cards */
  image: string;
  phones: StudioPhone[];
  socials: StudioSocials;
};

/** Public contact cards — one block per shop. */
export const STUDIO_CONTACTS: StudioContact[] = [
  {
    slug: "danang",
    nameEn: "Da Nang",
    nameVi: "Đà Nẵng",
    addressEn: "53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau, Da Nang",
    addressVi: "53 Lương Nhữ Hộc, Hòa Cường Bắc, Hải Châu, Đà Nẵng",
    image: "/bouquets/shown/w-01.jpg",
    phones: [
      { display: "0904 985 761", digits: "84904985761" },
      { display: "032 745 3536", digits: "84327453536" },
    ],
    socials: {
      facebook: "https://www.facebook.com/sistersflowers.Danang",
      messenger: "https://m.me/sistersflowers.Danang",
      tiktok: "https://www.tiktok.com/@sisterflowerdanang",
    },
  },
  {
    slug: "dalat",
    nameEn: "Da Lat",
    nameVi: "Đà Lạt",
    addressEn: "04 Chi Lang, Ward 9, Da Lat, Lam Dong",
    addressVi: "Số 04 Chi Lăng, P. 9, TP. Đà Lạt, Lâm Đồng",
    image: "/bouquets/shown/w-06.jpg",
    phones: [
      { display: "0904 985 761", digits: "84904985761" },
      { display: "0964 889 329", digits: "84964889329" },
    ],
    socials: {
      facebook: "https://www.facebook.com/Sistersflowers.DaLat",
      messenger: "https://m.me/Sistersflowers.DaLat",
      tiktok: "https://www.tiktok.com/@cogaibanbong94",
    },
  },
];

/** Google Maps search URL for a studio address (opens exact place search). */
export function studioMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function studioWhatsAppDigits(studio: StudioContact) {
  // Prefer the second line when it is the local WhatsApp (Da Nang 032…).
  const wa =
    studio.phones.find((p) => p.digits === STUDIO_PHONE_DIGITS) ||
    studio.phones[0];
  return wa?.digits || STUDIO_PHONE_DIGITS;
}
