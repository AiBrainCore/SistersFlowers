/**
 * Curated Hero collection — points at real catalog products (not demo seed slugs).
 */
export const HERO_BOUQUETS = [
  {
    slug: "bouquet-img-0018",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0018/main.webp",
    nameEn: "Hydrangea and Carnation Bouquet",
    nameVi: "Bó hoa cẩm tú cầu và hoa cẩm chướng",
  },
  {
    slug: "bouquet-img-0019",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0019/main.webp",
    nameEn: "Blue and White Baby Breath Bouquet",
    nameVi: "Bó hoa baby breath xanh trắng",
  },
  {
    slug: "bouquet-img-0020",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0020/main.webp",
    nameEn: "Elegant Blue Rose Bouquet",
    nameVi: "Bó hoa hồng xanh thanh lịch",
  },
  {
    slug: "bouquet-img-0089",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0089/main.webp?v=upright1",
    nameEn: "Pink Rose Bouquet",
    nameVi: "Bó hoa hồng màu hồng",
  },
  {
    slug: "bouquet-img-0167",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0167/main.webp?v=upright1",
    nameEn: "Pink Baby's Breath Bouquet",
    nameVi: "Bó hoa baby breath hồng",
  },
  {
    slug: "bouquet-img-0177",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0177/main.webp?v=upright1",
    nameEn: "Pastel Rose Bouquet",
    nameVi: "Bó hoa hồng pastel",
  },
  {
    slug: "bouquet-img-0363",
    image:
      "https://vztzjqodazcolxfcljsf.supabase.co/storage/v1/object/public/catalog/bouquet/bouquet-img-0363/main.webp?v=upright1",
    nameEn: "Elegant Red Rose Bouquet",
    nameVi: "Bó hoa hồng đỏ sang trọng",
  },
] as const;

export type HeroBouquetItem = {
  slug: string | null;
  image: string;
  name: string;
};
