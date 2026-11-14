/**
 * Permanently delete the original 24 demo / seed bouquets (not the real catalog).
 *
 *   node scripts/delete-demo-products.mjs           # dry-run
 *   DELETE_DEMO_APPLY=1 node scripts/delete-demo-products.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.env.DELETE_DEMO_APPLY === "1";

/** Original seed slugs — not the imported bouquet-img-* catalog. */
export const DEMO_PRODUCT_SLUGS = [
  "tone-noi",
  "mix-keo-hong",
  "tot-nghiep",
  "hong-do-qua",
  "hong-tron",
  "cau-hon",
  "mix-sang",
  "hong-do-mau-don",
  "valentine-mix",
  "no-hong",
  "hong-do-giay-trang",
  "lily-mix",
  "hong-xanh",
  "garden-mix",
  "mix-giay-hong",
  "hong-do-ngoai",
  "no-dai-hong",
  "sinh-nhat-mix",
  "mix-cam-dao",
  "mix-vang",
  "hong-tra",
  "mix-gerbera",
  "hong-nhat-day",
  "garden-vuon",
];

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

async function main() {
  await loadEnvFile(path.join(ROOT, "secrets/supabase.env"));
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, ".env"));

  const prisma = new PrismaClient();
  const rows = await prisma.product.findMany({
    where: { slug: { in: DEMO_PRODUCT_SLUGS } },
    select: { id: true, slug: true, nameEn: true, published: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${rows.length} demo products · apply=${APPLY}`);
  for (const row of rows) {
    console.log(`- ${row.slug} · ${row.nameEn} · published=${row.published}`);
  }

  if (!APPLY) {
    console.log("Dry-run only. Set DELETE_DEMO_APPLY=1 to delete.");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.product.deleteMany({
    where: { slug: { in: DEMO_PRODUCT_SLUGS } },
  });
  const remaining = await prisma.product.count();
  console.log(`Deleted ${result.count}. Catalog remaining: ${remaining}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
