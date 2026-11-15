#!/usr/bin/env node
/**
 * One-shot: resize oversized marketing images under public/.
 * Keeps original filenames/extensions so call sites stay unchanged.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve("public");
const TARGETS = [
  { dir: path.join(ROOT, "bouquets"), maxEdge: 1400, jpegQuality: 78 },
  { dir: path.join(ROOT, "brand"), maxEdge: 800, jpegQuality: 80 },
];

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "uploads") continue; // admin uploads — leave alone
      out.push(...(await walk(full)));
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function optimizeFile(file, maxEdge, jpegQuality) {
  const input = await fs.readFile(file);
  const img = sharp(input, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const before = input.length;
  const needsResize = Math.max(w, h) > maxEdge;
  // Skip tiny savings
  if (!needsResize && before < 120_000) {
    return { file, skipped: true, before, after: before };
  }

  let pipeline = sharp(input, { failOn: "none" }).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({
      width: w >= h ? maxEdge : undefined,
      height: h > w ? maxEdge : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const ext = path.extname(file).toLowerCase();
  let out;
  if (ext === ".png") {
    out = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
  } else if (ext === ".webp") {
    out = await pipeline.webp({ quality: jpegQuality }).toBuffer();
  } else {
    out = await pipeline
      .jpeg({ quality: jpegQuality, mozjpeg: true })
      .toBuffer();
  }

  if (out.length >= before * 0.97) {
    return { file, skipped: true, before, after: before };
  }
  await fs.writeFile(file, out);
  return { file, skipped: false, before, after: out.length };
}

async function main() {
  let saved = 0;
  let touched = 0;
  for (const target of TARGETS) {
    const files = await walk(target.dir);
    for (const file of files) {
      const result = await optimizeFile(
        file,
        target.maxEdge,
        target.jpegQuality,
      );
      if (!result.skipped) {
        touched += 1;
        saved += result.before - result.after;
        const rel = path.relative(process.cwd(), file);
        console.log(
          `${rel}: ${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB`,
        );
      }
    }
  }
  console.log(
    `Done. Optimized ${touched} files, saved ${(saved / 1024 / 1024).toFixed(1)} MB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
