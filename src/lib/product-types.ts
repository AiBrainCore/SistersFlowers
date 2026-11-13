/** Studio product kinds from Sisters (Thu Tinh) — not occasion chips. */
export const PRODUCT_TYPES = [
  {
    slug: "bouquet",
    nameEn: "Bouquet",
    nameVi: "Bó hoa",
    tagEn: "Wrapped bouquet",
    tagVi: "Bó hoa",
    sortOrder: 1,
  },
  {
    slug: "flower-basket",
    nameEn: "Flower basket",
    nameVi: "Giỏ hoa",
    tagEn: "Flower basket",
    tagVi: "Giỏ hoa",
    sortOrder: 2,
  },
  {
    slug: "stand-tray",
    nameEn: "Stand / tray",
    nameVi: "Kệ, lẵng hoa",
    tagEn: "Flower stand",
    tagVi: "Kệ, lẵng hoa",
    sortOrder: 3,
  },
  {
    slug: "stand-congrats",
    nameEn: "Congratulatory stand",
    nameVi: "Kệ hoa chúc mừng",
    tagEn: "Congratulatory stand",
    tagVi: "Kệ hoa chúc mừng",
    sortOrder: 4,
  },
  {
    slug: "stand-funeral",
    nameEn: "Condolence stand",
    nameVi: "Kệ hoa viếng",
    tagEn: "Condolence stand",
    tagVi: "Kệ hoa viếng",
    sortOrder: 5,
  },
] as const;

export type ProductTypeSlug = (typeof PRODUCT_TYPES)[number]["slug"];

export function isProductTypeSlug(value: string): value is ProductTypeSlug {
  return PRODUCT_TYPES.some((t) => t.slug === value);
}

export function getProductType(slug: string) {
  return PRODUCT_TYPES.find((t) => t.slug === slug) ?? PRODUCT_TYPES[0];
}
