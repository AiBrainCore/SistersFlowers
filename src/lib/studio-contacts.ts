/** Client-safe studio contact cards (no cookies / Prisma). */

export const STUDIO_PHONE_E164 = "+84327453536";
export const STUDIO_PHONE_DISPLAY = "032 745 3536";
/** Digits only for wa.me / tel links (primary Da Nang WhatsApp / Zalo) */
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
  /** WGS84 pin for Maps directions (never fuzzy business-name search). */
  lat: number;
  lng: number;
  /** Studio atmosphere photo for footer / contact cards */
  image: string;
  /**
   * Main Call / WhatsApp / Zalo number for this studio.
   * Da Nang → 032… · Da Lat → 0904…
   */
  primaryDigits: string;
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
    // Pin from live GBP “Sisters Flowers Shop” @ 53 Lương Nhữ Hộc
    // (Maps ftid 0x3142192e3a8f7347:0x84da47c9867ffe4a).
    lat: 16.0414349,
    lng: 108.2117846,
    image: "/home/studio-danang.jpg",
    primaryDigits: "84327453536",
    phones: [
      { display: "032 745 3536", digits: "84327453536" },
      { display: "0904 985 761", digits: "84904985761" },
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
    // Pin matches live GBP “Sisters Flowers Shop” (Thi Sách / Cam Ly area).
    lat: 11.949064,
    lng: 108.431574,
    image: "/home/studio-dalat.jpg",
    primaryDigits: "84904985761",
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

/** Maps pin for a studio — lat/lng only (never fuzzy business-name search). */
export function studioMapsUrl(studio: Pick<StudioContact, "lat" | "lng" | "addressEn">) {
  const q = `${studio.lat},${studio.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** @deprecated Prefer studioMapsUrl(studio) with lat/lng. */
export function studioAddressMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function studioPrimaryPhone(studio: StudioContact): StudioPhone {
  return (
    studio.phones.find((p) => p.digits === studio.primaryDigits) ||
    studio.phones[0]!
  );
}

export function studioWhatsAppDigits(studio: StudioContact) {
  return studio.primaryDigits || STUDIO_PHONE_DIGITS;
}

export function studioZaloUrl(studio: StudioContact) {
  return `https://zalo.me/${studio.primaryDigits}`;
}
