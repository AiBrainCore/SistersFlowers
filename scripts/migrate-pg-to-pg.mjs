#!/usr/bin/env node
/**
 * One-shot: copy public app tables Mumbai → Singapore (or any OLD_DIRECT_URL → DIRECT_URL).
 * Secrets from env; never printed.
 */
import { Client } from "pg";

const TABLES = [
  "Product",
  "Category",
  "ProductCategory",
  "City",
  "Branch",
  "ProductCityAvailability",
  "DeliverySettings",
  "DeliveryZone",
  "Addon",
  "Inquiry",
  "Order",
  "OrderItem",
];

function cleanUrl(url) {
  return url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
}

function clientFrom(url) {
  return new Client({
    connectionString: cleanUrl(url),
    ssl: { rejectUnauthorized: false },
  });
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function main() {
  const srcUrl = process.env.OLD_DIRECT_URL;
  const dstUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!srcUrl) throw new Error("OLD_DIRECT_URL required");
  if (!dstUrl) throw new Error("DIRECT_URL / DATABASE_URL required");

  const src = clientFrom(srcUrl);
  const dst = clientFrom(dstUrl);
  await src.connect();
  await dst.connect();

  const counts = {};
  for (const t of TABLES) {
    const r = await src.query(`SELECT count(*)::int AS n FROM ${quoteIdent(t)}`);
    counts[t] = r.rows[0].n;
    console.log(`source ${t}: ${counts[t]}`);
  }

  await dst.query(`
    TRUNCATE TABLE
      "OrderItem", "Order", "Inquiry", "Addon",
      "ProductCategory", "ProductCityAvailability",
      "Branch", "City", "Product", "Category",
      "DeliveryZone", "DeliverySettings"
    RESTART IDENTITY CASCADE;
  `);

  for (const t of TABLES) {
    const { rows } = await src.query(`SELECT * FROM ${quoteIdent(t)}`);
    if (!rows.length) {
      console.log(`skip empty ${t}`);
      continue;
    }
    const cols = Object.keys(rows[0]);
    const colList = cols.map(quoteIdent).join(", ");
    for (const row of rows) {
      const vals = cols.map((c) => row[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      await dst.query(
        `INSERT INTO ${quoteIdent(t)} (${colList}) VALUES (${placeholders})`,
        vals,
      );
    }
    console.log(`copied ${t}: ${rows.length}`);
  }

  for (const t of TABLES) {
    const r = await dst.query(`SELECT count(*)::int AS n FROM ${quoteIdent(t)}`);
    console.log(`dest ${t}: ${r.rows[0].n} (src ${counts[t]})`);
  }

  await src.end();
  await dst.end();
  console.log("done");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
