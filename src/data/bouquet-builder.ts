/**
 * Custom bouquet builder catalog (V3 rules).
 * - S/M/L size = base price
 * - Colour mood / standard wrap / ribbon = free style direction
 * - Premiums + gift extras = optional paid add-ons (admin-configured)
 * Florist chooses actual stems/species from availability.
 */
export type BuilderLocationId = "dalat" | "danang";

export type BuilderOption = {
  id: string;
  price: number;
  swatch?: string;
  /** Optional reference image — not required for V3 swatch UI */
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
  /** Paid upgrades (premium materials, floral upgrades) — admin configured */
  premiums: BuilderOption[];
  addons: BuilderOption[];
};

export const DEFAULT_BUILDER_LOCATION: BuilderLocationId = "danang";

/**
 * Three sizes (S / M / L) — customer names Small / Medium / Large.
 * IDs: small, classic, grand (not mini — that mismatched “Small”).
 */
export const builderSizes: BuilderOption[] = [
  {
    id: "small",
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

/** Legacy builder size ids → current ids (saved catalogs / old inquiry links). */
export const BUILDER_SIZE_ID_ALIASES: Record<string, string> = {
  mini: "small",
  medium: "classic",
  large: "grand",
  sm: "small",
  md: "classic",
  lg: "grand",
};

export function normalizeBuilderSizeId(id: string): string {
  return BUILDER_SIZE_ID_ALIASES[id] || id;
}

/** Colour moods — always free */
export const builderMoods: BuilderOption[] = [
  {
    id: "soft-blush",
    price: 0,
    swatch: "#f0d5d2",
    active: true,
    sortOrder: 10,
    labelEn: "Soft blush",
    labelVi: "Hồng mềm",
  },
  {
    id: "bold-rose",
    price: 0,
    swatch: "#9b3d45",
    active: true,
    sortOrder: 20,
    labelEn: "Deep rose",
    labelVi: "Hồng đậm",
  },
  {
    id: "garden",
    price: 0,
    swatch: "#8b9a7d",
    active: true,
    sortOrder: 30,
    labelEn: "Garden colour",
    labelVi: "Vườn xanh",
  },
  {
    id: "white-clean",
    price: 0,
    swatch: "#f6f0e6",
    active: true,
    sortOrder: 40,
    labelEn: "Ivory & soft",
    labelVi: "Trắng mềm",
  },
  {
    id: "sunset",
    price: 0,
    swatch: "#d4926a",
    active: true,
    sortOrder: 50,
    labelEn: "Warm sunset",
    labelVi: "Hoàng hôn ấm",
  },
];

/** Standard wrapping colours — always free */
export const builderWraps: BuilderOption[] = [
  {
    id: "kraft",
    price: 0,
    swatch: "#c4a574",
    active: true,
    sortOrder: 10,
    labelEn: "Kraft",
    labelVi: "Kraft",
  },
  {
    id: "pastel",
    price: 0,
    swatch: "#e8d4e0",
    active: true,
    sortOrder: 20,
    labelEn: "Pastel",
    labelVi: "Pastel",
  },
  {
    id: "deep-ink",
    price: 0,
    swatch: "#3a2f35",
    active: true,
    sortOrder: 30,
    labelEn: "Deep ink",
    labelVi: "Đậm",
  },
  {
    id: "cream",
    price: 0,
    swatch: "#f3ebe0",
    active: true,
    sortOrder: 40,
    labelEn: "Cream",
    labelVi: "Kem",
  },
];

/** Standard ribbon colours — always free */
export const builderRibbons: BuilderOption[] = [
  {
    id: "satin",
    price: 0,
    swatch: "#c07a76",
    active: true,
    sortOrder: 10,
    labelEn: "Blush satin",
    labelVi: "Satin hồng",
  },
  {
    id: "citrus",
    price: 0,
    swatch: "#e86a2b",
    active: true,
    sortOrder: 20,
    labelEn: "Citrus",
    labelVi: "Cam cháy",
  },
  {
    id: "pearl",
    price: 0,
    swatch: "#d9d0c3",
    active: true,
    sortOrder: 30,
    labelEn: "Pearl",
    labelVi: "Ngọc trai",
  },
  {
    id: "forest",
    price: 0,
    swatch: "#2f3b32",
    active: true,
    sortOrder: 40,
    labelEn: "Forest",
    labelVi: "Rừng",
  },
];

/** Optional paid upgrades — only what admin enables */
export const builderPremiums: BuilderOption[] = [
  {
    id: "silk-wrap",
    price: 80000,
    swatch: "#c9b8a8",
    active: true,
    sortOrder: 10,
    labelEn: "Premium silk wrap",
    labelVi: "Giấy lụa cao cấp",
  },
  {
    id: "extra-blooms",
    price: 150000,
    swatch: "#c24712",
    active: true,
    sortOrder: 20,
    labelEn: "Extra seasonal blooms",
    labelVi: "Thêm hoa theo mùa",
  },
];

export const builderAddons: BuilderOption[] = [
  {
    id: "card",
    price: 30000,
    active: true,
    sortOrder: 10,
    labelEn: "Handwritten card",
    labelVi: "Thiệp viết tay",
  },
  {
    id: "teddy",
    price: 120000,
    active: true,
    sortOrder: 20,
    labelEn: "Mini teddy",
    labelVi: "Gấu nhỏ",
  },
  {
    id: "chocolate",
    price: 90000,
    active: true,
    sortOrder: 30,
    labelEn: "Chocolate",
    labelVi: "Socola",
  },
  {
    id: "balloon",
    price: 70000,
    active: true,
    sortOrder: 40,
    labelEn: "Balloon",
    labelVi: "Bóng bay",
  },
];

export const DEFAULT_BUILDER_CATALOG: BuilderCatalog = {
  sizes: builderSizes,
  moods: builderMoods,
  wraps: builderWraps,
  ribbons: builderRibbons,
  premiums: builderPremiums,
  addons: builderAddons,
};

export type BuilderSelection = {
  sizeId: string;
  moodId: string;
  wrapId: string;
  ribbonId: string;
  premiumIds: string[];
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
    premiums: sortActive(catalog.premiums ?? []),
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
  const premiums = (input.premiumIds ?? [])
    .map((id) => active.premiums.find((o) => o.id === id))
    .filter(Boolean) as BuilderOption[];
  const addons = (input.addonIds ?? [])
    .map((id) => active.addons.find((o) => o.id === id))
    .filter(Boolean) as BuilderOption[];

  // V3 rule: mood / standard wrap / ribbon never surcharge
  const sizePrice = size?.price ?? 0;
  const premiumsPrice = premiums.reduce((sum, o) => sum + o.price, 0);
  const addonsPrice = addons.reduce((sum, o) => sum + o.price, 0);

  return {
    size,
    mood,
    wrap,
    ribbon,
    premiums,
    addons,
    sizePrice,
    moodPrice: 0,
    wrapPrice: 0,
    ribbonPrice: 0,
    premiumsPrice,
    addonsPrice,
    subtotal: sizePrice + premiumsPrice + addonsPrice,
  };
}

export function calcBuilderTotal(
  input: BuilderSelection,
  catalog: BuilderCatalog = DEFAULT_BUILDER_CATALOG,
) {
  return calcBuilderBreakdown(input, catalog).subtotal;
}

/** Compact share query — no PII */
export function serializeBuilderQuery(selection: BuilderSelection): string {
  const params = new URLSearchParams();
  params.set("size", selection.sizeId);
  params.set("mood", selection.moodId);
  params.set("wrap", selection.wrapId);
  params.set("ribbon", selection.ribbonId);
  if (selection.premiumIds.length) {
    params.set("premium", selection.premiumIds.join(","));
  }
  if (selection.addonIds.length) {
    params.set("extras", selection.addonIds.join(","));
  }
  return params.toString();
}

export function parseBuilderQuery(
  raw: Record<string, string | string[] | undefined> | URLSearchParams,
  catalog: BuilderCatalog = DEFAULT_BUILDER_CATALOG,
): Partial<BuilderSelection> {
  const get = (key: string) => {
    if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const active = activeBuilderCatalog(catalog);
  const sizeRaw = get("size");
  const sizeId = sizeRaw ? normalizeBuilderSizeId(sizeRaw) : undefined;
  const moodId = get("mood");
  const wrapId = get("wrap");
  const ribbonId = get("ribbon");
  const premiumRaw = get("premium") ?? "";
  const extrasRaw = get("extras") ?? "";

  const premiumIds = premiumRaw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => active.premiums.some((o) => o.id === id));
  const addonIds = extrasRaw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => active.addons.some((o) => o.id === id));

  return {
    sizeId: sizeId && active.sizes.some((o) => o.id === sizeId) ? sizeId : undefined,
    moodId: moodId && active.moods.some((o) => o.id === moodId) ? moodId : undefined,
    wrapId: wrapId && active.wraps.some((o) => o.id === wrapId) ? wrapId : undefined,
    ribbonId:
      ribbonId && active.ribbons.some((o) => o.id === ribbonId) ? ribbonId : undefined,
    premiumIds,
    addonIds,
  };
}

export function buildOrderSnapshot(
  selection: BuilderSelection,
  catalog: BuilderCatalog,
  locale: "en" | "vi",
  cityLabel: string,
  specialRequest?: string,
) {
  const b = calcBuilderBreakdown(selection, catalog);
  const L = (o: BuilderOption | undefined, id: string) =>
    optionLabel(o, locale, id);
  const lines = [
    `Sisters Flowers — Custom bouquet request`,
    `City: ${cityLabel}`,
    `Size: ${L(b.size, selection.sizeId)} — ${b.sizePrice}`,
    `Colour mood: ${L(b.mood, selection.moodId)} (included)`,
    `Wrapping: ${L(b.wrap, selection.wrapId)} (included)`,
    `Ribbon: ${L(b.ribbon, selection.ribbonId)} (included)`,
    `Premiums: ${
      b.premiums.length
        ? b.premiums.map((p) => `${L(p, p.id)} +${p.price}`).join("; ")
        : "none"
    }`,
    `Gifts: ${
      b.addons.length
        ? b.addons.map((a) => `${L(a, a.id)} +${a.price}`).join("; ")
        : "none"
    }`,
    `Quoted total (VND): ${b.subtotal}`,
    `Note: Florist chooses stems/species from availability. Style preview is illustrative.`,
  ];
  if (specialRequest?.trim()) {
    lines.push(
      `Special request (florist review — price not auto-added): ${specialRequest.trim()}`,
    );
  }
  lines.push(
    `Snapshot: ${JSON.stringify({
      sizeId: selection.sizeId,
      moodId: selection.moodId,
      wrapId: selection.wrapId,
      ribbonId: selection.ribbonId,
      premiumIds: selection.premiumIds,
      addonIds: selection.addonIds,
      sizePrice: b.sizePrice,
      premiumsPrice: b.premiumsPrice,
      addonsPrice: b.addonsPrice,
      subtotal: b.subtotal,
    })}`,
  );
  return lines.join("\n");
}
