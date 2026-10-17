/**
 * Location-ready bouquet configuration catalog.
 * Availability and pricing can later vary by city/branch
 * without rewriting the Builder UI.
 */
export type BuilderLocationId = "dalat" | "danang";

export type BuilderOption = {
  id: string;
  price: number;
  swatch?: string;
  /** Representative studio photo — illustrative, not an exact final product */
  image?: string;
};

export const DEFAULT_BUILDER_LOCATION: BuilderLocationId = "dalat";

export const builderSizes: BuilderOption[] = [
  { id: "mini", price: 450000, swatch: "#e7c6c4" },
  { id: "classic", price: 750000, swatch: "#e86a2b" },
  { id: "grand", price: 1200000, swatch: "#2f3b32" },
];

export const builderMoods: BuilderOption[] = [
  {
    id: "soft-blush",
    price: 0,
    swatch: "#f0d5d2",
    image: "/bouquets/shown/w-06.jpg",
  },
  {
    id: "bold-rose",
    price: 80000,
    swatch: "#9b3d45",
    image: "/bouquets/shown/w-08.jpg",
  },
  {
    id: "garden",
    price: 50000,
    swatch: "#8b9a7d",
    image: "/bouquets/shown/w-09.jpg",
  },
  {
    id: "white-clean",
    price: 40000,
    swatch: "#f6f0e6",
    image: "/bouquets/shown/w-05.jpg",
  },
  {
    id: "sunset",
    price: 90000,
    swatch: "#d4926a",
    image: "/bouquets/shown/w-11.jpg",
  },
];

export const builderWraps: BuilderOption[] = [
  {
    id: "kraft",
    price: 0,
    swatch: "#c4a574",
    image: "/bouquets/shown/w-10.jpg",
  },
  {
    id: "pastel",
    price: 30000,
    swatch: "#e8d4e0",
    image: "/bouquets/shown/w-07.jpg",
  },
  {
    id: "deep-ink",
    price: 50000,
    swatch: "#3a2f35",
    image: "/bouquets/shown/w-01.jpg",
  },
  {
    id: "sheer",
    price: 40000,
    swatch: "#efe8f2",
    image: "/bouquets/shown/w-02.jpg",
  },
];

export const builderRibbons: BuilderOption[] = [
  { id: "satin", price: 0, swatch: "#c07a76" },
  { id: "wide-bow", price: 40000, swatch: "#e86a2b" },
  { id: "pearl", price: 60000, swatch: "#d9d0c3" },
];

export const builderAddons: BuilderOption[] = [
  { id: "card", price: 30000, image: "/bouquets/clean/p05.jpg" },
  { id: "dried", price: 50000, image: "/bouquets/clean/p08.jpg" },
  { id: "teddy", price: 120000, image: "/bouquets/clean/p03.jpg" },
  { id: "chocolate", price: 90000, image: "/bouquets/clean/p10.jpg" },
  { id: "balloon", price: 70000, image: "/bouquets/clean/p01.jpg" },
  { id: "led", price: 80000, image: "/bouquets/clean/p12.jpg" },
];

export type BuilderSelection = {
  sizeId: string;
  moodId: string;
  wrapId: string;
  ribbonId: string;
  addonIds: string[];
};

export function calcBuilderBreakdown(input: BuilderSelection) {
  const size = builderSizes.find((o) => o.id === input.sizeId);
  const mood = builderMoods.find((o) => o.id === input.moodId);
  const wrap = builderWraps.find((o) => o.id === input.wrapId);
  const ribbon = builderRibbons.find((o) => o.id === input.ribbonId);
  const addons = input.addonIds
    .map((id) => builderAddons.find((o) => o.id === id))
    .filter(Boolean) as BuilderOption[];

  const sizePrice = size?.price ?? 0;
  const moodPrice = mood?.price ?? 0;
  const wrapPrice = wrap?.price ?? 0;
  const ribbonPrice = ribbon?.price ?? 0;
  const addonsPrice = addons.reduce((sum, o) => sum + o.price, 0);

  return {
    size,
    mood,
    wrap,
    ribbon,
    addons,
    sizePrice,
    moodPrice,
    wrapPrice,
    ribbonPrice,
    addonsPrice,
    subtotal:
      sizePrice + moodPrice + wrapPrice + ribbonPrice + addonsPrice,
  };
}

export function calcBuilderTotal(input: BuilderSelection) {
  return calcBuilderBreakdown(input).subtotal;
}

export function previewImageFor(input: BuilderSelection) {
  const mood = builderMoods.find((o) => o.id === input.moodId);
  return mood?.image ?? "/bouquets/shown/w-06.jpg";
}
