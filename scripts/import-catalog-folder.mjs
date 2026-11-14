#!/usr/bin/env node
/**
 * Import catalog photos → WebP + JPEG → Supabase Storage → Product rows.
 *
 * Env:
 *   IMPORT_PRODUCT_TYPE  bouquet | flower-basket | stand-congrats | …
 *   IMPORT_SOURCE_DIR    absolute path to image folder (wins if set)
 *   IMPORT_UPRIGHT_LANDSCAPE  1 = rotate wide phone shots 90° CW (default: bouquet only)
 *   IMPORT_DEFAULT_PRICE / IMPORT_MAX_EDGE / IMPORT_TARGET_BYTES
 *   IMPORT_DRY_RUN=1  IMPORT_LIMIT=N
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL (secrets / .env.local).
 *
 * Usage:
 *   IMPORT_PRODUCT_TYPE=flower-basket IMPORT_SOURCE_DIR=./import/basket \
 *     node scripts/import-catalog-folder.mjs
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
const DEFAULT_PRICE = Number(process.env.IMPORT_DEFAULT_PRICE || 450_000);
const DEFAULT_SM = Number(process.env.IMPORT_PRICE_SM || 450_000);
const DEFAULT_MD = Number(process.env.IMPORT_PRICE_MD || 600_000);
const DEFAULT_LG = Number(process.env.IMPORT_PRICE_LG || 850_000);
const MAX_EDGE = Number(process.env.IMPORT_MAX_EDGE || 1800);
const TARGET_BYTES = Number(process.env.IMPORT_TARGET_BYTES || 180_000);
const DRY_RUN = process.env.IMPORT_DRY_RUN === "1";
const LIMIT = process.env.IMPORT_LIMIT
  ? Number(process.env.IMPORT_LIMIT)
  : null;

/** @type {Record<string, { nameEn: string; nameVi: string; tagEn: string; tagVi: string; sortOrder: number; slugPrefix: string; folders: string[] }>} */
const TYPE_META = {
  bouquet: {
    nameEn: "Bouquet",
    nameVi: "Bó hoa",
    tagEn: "Wrapped bouquet",
    tagVi: "Bó hoa",
    sortOrder: 1,
    slugPrefix: "bouquet",
    folders: ["buckets", "bouquet"],
  },
  "flower-basket": {
    nameEn: "Flower basket",
    nameVi: "Giỏ hoa",
    tagEn: "Flower basket",
    tagVi: "Giỏ hoa",
    sortOrder: 2,
    slugPrefix: "basket",
    folders: ["basket", "baskets", "flower-basket"],
  },
  "stand-tray": {
    nameEn: "Stand / tray",
    nameVi: "Kệ, lẵng hoa",
    tagEn: "Flower stand",
    tagVi: "Kệ, lẵng hoa",
    sortOrder: 3,
    slugPrefix: "stand-tray",
    folders: ["stand-tray", "stand tray"],
  },
  "stand-congrats": {
    nameEn: "Congratulatory stand",
    nameVi: "Kệ hoa chúc mừng",
    tagEn: "Congratulatory stand",
    tagVi: "Kệ hoa chúc mừng",
    sortOrder: 4,
    slugPrefix: "stand-congrats",
    folders: ["stand for congrats", "stand-congrats", "stand-congrats"],
  },
  "stand-funeral": {
    nameEn: "Condolence stand",
    nameVi: "Kệ hoa viếng",
    tagEn: "Condolence stand",
    tagVi: "Kệ hoa viếng",
    sortOrder: 5,
    slugPrefix: "stand-funeral",
    folders: ["stand-funeral", "stand for funeral"],
  },
};

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

function resolveProductType() {
  const raw = (process.env.IMPORT_PRODUCT_TYPE || "bouquet").trim();
  if (!TYPE_META[raw]) {
    throw new Error(
      `Unknown IMPORT_PRODUCT_TYPE="${raw}". Use: ${Object.keys(TYPE_META).join(", ")}`,
    );
  }
  return raw;
}

async function resolveSourceDir(productType) {
  const meta = TYPE_META[productType];
  const candidates = [
    process.env.IMPORT_SOURCE_DIR,
    process.env.IMPORT_BUCKETS_DIR, // legacy alias
    ...meta.folders.flatMap((folder) => [
      path.join("/nexus/flowers", folder),
      path.join(ROOT, "import", folder),
    ]),
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
    `No ${productType} photos found. Tried:\n${tried.map((c) => `  - ${c}`).join("\n")}\n` +
      `Copy files into import/${meta.folders[0]}/ or set IMPORT_SOURCE_DIR.`,
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
  if (!cleaned) return "Studio piece";
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

function wantUprightLandscape(productType) {
  if (process.env.IMPORT_UPRIGHT_LANDSCAPE === "1") return true;
  if (process.env.IMPORT_UPRIGHT_LANDSCAPE === "0") return false;
  return productType === "bouquet";
}

async function encodePair(inputPath, uprightLandscape) {
  const oriented = sharp(inputPath, { failOn: "none" }).rotate();
  const exifMeta = await oriented.metadata();
  const uprightDeg =
    uprightLandscape && (exifMeta.width || 0) > (exifMeta.height || 0)
      ? 90
      : 0;

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
  await loadEnvFile(path.join(ROOT, "secrets", "supabase-service.env"));

  const productType = resolveProductType();
  const meta = TYPE_META[productType];
  const sourceDir = await resolveSourceDir(productType);
  const uprightLandscape = wantUprightLandscape(productType);

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
  console.log(`Type: ${productType}`);
  console.log(`Source: ${sourceDir}`);
  console.log(
    `Images: ${files.length}${DRY_RUN ? " (dry-run)" : ""}; uprightLandscape=${uprightLandscape ? "on" : "off"}`,
  );

  const supabase = serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  const prisma = new PrismaClient();

  // Seed all type categories
  for (const [slug, row] of Object.entries(TYPE_META)) {
    await prisma.category.upsert({
      where: { slug },
      update: {
        nameEn: row.nameEn,
        nameVi: row.nameVi,
        sortOrder: row.sortOrder,
        active: true,
      },
      create: {
        slug,
        nameEn: row.nameEn,
        nameVi: row.nameVi,
        sortOrder: row.sortOrder,
        active: true,
      },
    });
  }

  const typeCat = await prisma.category.findUniqueOrThrow({
    where: { slug: productType },
  });

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const base = path.basename(filePath, path.extname(filePath));
    const sourceKey = `${productType}:${path.basename(filePath)}`;
    const legacySourceKey = path.basename(filePath);
    const index = String(i + 1).padStart(3, "0");
    let slug =
      slugify(`${meta.slugPrefix}-${base}`) ||
      `${meta.slugPrefix}-${index}`;
    if (slug.length < 8) slug = `${meta.slugPrefix}-${index}-${slug}`;

    try {
      const encoded = await encodePair(filePath, uprightLandscape);
      const objectBase = `${productType}/${slug}`;
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

      const titleEn = `${meta.nameEn} ${index}`;
      const titleVi = `${meta.nameVi} ${index}`;
      const fromFile = titleFromFile(base);

      if (!DRY_RUN) {
        let finalSlug = slug;
        const existingBySource = await prisma.product.findFirst({
          where: {
            OR: [{ sourceKey }, { sourceKey: legacySourceKey }],
          },
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
          priceSm: DEFAULT_SM,
          priceMd: DEFAULT_MD,
          priceLg: DEFAULT_LG,
          priceGrand: null,
          image: imageUrl,
          imageFallback: fallbackUrl,
          productType,
          sourceKey,
          accent: "rose",
          nameEn: titleEn,
          nameVi: titleVi,
          tagEn: meta.tagEn,
          tagVi: meta.tagVi,
          blurbEn: `Handcrafted ${meta.nameEn.toLowerCase()} from Sisters Flowers (${fromFile}).`,
          blurbVi: `${meta.nameVi} thủ công từ Sisters Flowers (${fromFile}).`,
          storyEn: `Studio ${meta.nameEn.toLowerCase()} — confirm stems and styling with the team for today’s flowers.`,
          storyVi: `${meta.nameVi} studio — xác nhận hoa và kiểu với tiệm theo hoa trong ngày.`,
          published: true,
          sortOrder: i + 1,
          aiStatus: "pending",
          contentSource: "import",
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
        `[${i + 1}/${files.length}] ${path.basename(filePath)} → ${slug}  webp=${Math.round(encoded.webpBytes / 1024)}KB@${encoded.webpQ} jpeg=${Math.round(encoded.jpegBytes / 1024)}KB@${encoded.jpegQ}`,
      );
    } catch (err) {
      fail += 1;
      console.error(`[fail] ${path.basename(filePath)}:`, err.message || err);
    }
  }

  await prisma.$disconnect();
  console.log(`Done. type=${productType} ok=${ok} fail=${fail}`);
  if (fail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
