export type BuilderOption = {
  id: string;
  price: number;
  swatch?: string;
};

export const builderSizes: BuilderOption[] = [
  { id: "mini", price: 450000, swatch: "#e7c6c4" },
  { id: "classic", price: 750000, swatch: "#c07a76" },
  { id: "grand", price: 1200000, swatch: "#2f3b32" },
];

export const builderMoods: BuilderOption[] = [
  { id: "soft-blush", price: 0, swatch: "#f0d5d2" },
  { id: "bold-rose", price: 80000, swatch: "#9b3d45" },
  { id: "garden", price: 50000, swatch: "#8b9a7d" },
  { id: "white-clean", price: 40000, swatch: "#f6f0e6" },
  { id: "sunset", price: 90000, swatch: "#d4926a" },
];

export const builderWraps: BuilderOption[] = [
  { id: "kraft", price: 0, swatch: "#c4a574" },
  { id: "pastel", price: 30000, swatch: "#e8d4e0" },
  { id: "korean-dark", price: 50000, swatch: "#3a2f35" },
  { id: "sheer", price: 40000, swatch: "#efe8f2" },
];

export const builderRibbons: BuilderOption[] = [
  { id: "satin", price: 0, swatch: "#c07a76" },
  { id: "wide-bow", price: 40000, swatch: "#8b3a4a" },
  { id: "pearl", price: 60000, swatch: "#d9d0c3" },
];

export const builderAddons: BuilderOption[] = [
  { id: "card", price: 30000 },
  { id: "dried", price: 50000 },
  { id: "teddy", price: 120000 },
  { id: "chocolate", price: 90000 },
  { id: "balloon", price: 70000 },
  { id: "led", price: 80000 },
];

export function calcBuilderTotal(input: {
  sizeId: string;
  moodId: string;
  wrapId: string;
  ribbonId: string;
  addonIds: string[];
}) {
  const size = builderSizes.find((o) => o.id === input.sizeId)?.price ?? 0;
  const mood = builderMoods.find((o) => o.id === input.moodId)?.price ?? 0;
  const wrap = builderWraps.find((o) => o.id === input.wrapId)?.price ?? 0;
  const ribbon = builderRibbons.find((o) => o.id === input.ribbonId)?.price ?? 0;
  const addons = input.addonIds.reduce((sum, id) => {
    return sum + (builderAddons.find((o) => o.id === id)?.price ?? 0);
  }, 0);
  return size + mood + wrap + ribbon + addons;
}
