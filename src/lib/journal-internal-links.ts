/** Destinations available in the Journal “Insert internal link” picker. */
export type InternalLinkTarget = {
  id: string;
  labelEn: string;
  labelVi: string;
  /** Path without locale prefix, e.g. /shop */
  path: string;
};

export const JOURNAL_INTERNAL_LINKS: InternalLinkTarget[] = [
  {
    id: "shop",
    labelEn: "Flower collection / shop",
    labelVi: "Bộ sưu tập hoa / cửa hàng",
    path: "/shop",
  },
  {
    id: "custom",
    labelEn: "Custom bouquet",
    labelVi: "Thiết kế bó hoa theo ý thích",
    path: "/custom",
  },
  {
    id: "delivery",
    labelEn: "Delivery information",
    labelVi: "Thông tin giao hoa",
    path: "/delivery",
  },
  {
    id: "journal",
    labelEn: "Journal home",
    labelVi: "Trang Journal",
    path: "/journal",
  },
  {
    id: "occasions-birthday",
    labelEn: "Birthday flowers",
    labelVi: "Hoa sinh nhật",
    path: "/shop?category=birthday",
  },
  {
    id: "occasions-romance",
    labelEn: "Romance flowers",
    labelVi: "Hoa lãng mạn",
    path: "/shop?category=romance",
  },
  {
    id: "occasions-congrats",
    labelEn: "Congratulations flowers",
    labelVi: "Hoa chúc mừng",
    path: "/shop?category=congratulations",
  },
];

export function localePath(locale: "en" | "vi", path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}
