#!/usr/bin/env node
/** Upsert CatalogAttribute taxonomy from src/lib/catalog-ai/taxonomy.ts seeds. */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

const TAXONOMY = [
  ["flower", "rose", "Rose", "Hoa hồng", 10],
  ["flower", "lily", "Lily", "Hoa ly", 20],
  ["flower", "carnation", "Carnation", "Cẩm chướng", 30],
  ["flower", "gerbera", "Gerbera", "Đồng tiền", 40],
  ["flower", "chrysanthemum", "Chrysanthemum", "Cúc", 50],
  ["flower", "hydrangea", "Hydrangea", "Cẩm tú cầu", 60],
  ["flower", "sunflower", "Sunflower", "Hướng dương", 70],
  ["flower", "orchid", "Orchid", "Lan", 80],
  ["flower", "tulip", "Tulip", "Tulip", 90],
  ["flower", "baby-breath", "Baby's breath", "Baby breath", 100],
  ["flower", "eucalyptus", "Eucalyptus", "Khuynh diệp", 110],
  ["flower", "mixed-flowers", "Mixed flowers", "Hoa mix", 120],
  ["color", "pink", "Pink", "Hồng", 10],
  ["color", "red", "Red", "Đỏ", 20],
  ["color", "white", "White", "Trắng", 30],
  ["color", "yellow", "Yellow", "Vàng", 40],
  ["color", "orange", "Orange", "Cam", 50],
  ["color", "purple", "Purple", "Tím", 60],
  ["color", "blue", "Blue", "Xanh dương", 70],
  ["color", "pastel", "Pastel", "Pastel", 80],
  ["color", "cream", "Cream", "Kem", 90],
  ["color", "green", "Green", "Xanh lá", 100],
  ["style", "romantic", "Romantic", "Lãng mạn", 10],
  ["style", "elegant", "Elegant", "Thanh lịch", 20],
  ["style", "minimalist", "Minimalist", "Tối giản", 30],
  ["style", "luxury", "Luxury", "Sang trọng", 40],
  ["style", "natural", "Natural / wildflower", "Tự nhiên", 50],
  ["style", "modern", "Modern", "Hiện đại", 60],
  ["style", "classic", "Classic", "Cổ điển", 70],
  ["arrangement", "bouquet", "Bouquet", "Bó hoa", 10],
  ["arrangement", "flower-basket", "Flower basket", "Giỏ hoa", 20],
  ["arrangement", "flower-box", "Flower box", "Hộp hoa", 30],
  ["arrangement", "vase", "Vase arrangement", "Bình hoa", 40],
];

async function main() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase.env"));
  const prisma = new PrismaClient();
  for (const [kind, slug, nameEn, nameVi, sortOrder] of TAXONOMY) {
    await prisma.catalogAttribute.upsert({
      where: { slug },
      update: { kind, nameEn, nameVi, sortOrder, active: true },
      create: {
        id: createHash("sha1").update(`attr:${slug}`).digest("hex").slice(0, 24),
        kind,
        slug,
        nameEn,
        nameVi,
        sortOrder,
        active: true,
      },
    });
  }
  const n = await prisma.catalogAttribute.count();
  console.log(`CatalogAttribute rows: ${n}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
