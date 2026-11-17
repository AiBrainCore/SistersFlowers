import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  DEFAULT_BUILDER_CATALOG,
  normalizeBuilderSizeId,
  type BuilderCatalog,
  type BuilderOption,
} from "@/data/bouquet-builder";

const STALE_SIZE_LABEL_EN = new Set(["Medium", "Large"]);

function asOptions(
  value: unknown,
  fallback: BuilderOption[],
  opts?: { remapSizeIds?: boolean },
): BuilderOption[] {
  if (!Array.isArray(value)) return fallback.map((o) => ({ ...o }));
  const parsed = value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      if (typeof o.id !== "string" || !o.id.trim()) return null;
      const rawId = o.id.trim();
      const id = opts?.remapSizeIds ? normalizeBuilderSizeId(rawId) : rawId;
      const fallbackRow = fallback.find((f) => f.id === id);
      let labelEn =
        typeof o.labelEn === "string" ? o.labelEn : fallbackRow?.labelEn || id;
      // Align old defaults: mini→small, Medium→Classic, Large→Grand.
      if (opts?.remapSizeIds && fallbackRow) {
        if (rawId !== id || STALE_SIZE_LABEL_EN.has(labelEn)) {
          labelEn = fallbackRow.labelEn || id;
        }
      }
      return {
        id,
        price:
          typeof o.price === "number" && Number.isFinite(o.price) ? o.price : 0,
        swatch: typeof o.swatch === "string" ? o.swatch : undefined,
        image: typeof o.image === "string" ? o.image : undefined,
        active: o.active !== false,
        sortOrder:
          typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder)
            ? o.sortOrder
            : 0,
        labelEn,
        labelVi:
          typeof o.labelVi === "string"
            ? o.labelVi
            : fallbackRow?.labelVi || id,
      } satisfies BuilderOption;
    })
    .filter(Boolean) as BuilderOption[];
  return parsed.length > 0 ? parsed : fallback.map((o) => ({ ...o }));
}

/** Style choices never surcharge — keep stored prices at 0 for mood/wrap/ribbon */
function freeStyle(options: BuilderOption[]) {
  return options.map((o) => ({ ...o, price: 0 }));
}

function normalizeCatalog(raw: unknown): BuilderCatalog {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    sizes: asOptions(source.sizes, DEFAULT_BUILDER_CATALOG.sizes, {
      remapSizeIds: true,
    }),
    moods: freeStyle(asOptions(source.moods, DEFAULT_BUILDER_CATALOG.moods)),
    wraps: freeStyle(asOptions(source.wraps, DEFAULT_BUILDER_CATALOG.wraps)),
    ribbons: freeStyle(
      asOptions(source.ribbons, DEFAULT_BUILDER_CATALOG.ribbons),
    ),
    premiums: asOptions(
      source.premiums,
      DEFAULT_BUILDER_CATALOG.premiums,
    ),
    addons: asOptions(source.addons, DEFAULT_BUILDER_CATALOG.addons),
  };
}

export async function getBuilderCatalog(): Promise<BuilderCatalog> {
  try {
    const row = await prisma.builderSettings.findUnique({
      where: { id: "default" },
    });
    if (!row?.catalog) {
      return structuredClone(DEFAULT_BUILDER_CATALOG);
    }
    return normalizeCatalog(row.catalog);
  } catch {
    return structuredClone(DEFAULT_BUILDER_CATALOG);
  }
}

export async function saveBuilderCatalog(catalog: BuilderCatalog) {
  const normalized = normalizeCatalog(catalog);
  const json = normalized as unknown as Prisma.InputJsonValue;
  await prisma.builderSettings.upsert({
    where: { id: "default" },
    create: { id: "default", catalog: json },
    update: { catalog: json },
  });
  return normalized;
}
