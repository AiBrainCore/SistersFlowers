/**
 * Bouquet builder catalog — defaults + helpers.
 * Live prices/options are editable in Admin → Bouquet builder
 * and stored in BuilderSettings (falls back to these defaults).
 */
export type BuilderLocationId = "dalat" | "danang";

export type BuilderOption = {
  id: string;
  price: number;
  swatch?: string;
  /** Representative studio photo — illustrative, not an exact final product */
  image?: string;
  active?: boolean;
  sortOrder?: number;
  labelEn?: string;
  labelVi?: string;
};

export type BuilderCatalog = {
  sizes: BuilderOption[];
  moods: BuilderOption[];
  wraps: BuilderOption[];
  ribbons: BuilderOption[];
  addons: BuilderOption[];
};

export const DEFAULT_BUILDER_LOCATION: BuilderLocationId = "danang";

/** Three compact sizes — Small / Medium / Large */
export const builderSizes: BuilderOption[] = [
  {
    id: "mini",
    price: 450000,
    swatch: "#e7c6c4",
    active: true,
    sortOrder: 10,
    labelEn: "Small",
    labelVi: "Nhỏ",
  },
  {
    id: "classic",
    price: 750000,
    swatch: "#e86a2b",
    active: true,
    sortOrder: 20,
    labelEn: "Medium",
    labelVi: "Vừa",
  },
  {
    id: "grand",
    price: 1200000,
    swatch: "#2f3b32",
    active: true,
    sortOrder: 30,
    labelEn: "Large",
    labelVi: "Lớn",
  },
];

/** Four colour moods — included in the size price (no upsell label) */
export const builderMoods: BuilderOption[] = [
  {
    id: "soft-blush",
    price: 0,
    swatch: "#f0d5d2",
    image: "/bouquets/shown/w-06.jpg",
    active: true,
    sortOrder: 10,
    labelEn: "Soft blush",
    labelVi: "Hồng mềm",
  },
  {
    id: "bold-rose",
    price: 0,
    swatch: "#9b3d45",
    image: "/bouquets/shown/w-08.jpg",
    active: true,
    sortOrder: 20,
    labelEn: "Deep rose",
    labelVi: "Hồng đậm",
  },
  {
    id: "garden",
    price: 0,
    swatch: "#8b9a7d",
    image: "/bouquets/shown/w-09.jpg",
    active: true,
    sortOrder: 30,
    labelEn: "Garden colour",
    labelVi: "Vườn xanh",
  },
  {
    id: "white-clean",
    price: 0,
    swatch: "#f6f0e6",
    image: "/bouquets/shown/w-05.jpg",
    active: true,
    sortOrder: 40,
    labelEn: "Ivory & soft",
    labelVi: "Trắng mềm",
  },
];

export const builderWraps: BuilderOption[] = [
  {
    id: "kraft",
    price: 0,
    swatch: "#c4a574",
    image: "/bouquets/shown/w-10.jpg",
    active: true,
    sortOrder: 10,
    labelEn: "Kraft paper",
    labelVi: "Giấy kraft",
  },
  {
    id: "pastel",
    price: 30000,
    swatch: "#e8d4e0",
    image: "/bouquets/shown/w-07.jpg",
    active: true,
    sortOrder: 20,
    labelEn: "Pastel paper",
    labelVi: "Giấy pastel",
  },
  {
    id: "deep-ink",
    price: 50000,
    swatch: "#3a2f35",
    image: "/bouquets/shown/w-01.jpg",
    active: true,
    sortOrder: 30,
    labelEn: "Deep wrap",
    labelVi: "Giấy đậm",
  },
  {
    id: "sheer",
    price: 40000,
    swatch: "#efe8f2",
    image: "/bouquets/shown/w-02.jpg",
    active: true,
    sortOrder: 40,
    labelEn: "Soft sheer layer",
    labelVi: "Lớp sheer",
  },
];

export const builderRibbons: BuilderOption[] = [
  {
    id: "satin",
    price: 0,
    swatch: "#c07a76",
    active: true,
    sortOrder: 10,
    labelEn: "Satin ribbon",
    labelVi: "Nơ satin",
  },
  {
    id: "wide-bow",
    price: 40000,
    swatch: "#e86a2b",
    active: true,
    sortOrder: 20,
    labelEn: "Wide bow",
    labelVi: "Nơ rộng",
  },
  {
    id: "pearl",
    price: 60000,
    swatch: "#d9d0c3",
    active: true,
    sortOrder: 30,
    labelEn: "Pearl ribbon",
    labelVi: "Nơ pearl",
  },
];

export const builderAddons: BuilderOption[] = [
  {
    id: "card",
    price: 30000,
    image: "/bouquets/clean/p05.jpg",
    active: true,
    sortOrder: 10,
    labelEn: "Handwritten card",
    labelVi: "Thiệp viết tay",
  },
  {
    id: "dried",
    price: 50000,
    image: "/bouquets/clean/p08.jpg",
    active: true,
    sortOrder: 20,
    labelEn: "Dried accent",
    labelVi: "Hoa khô điểm",
  },
  {
    id: "teddy",
    price: 120000,
    image: "/bouquets/clean/p03.jpg",
    active: true,
    sortOrder: 30,
    labelEn: "Mini teddy",
    labelVi: "Gấu nhỏ",
  },
  {
    id: "chocolate",
    price: 90000,
    image: "/bouquets/clean/p10.jpg",
    active: true,
    sortOrder: 40,
    labelEn: "Chocolate",
    labelVi: "Socola",
  },
  {
    id: "balloon",
    price: 70000,
    image: "/bouquets/clean/p01.jpg",
    active: true,
    sortOrder: 50,
    labelEn: "Balloon",
    labelVi: "Bóng bay",
  },
  {
    id: "led",
    price: 80000,
    image: "/bouquets/clean/p12.jpg",
    active: true,
    sortOrder: 60,
    labelEn: "LED lights",
    labelVi: "Đèn LED",
  },
];

export const DEFAULT_BUILDER_CATALOG: BuilderCatalog = {
  sizes: builderSizes,
  moods: builderMoods,
  wraps: builderWraps,
  ribbons: builderRibbons,
  addons: builderAddons,
};

export type BuilderSelection = {
  sizeId: string;
  moodId: string;
  wrapId: string;
  ribbonId: string;
  addonIds: string[];
};

function sortActive(options: BuilderOption[]) {
  return options
    .filter((o) => o.active !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function activeBuilderCatalog(catalog: BuilderCatalog): BuilderCatalog {
  return {
    sizes: sortActive(catalog.sizes),
    moods: sortActive(catalog.moods),
    wraps: sortActive(catalog.wraps),
    ribbons: sortActive(catalog.ribbons),
    addons: sortActive(catalog.addons),
  };
}

export function optionLabel(
  option: BuilderOption | undefined,
  locale: "en" | "vi",
  fallbackId: string,
) {
  if (!option) return fallbackId;
  if (locale === "vi") return option.labelVi || option.labelEn || option.id;
  return option.labelEn || option.labelVi || option.id;
}

export function calcBuilderBreakdown(
  input: BuilderSelection,
  catalog: BuilderCatalog = DEFAULT_BUILDER_CATALOG,
) {
  const active = activeBuilderCatalog(catalog);
  const size = active.sizes.find((o) => o.id === input.sizeId);
  const mood = active.moods.find((o) => o.id === input.moodId);
  const wrap = active.wraps.find((o) => o.id === input.wrapId);
  const ribbon = active.ribbons.find((o) => o.id === input.ribbonId);
  const addons = input.addonIds
    .map((id) => active.addons.find((o) => o.id === id))
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
    subtotal: sizePrice + moodPrice + wrapPrice + ribbonPrice + addonsPrice,
  };
}

export function calcBuilderTotal(
  input: BuilderSelection,
  catalog: BuilderCatalog = DEFAULT_BUILDER_CATALOG,
) {
  return calcBuilderBreakdown(input, catalog).subtotal;
}

export function previewImageFor(
  input: BuilderSelection,
  catalog: BuilderCatalog = DEFAULT_BUILDER_CATALOG,
) {
  const mood = catalog.moods.find((o) => o.id === input.moodId);
  return mood?.image ?? "/bouquets/shown/w-06.jpg";
}
