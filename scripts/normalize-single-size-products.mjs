#!/usr/bin/env node
/**
 * Clear S/M/L matrix for non-bouquet products (basket / stands).
 * Keeps a single list price (prefer Medium, else current price).
 *
 *   node scripts/normalize-single-size-products.mjs
 *   DRY_RUN=1 node scripts/normalize-single-size-products.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.env.DRY_RUN === "1";

async function loadEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

await loadEnv(path.join(ROOT, ".env.local"));
await loadEnv(path.join(ROOT, "secrets", "supabase.env"));

const prisma = new PrismaClient();
const rows = await prisma.product.findMany({
  where: { productType: { not: "bouquet" } },
  select: {
    id: true,
    slug: true,
    productType: true,
    price: true,
    priceSm: true,
    priceMd: true,
    priceLg: true,
  },
});

let updated = 0;
for (const row of rows) {
  const single =
    (row.priceMd && row.priceMd > 0 ? row.priceMd : null) ||
    (row.price && row.price > 0 ? row.price : null) ||
    (row.priceSm && row.priceSm > 0 ? row.priceSm : null) ||
    (row.priceLg && row.priceLg > 0 ? row.priceLg : null) ||
    600_000;
  const needs =
    row.priceSm != null ||
    row.priceMd != null ||
    row.priceLg != null ||
    row.price !== single;
  if (!needs) continue;
  console.log(
    `${row.productType} ${row.slug}: ${row.priceSm}/${row.priceMd}/${row.priceLg} → single ${single}`,
  );
  if (!DRY) {
    await prisma.product.update({
      where: { id: row.id },
      data: {
        price: single,
        priceSm: null,
        priceMd: null,
        priceLg: null,
        priceGrand: null,
        compareAtSm: null,
        compareAtMd: null,
        compareAtLg: null,
        compareAtGrand: null,
      },
    });
    await prisma.productCityAvailability.updateMany({
      where: { productId: row.id },
      data: {
        priceSm: null,
        priceMd: null,
        priceLg: null,
        priceGrand: null,
        priceOverride: null,
      },
    });
  }
  updated += 1;
}

await prisma.$disconnect();
console.log(`Done. ${DRY ? "would update" : "updated"}=${updated} / ${rows.length}`);
