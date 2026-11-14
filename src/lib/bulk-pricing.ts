import { prisma } from "@/lib/db";
import {
  DEFAULT_SIZE_PRICES,
  PRODUCT_SIZES,
  roundVnd,
  syncListPrice,
  type ProductSizeId,
} from "@/lib/product-sizes";

export type BulkPriceScope = "all" | "published" | "hidden";

function scopeWhere(scope: BulkPriceScope) {
  if (scope === "published") return { published: true };
  if (scope === "hidden") return { published: false };
  return {};
}

function bump(value: number | null | undefined, factor: number) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return roundVnd(value * factor);
}

/** Set absolute S/M/L ladder; clear XL/grand and optional Was. */
export async function bulkSetAbsoluteSizePrices(opts: {
  sm: number;
  md: number;
  lg: number;
  scope: BulkPriceScope;
  clearWas?: boolean;
  clearCitySizeOverrides?: boolean;
}) {
  const sm = roundVnd(opts.sm);
  const md = roundVnd(opts.md);
  const lg = roundVnd(opts.lg);
  const listPrice = syncListPrice({ sm, md, lg }, sm);

  const result = await prisma.product.updateMany({
    where: scopeWhere(opts.scope),
    data: {
      price: listPrice,
      priceSm: sm,
      priceMd: md,
      priceLg: lg,
      priceGrand: null,
      ...(opts.clearWas
        ? {
            compareAtPrice: null,
            compareAtSm: null,
            compareAtMd: null,
            compareAtLg: null,
            compareAtGrand: null,
          }
        : { compareAtGrand: null }),
    },
  });

  if (opts.clearCitySizeOverrides !== false) {
    await prisma.productCityAvailability.updateMany({
      data: {
        priceSm: null,
        priceMd: null,
        priceLg: null,
        priceGrand: null,
        priceOverride: null,
      },
    });
  } else {
    await prisma.productCityAvailability.updateMany({
      data: { priceGrand: null },
    });
  }

  return result.count;
}

/** Apply markup % to current sale prices (and Was if present). */
export async function bulkApplyMarkupPercent(opts: {
  percent: number;
  scope: BulkPriceScope;
  sizes?: ProductSizeId[];
}) {
  const percent = opts.percent;
  if (!Number.isFinite(percent) || percent === 0) return 0;
  const factor = 1 + percent / 100;
  const sizes = opts.sizes?.length
    ? opts.sizes
    : PRODUCT_SIZES.map((s) => s.id);

  const rows = await prisma.product.findMany({
    where: scopeWhere(opts.scope),
    select: {
      id: true,
      price: true,
      priceSm: true,
      priceMd: true,
      priceLg: true,
      compareAtPrice: true,
      compareAtSm: true,
      compareAtMd: true,
      compareAtLg: true,
    },
  });

  let updated = 0;
  for (const row of rows) {
    const next = {
      priceSm: sizes.includes("sm") ? bump(row.priceSm, factor) : row.priceSm,
      priceMd: sizes.includes("md") ? bump(row.priceMd, factor) : row.priceMd,
      priceLg: sizes.includes("lg") ? bump(row.priceLg, factor) : row.priceLg,
      compareAtSm: sizes.includes("sm")
        ? bump(row.compareAtSm, factor)
        : row.compareAtSm,
      compareAtMd: sizes.includes("md")
        ? bump(row.compareAtMd, factor)
        : row.compareAtMd,
      compareAtLg: sizes.includes("lg")
        ? bump(row.compareAtLg, factor)
        : row.compareAtLg,
      compareAtPrice: bump(row.compareAtPrice, factor),
    };
    const listPrice = syncListPrice(
      { sm: next.priceSm, md: next.priceMd, lg: next.priceLg },
      bump(row.price, factor) || row.price,
    );
    await prisma.product.update({
      where: { id: row.id },
      data: { ...next, price: listPrice, priceGrand: null, compareAtGrand: null },
    });
    updated += 1;
  }
  return updated;
}

/**
 * Discount day: current Sale → Was (if Was empty or lower), Sale *= (1 - %).
 * Shop shows ~~Was~~ Sale in rose.
 */
export async function bulkApplyDiscountPercent(opts: {
  percent: number;
  scope: BulkPriceScope;
}) {
  const percent = opts.percent;
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return 0;
  const factor = 1 - percent / 100;

  const rows = await prisma.product.findMany({
    where: scopeWhere(opts.scope),
    select: {
      id: true,
      price: true,
      priceSm: true,
      priceMd: true,
      priceLg: true,
      compareAtPrice: true,
      compareAtSm: true,
      compareAtMd: true,
      compareAtLg: true,
    },
  });

  let updated = 0;
  for (const row of rows) {
    const discountSize = (
      sale: number | null,
      was: number | null,
    ): { sale: number | null; was: number | null } => {
      if (sale == null || sale <= 0) return { sale, was };
      const nextWas = was != null && was > sale ? was : sale;
      return { sale: roundVnd(sale * factor), was: nextWas };
    };

    const sm = discountSize(row.priceSm, row.compareAtSm);
    const md = discountSize(row.priceMd, row.compareAtMd);
    const lg = discountSize(row.priceLg, row.compareAtLg);
    const legacy = discountSize(row.price, row.compareAtPrice);

    const listPrice = syncListPrice(
      { sm: sm.sale, md: md.sale, lg: lg.sale },
      legacy.sale || row.price,
    );

    await prisma.product.update({
      where: { id: row.id },
      data: {
        price: listPrice,
        priceSm: sm.sale,
        priceMd: md.sale,
        priceLg: lg.sale,
        priceGrand: null,
        compareAtSm: sm.was,
        compareAtMd: md.was,
        compareAtLg: lg.was,
        compareAtPrice: legacy.was,
        compareAtGrand: null,
      },
    });
    updated += 1;
  }
  return updated;
}

/** End discount day: restore Sale from Was, clear Was. */
export async function bulkClearDiscounts(opts: { scope: BulkPriceScope }) {
  const rows = await prisma.product.findMany({
    where: scopeWhere(opts.scope),
    select: {
      id: true,
      price: true,
      priceSm: true,
      priceMd: true,
      priceLg: true,
      compareAtPrice: true,
      compareAtSm: true,
      compareAtMd: true,
      compareAtLg: true,
    },
  });

  let updated = 0;
  for (const row of rows) {
    const restore = (sale: number | null, was: number | null) =>
      was != null && was > 0 ? was : sale;

    const priceSm = restore(row.priceSm, row.compareAtSm);
    const priceMd = restore(row.priceMd, row.compareAtMd);
    const priceLg = restore(row.priceLg, row.compareAtLg);
    const legacy = restore(row.price, row.compareAtPrice);
    const listPrice = syncListPrice(
      { sm: priceSm, md: priceMd, lg: priceLg },
      legacy || row.price,
    );

    await prisma.product.update({
      where: { id: row.id },
      data: {
        price: listPrice,
        priceSm,
        priceMd,
        priceLg,
        priceGrand: null,
        compareAtPrice: null,
        compareAtSm: null,
        compareAtMd: null,
        compareAtLg: null,
        compareAtGrand: null,
      },
    });
    updated += 1;
  }
  return updated;
}

export async function bulkApplyDefaultLadder(scope: BulkPriceScope = "all") {
  return bulkSetAbsoluteSizePrices({
    sm: DEFAULT_SIZE_PRICES.sm,
    md: DEFAULT_SIZE_PRICES.md,
    lg: DEFAULT_SIZE_PRICES.lg,
    scope,
    clearWas: true,
    clearCitySizeOverrides: true,
  });
}
