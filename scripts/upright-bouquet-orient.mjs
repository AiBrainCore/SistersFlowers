#!/usr/bin/env node
/**
 * Rotate landscape bouquet catalog photos so flower heads point up.
 *
 * Most studio phone shots were stored as landscape with blooms on the left.
 * Rule: if width > height → rotate 90° clockwise, re-encode WebP+JPEG,
 * upsert Storage objects, cache-bust Product.image / imageFallback.
 *
 * Usage:
 *   node scripts/upright-bouquet-orient.mjs
 *   ORIENT_DRY_RUN=1 ORIENT_LIMIT=5 node scripts/upright-bouquet-orient.mjs
 *   ORIENT_FORCE=1 node scripts/upright-bouquet-orient.mjs   # also re-process already busted URLs
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
const MAX_EDGE = Number(process.env.ORIENT_MAX_EDGE || 1800);
const TARGET_BYTES = Number(process.env.ORIENT_TARGET_BYTES || 180_000);
const DRY_RUN = process.env.ORIENT_DRY_RUN === "1";
const FORCE = process.env.ORIENT_FORCE === "1";
const LIMIT = process.env.ORIENT_LIMIT
  ? Number(process.env.ORIENT_LIMIT)
  : null;
const CACHE_TAG = "upright1";

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

function stripCacheQuery(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("v");
    return u.toString();
  } catch {
    return url.split("?")[0];
  }
}

function withCacheTag(url, tag) {
  const base = stripCacheQuery(url);
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}v=${tag}`;
}

function objectPathsFromUrl(imageUrl) {
  const clean = stripCacheQuery(imageUrl || "");
  const marker = `/object/public/${CATALOG_BUCKET}/`;
  const idx = clean.indexOf(marker);
  if (idx < 0) return null;
  const objectPath = clean.slice(idx + marker.length).split("?")[0];
  // bouquet/slug/main.webp → bouquet/slug/main.jpg
  if (!objectPath.endsWith("/main.webp") && !objectPath.endsWith("/main.jpg")) {
    return null;
  }
  const base = objectPath.replace(/\/main\.(webp|jpg)$/, "");
  return {
    webpPath: `${base}/main.webp`,
    jpegPath: `${base}/main.jpg`,
  };
}

async function encodePair(inputBuffer, rotateDeg) {
  let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate();
  if (rotateDeg) pipeline = pipeline.rotate(rotateDeg);
  const meta = await pipeline.metadata();
  const width = meta.width || MAX_EDGE;
  const height = meta.height || MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));

  const source = async () => {
    let p = sharp(inputBuffer, { failOn: "none" }).rotate();
    if (rotateDeg) p = p.rotate(rotateDeg);
    return p.resize({ width: targetW, withoutEnlargement: true });
  };

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

  const outMeta = await sharp(jpeg.data).metadata();
  return {
    webp: webp.data,
    jpeg: jpeg.data,
    webpBytes: webp.info.size,
    jpegBytes: jpeg.info.size,
    width: outMeta.width,
    height: outMeta.height,
  };
}

async function main() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase.env"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase-service.env"));

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";
  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!serviceKey && !DRY_RUN) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const prisma = new PrismaClient();
  const supabase = serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  let products = await prisma.product.findMany({
    where: { productType: "bouquet", published: true },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      image: true,
      imageFallback: true,
    },
    orderBy: { nameEn: "asc" },
  });

  if (!FORCE) {
    products = products.filter(
      (p) => !(p.image || "").includes(`v=${CACHE_TAG}`),
    );
  }
  if (LIMIT) products = products.slice(0, LIMIT);

  console.log(
    `Bouquet products to scan: ${products.length}${DRY_RUN ? " (dry-run)" : ""}`,
  );

  let rotated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const label = `${i + 1}/${products.length} ${p.nameEn}`;
    try {
      const srcUrl = stripCacheQuery(p.imageFallback || p.image);
      const paths = objectPathsFromUrl(srcUrl);
      if (!paths) {
        console.log(`${label}: skip (non-catalog URL)`);
        skipped++;
        continue;
      }

      const res = await fetch(srcUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(input, { failOn: "none" }).metadata();
      const w = meta.width || 0;
      const h = meta.height || 0;
      const needsRotate = w > h;
      const deg = needsRotate ? 90 : 0;

      if (!needsRotate && (p.image || "").includes(`v=${CACHE_TAG}`)) {
        skipped++;
        continue;
      }
      if (!needsRotate) {
        // Portrait: already upright for this catalog — only cache-tag if forcing fresh URLs
        if (!FORCE) {
          skipped++;
          if ((i + 1) % 40 === 0) console.log(`${label}: portrait keep`);
          continue;
        }
      }

      const encoded = await encodePair(input, deg);

      if (!DRY_RUN && supabase) {
        const upWebp = await supabase.storage
          .from(CATALOG_BUCKET)
          .upload(paths.webpPath, encoded.webp, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "31536000",
          });
        if (upWebp.error) throw new Error(upWebp.error.message);
        const upJpeg = await supabase.storage
          .from(CATALOG_BUCKET)
          .upload(paths.jpegPath, encoded.jpeg, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "31536000",
          });
        if (upJpeg.error) throw new Error(upJpeg.error.message);

        const imageUrl = withCacheTag(
          `${url.replace(/\/$/, "")}/storage/v1/object/public/${CATALOG_BUCKET}/${paths.webpPath}`,
          CACHE_TAG,
        );
        const fallbackUrl = withCacheTag(
          `${url.replace(/\/$/, "")}/storage/v1/object/public/${CATALOG_BUCKET}/${paths.jpegPath}`,
          CACHE_TAG,
        );
        await prisma.product.update({
          where: { id: p.id },
          data: { image: imageUrl, imageFallback: fallbackUrl },
        });
      }

      if (needsRotate) {
        rotated++;
        console.log(
          `${label}: rotate 90° CW ${w}×${h} → ${encoded.width}×${encoded.height}`,
        );
      } else {
        skipped++;
        console.log(`${label}: portrait tagged`);
      }
    } catch (err) {
      failed++;
      console.error(`${label}: FAIL`, err?.message || err);
    }
  }

  console.log(
    `\nDone. rotated=${rotated} skipped=${skipped} failed=${failed}`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
