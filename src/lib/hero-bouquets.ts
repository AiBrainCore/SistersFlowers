/**
 * Curated Hero collection — image + display names are locked together.
 * Slugs point at matching shop products (seed names/images stay in sync).
 */
export const HERO_BOUQUETS = [
  {
    slug: "hong-do-qua",
    image: "/bouquets/shown/w-04.jpg",
    nameEn: "Pink tulip wrap",
    nameVi: "Bó tulip hồng",
  },
  {
    slug: "cau-hon",
    image: "/bouquets/shown/w-06.jpg",
    nameEn: "Pink rose eucalyptus",
    nameVi: "Hồng phấn & bạch đàn",
  },
  {
    slug: "tone-noi",
    image: "/bouquets/shown/w-01.jpg",
    nameEn: "Celebration garden wrap",
    nameVi: "Bó vườn lễ hội",
  },
  {
    slug: "valentine-mix",
    image: "/bouquets/shown/w-09.jpg",
    nameEn: "Pastel garden mix",
    nameVi: "Mix vườn pastel",
  },
  {
    slug: "mix-sang",
    image: "/bouquets/shown/w-07.jpg",
    nameEn: "Soft rose wrap",
    nameVi: "Bó hồng dịu",
  },
  {
    slug: "hong-do-giay-trang",
    image: "/bouquets/shown/w-11.jpg",
    nameEn: "Orange rose wrap",
    nameVi: "Bó hồng cam",
  },
] as const;

export type HeroBouquetItem = {
  slug: string | null;
  image: string;
  name: string;
};
