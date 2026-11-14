import { Prisma } from "@prisma/client";
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

function scopeSql(scope: BulkPriceScope): Prisma.Sql {
  if (scope === "published") return Prisma.sql`"published" = true`;
  if (scope === "hidden") return Prisma.sql`"published" = false`;
  return Prisma.sql`TRUE`;
}

/** Round VND bump: GREATEST(1000, ROUND(col * factor / 1000) * 1000). */
function bumpSql(column: Prisma.Sql, factor: number): Prisma.Sql {
  return Prisma.sql`CASE
    WHEN ${column} IS NOT NULL AND ${column} > 0
    THEN GREATEST(1000, (ROUND((${column}::numeric * ${factor}) / 1000) * 1000)::integer)
    ELSE ${column}
  END`;
}

/**
 * List/sort price = min of positive size prices, else fallback expression.
 * Uses NEW size values from CTE aliases.
 */
function listPriceSql(
  sm: Prisma.Sql,
  md: Prisma.Sql,
  lg: Prisma.Sql,
  fallback: Prisma.Sql,
): Prisma.Sql {
  return Prisma.sql`COALESCE(
    (
      SELECT MIN(v)
      FROM UNNEST(ARRAY[${sm}, ${md}, ${lg}]) AS t(v)
      WHERE v IS NOT NULL AND v > 0
    ),
    ${fallback}
  )`;
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

/**
 * Apply markup % to current sale prices (and Was if present).
 * One SQL UPDATE — avoids ~N sequential Prisma updates that hang the admin action.
 */
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
  const allSizes =
    sizes.includes("sm") && sizes.includes("md") && sizes.includes("lg");

  if (!allSizes) {
    return bulkApplyMarkupPercentChunked({ percent, scope: opts.scope, sizes });
  }

  const where = scopeSql(opts.scope);
  const count = await prisma.$executeRaw`
    WITH src AS (
      SELECT
        id,
        ${bumpSql(Prisma.sql`"priceSm"`, factor)} AS "priceSm",
        ${bumpSql(Prisma.sql`"priceMd"`, factor)} AS "priceMd",
        ${bumpSql(Prisma.sql`"priceLg"`, factor)} AS "priceLg",
        ${bumpSql(Prisma.sql`"compareAtSm"`, factor)} AS "compareAtSm",
        ${bumpSql(Prisma.sql`"compareAtMd"`, factor)} AS "compareAtMd",
        ${bumpSql(Prisma.sql`"compareAtLg"`, factor)} AS "compareAtLg",
        ${bumpSql(Prisma.sql`"compareAtPrice"`, factor)} AS "compareAtPrice",
        ${bumpSql(Prisma.sql`"price"`, factor)} AS "priceLegacy"
      FROM "Product"
      WHERE ${where}
    )
    UPDATE "Product" AS p
    SET
      "priceSm" = s."priceSm",
      "priceMd" = s."priceMd",
      "priceLg" = s."priceLg",
      "compareAtSm" = s."compareAtSm",
      "compareAtMd" = s."compareAtMd",
      "compareAtLg" = s."compareAtLg",
      "compareAtPrice" = s."compareAtPrice",
      "price" = ${listPriceSql(
        Prisma.sql`s."priceSm"`,
        Prisma.sql`s."priceMd"`,
        Prisma.sql`s."priceLg"`,
        Prisma.sql`s."priceLegacy"`,
      )},
      "priceGrand" = NULL,
      "compareAtGrand" = NULL,
      "updatedAt" = NOW()
    FROM src AS s
    WHERE p.id = s.id
  `;
  return Number(count);
}

/** Rare partial-size path: small parallel batches, not one-by-one. */
async function bulkApplyMarkupPercentChunked(opts: {
  percent: number;
  scope: BulkPriceScope;
  sizes: ProductSizeId[];
}) {
  const factor = 1 + opts.percent / 100;
  const bump = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value) || value <= 0) return null;
    return roundVnd(value * factor);
  };
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

  const CHUNK = 40;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    await prisma.$transaction(
      slice.map((row) => {
        const next = {
          priceSm: opts.sizes.includes("sm") ? bump(row.priceSm) : row.priceSm,
          priceMd: opts.sizes.includes("md") ? bump(row.priceMd) : row.priceMd,
          priceLg: opts.sizes.includes("lg") ? bump(row.priceLg) : row.priceLg,
          compareAtSm: opts.sizes.includes("sm")
            ? bump(row.compareAtSm)
            : row.compareAtSm,
          compareAtMd: opts.sizes.includes("md")
            ? bump(row.compareAtMd)
            : row.compareAtMd,
          compareAtLg: opts.sizes.includes("lg")
            ? bump(row.compareAtLg)
            : row.compareAtLg,
          compareAtPrice: bump(row.compareAtPrice),
        };
        const listPrice = syncListPrice(
          { sm: next.priceSm, md: next.priceMd, lg: next.priceLg },
          bump(row.price) || row.price,
        );
        return prisma.product.update({
          where: { id: row.id },
          data: {
            ...next,
            price: listPrice,
            priceGrand: null,
            compareAtGrand: null,
          },
        });
      }),
    );
  }
  return rows.length;
}

/**
 * Discount day: current Sale → Was (if Was empty or lower), Sale *= (1 - %).
 * Single SQL UPDATE.
 */
export async function bulkApplyDiscountPercent(opts: {
  percent: number;
  scope: BulkPriceScope;
}) {
  const percent = opts.percent;
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return 0;
  const factor = 1 - percent / 100;
  const where = scopeSql(opts.scope);

  const count = await prisma.$executeRaw`
    WITH src AS (
      SELECT
        id,
        CASE
          WHEN "priceSm" IS NOT NULL AND "priceSm" > 0
          THEN GREATEST(1000, (ROUND(("priceSm"::numeric * ${factor}) / 1000) * 1000)::integer)
          ELSE "priceSm"
        END AS "priceSm",
        CASE
          WHEN "priceMd" IS NOT NULL AND "priceMd" > 0
          THEN GREATEST(1000, (ROUND(("priceMd"::numeric * ${factor}) / 1000) * 1000)::integer)
          ELSE "priceMd"
        END AS "priceMd",
        CASE
          WHEN "priceLg" IS NOT NULL AND "priceLg" > 0
          THEN GREATEST(1000, (ROUND(("priceLg"::numeric * ${factor}) / 1000) * 1000)::integer)
          ELSE "priceLg"
        END AS "priceLg",
        CASE
          WHEN "price" > 0
          THEN GREATEST(1000, (ROUND(("price"::numeric * ${factor}) / 1000) * 1000)::integer)
          ELSE "price"
        END AS "priceLegacy",
        CASE
          WHEN "priceSm" IS NOT NULL AND "priceSm" > 0
            AND ("compareAtSm" IS NULL OR "compareAtSm" <= "priceSm")
          THEN "priceSm"
          ELSE "compareAtSm"
        END AS "compareAtSm",
        CASE
          WHEN "priceMd" IS NOT NULL AND "priceMd" > 0
            AND ("compareAtMd" IS NULL OR "compareAtMd" <= "priceMd")
          THEN "priceMd"
          ELSE "compareAtMd"
        END AS "compareAtMd",
        CASE
          WHEN "priceLg" IS NOT NULL AND "priceLg" > 0
            AND ("compareAtLg" IS NULL OR "compareAtLg" <= "priceLg")
          THEN "priceLg"
          ELSE "compareAtLg"
        END AS "compareAtLg",
        CASE
          WHEN "price" > 0
            AND ("compareAtPrice" IS NULL OR "compareAtPrice" <= "price")
          THEN "price"
          ELSE "compareAtPrice"
        END AS "compareAtPrice"
      FROM "Product"
      WHERE ${where}
    )
    UPDATE "Product" AS p
    SET
      "priceSm" = s."priceSm",
      "priceMd" = s."priceMd",
      "priceLg" = s."priceLg",
      "compareAtSm" = s."compareAtSm",
      "compareAtMd" = s."compareAtMd",
      "compareAtLg" = s."compareAtLg",
      "compareAtPrice" = s."compareAtPrice",
      "price" = ${listPriceSql(
        Prisma.sql`s."priceSm"`,
        Prisma.sql`s."priceMd"`,
        Prisma.sql`s."priceLg"`,
        Prisma.sql`s."priceLegacy"`,
      )},
      "priceGrand" = NULL,
      "compareAtGrand" = NULL,
      "updatedAt" = NOW()
    FROM src AS s
    WHERE p.id = s.id
  `;
  return Number(count);
}

/** End discount day: restore Sale from Was, clear Was. Single SQL UPDATE. */
export async function bulkClearDiscounts(opts: { scope: BulkPriceScope }) {
  const where = scopeSql(opts.scope);

  const count = await prisma.$executeRaw`
    WITH src AS (
      SELECT
        id,
        CASE
          WHEN "compareAtSm" IS NOT NULL AND "compareAtSm" > 0 THEN "compareAtSm"
          ELSE "priceSm"
        END AS "priceSm",
        CASE
          WHEN "compareAtMd" IS NOT NULL AND "compareAtMd" > 0 THEN "compareAtMd"
          ELSE "priceMd"
        END AS "priceMd",
        CASE
          WHEN "compareAtLg" IS NOT NULL AND "compareAtLg" > 0 THEN "compareAtLg"
          ELSE "priceLg"
        END AS "priceLg",
        CASE
          WHEN "compareAtPrice" IS NOT NULL AND "compareAtPrice" > 0 THEN "compareAtPrice"
          ELSE "price"
        END AS "priceLegacy"
      FROM "Product"
      WHERE ${where}
    )
    UPDATE "Product" AS p
    SET
      "priceSm" = s."priceSm",
      "priceMd" = s."priceMd",
      "priceLg" = s."priceLg",
      "price" = ${listPriceSql(
        Prisma.sql`s."priceSm"`,
        Prisma.sql`s."priceMd"`,
        Prisma.sql`s."priceLg"`,
        Prisma.sql`s."priceLegacy"`,
      )},
      "compareAtPrice" = NULL,
      "compareAtSm" = NULL,
      "compareAtMd" = NULL,
      "compareAtLg" = NULL,
      "priceGrand" = NULL,
      "compareAtGrand" = NULL,
      "updatedAt" = NOW()
    FROM src AS s
    WHERE p.id = s.id
  `;
  return Number(count);
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
