#!/usr/bin/env node
/**
 * One-shot: copy Sisters Flowers data from prisma/dev.db (SQLite) → Supabase Postgres.
 * Requires DIRECT_URL (session pooler) in env. Secrets never printed.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Client } from "pg";

const SQLITE = "prisma/dev.db";
const OUT = "/tmp/sf-migrate";

function dump(table) {
  const sqlTable = table === "Order" ? '"Order"' : table;
  let raw = "";
  try {
    raw = execFileSync("sqlite3", ["-json", SQLITE, `SELECT * FROM ${sqlTable};`], {
      encoding: "utf8",
    }).trim();
  } catch {
    raw = "";
  }
  if (!raw) return [];
  return JSON.parse(raw);
}

function bool(v) {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return Boolean(v);
}

function ts(v) {
  if (v == null || v === "") return null;
  // SQLite Prisma often stores ISO strings already
  return new Date(v);
}

function intOrNull(v) {
  if (v == null || v === "") return null;
  return Number(v);
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL required");

  mkdirSync(OUT, { recursive: true });
  const tables = [
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
  const data = {};
  for (const t of tables) {
    data[t] = dump(t);
    writeFileSync(`${OUT}/${t}.json`, JSON.stringify(data[t], null, 2));
    console.log(`export ${t}: ${data[t].length}`);
  }

  // Pooler presents a chain Prisma accepts with sslmode=require; node-pg is stricter.
  const cleanUrl = url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
  const client = new Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Clean slate (safe — fresh Supabase project)
  await client.query(`
    TRUNCATE TABLE
      "OrderItem", "Order", "Inquiry", "Addon",
      "ProductCategory", "ProductCityAvailability",
      "Branch", "City", "Product", "Category",
      "DeliveryZone", "DeliverySettings"
    RESTART IDENTITY CASCADE;
  `);

  // Insert order respects FKs
  for (const p of data.Product) {
    await client.query(
      `INSERT INTO "Product" (
        id, slug, price, image, accent, "nameEn", "nameVi", "tagEn", "tagVi",
        "blurbEn", "blurbVi", "storyEn", "storyVi", published, "sortOrder",
        "createdAt", "updatedAt"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )`,
      [
        p.id,
        p.slug,
        Number(p.price),
        p.image,
        p.accent,
        p.nameEn,
        p.nameVi,
        p.tagEn,
        p.tagVi,
        p.blurbEn,
        p.blurbVi,
        p.storyEn,
        p.storyVi,
        bool(p.published),
        Number(p.sortOrder),
        ts(p.createdAt),
        ts(p.updatedAt),
      ],
    );
  }

  for (const c of data.Category) {
    await client.query(
      `INSERT INTO "Category" (
        id, slug, "nameEn", "nameVi", "sortOrder", active, "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        c.id,
        c.slug,
        c.nameEn,
        c.nameVi,
        Number(c.sortOrder),
        bool(c.active),
        ts(c.createdAt),
        ts(c.updatedAt),
      ],
    );
  }

  for (const pc of data.ProductCategory) {
    await client.query(
      `INSERT INTO "ProductCategory" ("productId","categoryId") VALUES ($1,$2)`,
      [pc.productId, pc.categoryId],
    );
  }

  for (const c of data.City) {
    await client.query(
      `INSERT INTO "City" (
        id, slug, "nameEn", "nameVi", status, "sortOrder", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        c.id,
        c.slug,
        c.nameEn,
        c.nameVi,
        c.status,
        Number(c.sortOrder),
        ts(c.createdAt),
        ts(c.updatedAt),
      ],
    );
  }

  for (const b of data.Branch) {
    await client.query(
      `INSERT INTO "Branch" (
        id, "cityId", slug, "nameEn", "nameVi", status, "isPrimary",
        "addressEn", "addressVi", "sortOrder", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        b.id,
        b.cityId,
        b.slug,
        b.nameEn,
        b.nameVi,
        b.status,
        bool(b.isPrimary),
        b.addressEn,
        b.addressVi,
        Number(b.sortOrder),
        ts(b.createdAt),
        ts(b.updatedAt),
      ],
    );
  }

  for (const row of data.ProductCityAvailability) {
    await client.query(
      `INSERT INTO "ProductCityAvailability" (
        id, "productId", "cityId", available, "priceOverride"
      ) VALUES ($1,$2,$3,$4,$5)`,
      [
        row.id,
        row.productId,
        row.cityId,
        bool(row.available),
        intOrNull(row.priceOverride),
      ],
    );
  }

  for (const d of data.DeliverySettings) {
    await client.query(
      `INSERT INTO "DeliverySettings" (
        id, "studioName", "includedKm", "baseFee", "midKm", "midFee",
        "maxKm", "maxFee", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        d.id,
        d.studioName,
        Number(d.includedKm),
        Number(d.baseFee),
        Number(d.midKm),
        Number(d.midFee),
        Number(d.maxKm),
        Number(d.maxFee),
        ts(d.updatedAt),
      ],
    );
  }

  for (const z of data.DeliveryZone) {
    await client.query(
      `INSERT INTO "DeliveryZone" (
        id, "nameEn", "nameVi", km, "quoteOnly", "noteEn", "noteVi",
        active, "sortOrder", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        z.id,
        z.nameEn,
        z.nameVi,
        Number(z.km),
        bool(z.quoteOnly),
        z.noteEn,
        z.noteVi,
        bool(z.active),
        Number(z.sortOrder),
        ts(z.createdAt),
        ts(z.updatedAt),
      ],
    );
  }

  for (const a of data.Addon) {
    await client.query(
      `INSERT INTO "Addon" (
        id, slug, kind, "nameEn", "nameVi", "descriptionEn", "descriptionVi",
        price, image, "requiresNote", "partnerName", "partnerCategory",
        "commissionPercent", "validityDays", active, "sortOrder",
        "createdAt", "updatedAt"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )`,
      [
        a.id,
        a.slug,
        a.kind,
        a.nameEn,
        a.nameVi,
        a.descriptionEn,
        a.descriptionVi,
        Number(a.price),
        a.image,
        bool(a.requiresNote),
        a.partnerName,
        a.partnerCategory,
        Number(a.commissionPercent),
        Number(a.validityDays),
        bool(a.active),
        Number(a.sortOrder),
        ts(a.createdAt),
        ts(a.updatedAt),
      ],
    );
  }

  for (const i of data.Inquiry) {
    await client.query(
      `INSERT INTO "Inquiry" (
        id, variant, name, email, phone, date, message, hotel, room, venue,
        guests, "citySlug", status, "createdAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        i.id,
        i.variant,
        i.name,
        i.email,
        i.phone,
        i.date,
        i.message,
        i.hotel,
        i.room,
        i.venue,
        i.guests,
        i.citySlug,
        i.status,
        ts(i.createdAt),
      ],
    );
  }

  for (const o of data.Order) {
    await client.query(
      `INSERT INTO "Order" (
        id, reference, locale, "customerName", phone, email, zone,
        "deliveryKm", "deliveryFee", address, "deliveryDate", "deliveryTime",
        notes, "recipientName", "hotelName", "roomNumber", subtotal,
        "deliveryTotal", status, "whatsappUrl", "createdAt"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )`,
      [
        o.id,
        o.reference,
        o.locale,
        o.customerName,
        o.phone,
        o.email,
        o.zone,
        intOrNull(o.deliveryKm),
        intOrNull(o.deliveryFee),
        o.address,
        o.deliveryDate,
        o.deliveryTime,
        o.notes,
        o.recipientName,
        o.hotelName,
        o.roomNumber,
        Number(o.subtotal),
        Number(o.deliveryTotal),
        o.status,
        o.whatsappUrl,
        ts(o.createdAt),
      ],
    );
  }

  for (const it of data.OrderItem) {
    await client.query(
      `INSERT INTO "OrderItem" (
        id, "orderId", slug, name, price, qty, image, kind, note,
        "partnerName", "commissionPercent", "commissionAmount",
        "voucherCode", "voucherStatus", "voucherExpiresAt", "redeemedAt",
        "remitAmount"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )`,
      [
        it.id,
        it.orderId,
        it.slug,
        it.name,
        Number(it.price),
        Number(it.qty),
        it.image,
        it.kind,
        it.note,
        it.partnerName,
        intOrNull(it.commissionPercent),
        intOrNull(it.commissionAmount),
        it.voucherCode,
        it.voucherStatus,
        ts(it.voucherExpiresAt),
        ts(it.redeemedAt),
        intOrNull(it.remitAmount),
      ],
    );
  }

  const check = await client.query(`
    SELECT 'Product' AS t, count(*)::int AS n FROM "Product"
    UNION ALL SELECT 'Category', count(*)::int FROM "Category"
    UNION ALL SELECT 'ProductCategory', count(*)::int FROM "ProductCategory"
    UNION ALL SELECT 'City', count(*)::int FROM "City"
    UNION ALL SELECT 'Branch', count(*)::int FROM "Branch"
    UNION ALL SELECT 'DeliveryZone', count(*)::int FROM "DeliveryZone"
    UNION ALL SELECT 'DeliverySettings', count(*)::int FROM "DeliverySettings"
    ORDER BY 1;
  `);
  console.log("Supabase counts:");
  for (const row of check.rows) console.log(`  ${row.t}: ${row.n}`);

  await client.end();
  console.log("Migration data copy complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
