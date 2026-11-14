#!/usr/bin/env node
/**
 * Import bouquet photos → optimize (WebP + JPEG) → Supabase Storage → Product rows.
 *
 * Source dirs (first that exists wins):
 *   IMPORT_BUCKETS_DIR env
 *   /nexus/flowers/buckets
 *   ./import/buckets
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (+ SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL)
 * and DATABASE_URL / DIRECT_URL for Prisma.
 *
 * Usage:
 *   node --env-file=.env.local --env-file=secrets/supabase.env \
 *     scripts/import-buckets-catalog.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CATALOG_BUCKET = "catalog";
const PRODUCT_TYPE = "bouquet";
const DEFAULT_PRICE = Number(process.env.IMPORT_DEFAULT_PRICE || 750000);
const MAX_EDGE = Number(process.env.IMPORT_MAX_EDGE || 1800);
const TARGET_BYTES = Number(process.env.IMPORT_TARGET_BYTES || 180_000);
const DRY_RUN = process.env.IMPORT_DRY_RUN === "1";
const LIMIT = process.env.IMPORT_LIMIT
  ? Number(process.env.IMPORT_LIMIT)
  : null;

const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".heic",
]);

function loadEnvFile(filePath) {
  return fs
    .readFile(filePath, "utf8")
    .then((raw) => {
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
    })
    .catch(() => {});
}

async function resolveSourceDir() {
  const candidates = [
    process.env.IMPORT_BUCKETS_DIR,
    "/nexus/flowers/buckets",
    path.join(ROOT, "import", "buckets"),
  ].filter(Boolean);
  const tried = [];
  for (const dir of candidates) {
    try {
      const st = await fs.stat(dir);
      if (!st.isDirectory()) continue;
      const images = await listImages(dir);
      tried.push(`${dir} (${images.length} images)`);
      if (images.length > 0) return dir;
    } catch {
      tried.push(`${dir} (missing)`);
    }
  }
  throw new Error(
    `No bouquet photos found. Tried:\n${tried.map((c) => `  - ${c}`).join("\n")}\n` +
      `Copy the 304 files to ${path.join(ROOT, "import", "buckets")} or mount /nexus/flowers/buckets.`,
  );
}

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
}

function titleFromFile(base) {
  const cleaned = base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Bouquet";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function listImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    if (entry.name.startsWith(".")) continue;
    files.push(path.join(dir, entry.name));
  }
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files;
}

async function encodePair(inputPath) {
  // Phone studio shots are often landscape with blooms on the left —
  // rotate 90° CW so flower heads point up in the catalog.
  const oriented = sharp(inputPath, { failOn: "none" }).rotate();
  const exifMeta = await oriented.metadata();
  const uprightDeg =
    (exifMeta.width || 0) > (exifMeta.height || 0) ? 90 : 0;

  const afterOrient = sharp(inputPath, { failOn: "none" })
    .rotate()
    .rotate(uprightDeg || 0);
  const meta = await afterOrient.metadata();
  const width = meta.width || MAX_EDGE;
  const height = meta.height || MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));

  async function source() {
    let p = sharp(inputPath, { failOn: "none" }).rotate();
    if (uprightDeg) p = p.rotate(uprightDeg);
    return p.resize({ width: targetW, withoutEnlargement: true });
  }

  async function encodeWebp(quality) {
    return (await source())
      .webp({ quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  }
  async function encodeJpeg(quality) {
    return (await source())
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
  }

  let webpQ = 84;
  let jpegQ = 82;
  let webp = await encodeWebp(webpQ);
  let jpeg = await encodeJpeg(jpegQ);

  // Nudge quality down if over target (keep usable detail).
  while (webp.info.size > TARGET_BYTES && webpQ > 68) {
    webpQ -= 4;
    webp = await encodeWebp(webpQ);
  }
  while (jpeg.info.size > TARGET_BYTES && jpegQ > 65) {
    jpegQ -= 4;
    jpeg = await encodeJpeg(jpegQ);
  }

  return {
    webp: webp.data,
    jpeg: jpeg.data,
    webpBytes: webp.info.size,
    jpegBytes: jpeg.info.size,
    webpQ,
    jpegQ,
    width: targetW,
  };
}

function publicUrl(baseUrl, objectPath) {
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${CATALOG_BUCKET}/${objectPath}`;
}

async function main() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase.env"));
  // Allow service role in a dedicated file too
  await loadEnvFile(path.join(ROOT, "secrets", "supabase-service.env"));

  const sourceDir = await resolveSourceDir();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";

  if (!url) throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey && !DRY_RUN) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (put it in secrets/supabase-service.env)",
    );
  }

  let files = await listImages(sourceDir);
  if (LIMIT) files = files.slice(0, LIMIT);
  console.log(`Source: ${sourceDir}`);
  console.log(`Images: ${files.length}${DRY_RUN ? " (dry-run)" : ""}`);

  const supabase = serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  const prisma = new PrismaClient();

  // Ensure type category exists
  const typeCat = await prisma.category.upsert({
    where: { slug: PRODUCT_TYPE },
    update: {
      nameEn: "Bouquet",
      nameVi: "Bó hoa",
      active: true,
      sortOrder: 1,
    },
    create: {
      slug: PRODUCT_TYPE,
      nameEn: "Bouquet",
      nameVi: "Bó hoa",
      active: true,
      sortOrder: 1,
    },
  });

  // Seed other type categories for later imports (inactive filter until stocked)
  for (const row of [
    ["flower-basket", "Flower basket", "Giỏ hoa", 2],
    ["stand-tray", "Stand / tray", "Kệ, lẵng hoa", 3],
    ["stand-congrats", "Congratulatory stand", "Kệ hoa chúc mừng", 4],
    ["stand-funeral", "Condolence stand", "Kệ hoa viếng", 5],
  ]) {
    await prisma.category.upsert({
      where: { slug: row[0] },
      update: { nameEn: row[1], nameVi: row[2], sortOrder: row[3] },
      create: {
        slug: row[0],
        nameEn: row[1],
        nameVi: row[2],
        sortOrder: row[3],
        active: true,
      },
    });
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const base = path.basename(filePath, path.extname(filePath));
    const sourceKey = path.basename(filePath);
    const index = String(i + 1).padStart(3, "0");
    let slug = slugify(`bouquet-${base}`) || `bouquet-${index}`;
    if (slug.length < 8) slug = `bouquet-${index}-${slug}`;

    try {
      const encoded = await encodePair(filePath);
      const objectBase = `${PRODUCT_TYPE}/${slug}`;
      const webpPath = `${objectBase}/main.webp`;
      const jpegPath = `${objectBase}/main.jpg`;

      let imageUrl = publicUrl(url, webpPath);
      let fallbackUrl = publicUrl(url, jpegPath);

      if (!DRY_RUN && supabase) {
        const upWebp = await supabase.storage
          .from(CATALOG_BUCKET)
          .upload(webpPath, encoded.webp, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "31536000",
          });
        if (upWebp.error) throw new Error(upWebp.error.message);
        const upJpeg = await supabase.storage
          .from(CATALOG_BUCKET)
          .upload(jpegPath, encoded.jpeg, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "31536000",
          });
        if (upJpeg.error) throw new Error(upJpeg.error.message);
        imageUrl = publicUrl(url, webpPath);
        fallbackUrl = publicUrl(url, jpegPath);
      }

      const titleEn = `Bouquet ${index}`;
      const titleVi = `Bó hoa ${index}`;
      const fromFile = titleFromFile(base);

      if (!DRY_RUN) {
        // Unique slug if clash with non-import product
        let finalSlug = slug;
        const existingBySource = await prisma.product.findFirst({
          where: { sourceKey },
        });
        if (!existingBySource) {
          const clash = await prisma.product.findUnique({
            where: { slug: finalSlug },
          });
          if (clash) finalSlug = `${slug}-${index}`;
        } else {
          finalSlug = existingBySource.slug;
        }

        const data = {
          slug: finalSlug,
          price: DEFAULT_PRICE,
          image: imageUrl,
          imageFallback: fallbackUrl,
          productType: PRODUCT_TYPE,
          sourceKey,
          accent: "rose",
          nameEn: titleEn,
          nameVi: titleVi,
          tagEn: "Wrapped bouquet",
          tagVi: "Bó hoa",
          blurbEn: `Handcrafted bouquet from Sisters Flowers (${fromFile}).`,
          blurbVi: `Bó hoa thủ công từ Sisters Flowers (${fromFile}).`,
          storyEn:
            "Studio bouquet — confirm stems and wrapping with the team for today’s flowers.",
          storyVi:
            "Bó hoa studio — xác nhận hoa và giấy gói với tiệm theo hoa trong ngày.",
          published: true,
          sortOrder: i + 1,
        };

        const product = existingBySource
          ? await prisma.product.update({
              where: { id: existingBySource.id },
              data,
            })
          : await prisma.product.create({ data });

        await prisma.productCategory.deleteMany({
          where: { productId: product.id },
        });
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId: typeCat.id },
        });
      }

      ok += 1;
      console.log(
        `[${i + 1}/${files.length}] ${sourceKey} → ${slug}  webp=${Math.round(encoded.webpBytes / 1024)}KB@${encoded.webpQ} jpeg=${Math.round(encoded.jpegBytes / 1024)}KB@${encoded.jpegQ}`,
      );
    } catch (err) {
      fail += 1;
      console.error(`[fail] ${sourceKey}:`, err.message || err);
    }
  }

  if (!DRY_RUN) {
    const retiredLocal = await prisma.product.updateMany({
      where: {
        sourceKey: null,
        image: { startsWith: "/bouquets/" },
      },
      data: { published: false },
    });
    console.log(`Retired mock/local products: ${retiredLocal.count}`);
  }

  await prisma.$disconnect();
  console.log(`Done. ok=${ok} fail=${fail}`);
  if (fail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
