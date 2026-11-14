#!/usr/bin/env node
/**
 * Legacy entry: bouquet import from buckets folder.
 * Prefer: npm run catalog:import-basket / catalog:import-stand-congrats
 * or IMPORT_PRODUCT_TYPE=… node scripts/import-catalog-folder.mjs
 */
process.env.IMPORT_PRODUCT_TYPE = process.env.IMPORT_PRODUCT_TYPE || "bouquet";
await import("./import-catalog-folder.mjs");
