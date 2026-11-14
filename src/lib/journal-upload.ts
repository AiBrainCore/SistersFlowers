import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  catalogPublicUrl,
  createServiceSupabase,
  uploadCatalogObject,
} from "@/lib/catalog-storage";

const MAX_EDGE = 1800;
const TARGET_BYTES = 220_000;

/** Load gitignored service role into process.env when missing (local / agent). */
async function ensureServiceRoleEnv() {
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  ) {
    return;
  }
  try {
    const raw = await readFile(
      path.join(process.cwd(), "secrets", "supabase-service.env"),
      "utf8",
    );
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
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

export type JournalUploadKind = "cover" | "inline";

function safeSlugPart(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "post"
  );
}

async function encodeWebp(input: Buffer) {
  const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
  const width = meta.width || MAX_EDGE;
  const height = meta.height || MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));

  let quality = 84;
  let out = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: targetW, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();

  while (out.byteLength > TARGET_BYTES && quality > 68) {
    quality -= 4;
    out = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
  }
  return out;
}

/**
 * Upload a journal image to Supabase Storage (catalog/journal/…),
 * falling back to public/journal/uploads when service role is missing.
 */
export async function uploadJournalImage(opts: {
  bytes: Buffer;
  filenameHint?: string;
  postSlug?: string;
  kind?: JournalUploadKind;
}): Promise<string> {
  const webp = await encodeWebp(opts.bytes);
  const slug = safeSlugPart(opts.postSlug || "draft");
  const stamp = Date.now();
  const kind = opts.kind || "inline";
  const objectPath = `journal/${slug}/${kind}-${stamp}.webp`;

  try {
    await ensureServiceRoleEnv();
    const supabase = createServiceSupabase();
    return await uploadCatalogObject(
      supabase,
      objectPath,
      webp,
      "image/webp",
    );
  } catch {
    const filename = `journal-${slug}-${kind}-${stamp}.webp`;
    const dir = path.join(process.cwd(), "public", "journal", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), webp);
    return `/journal/uploads/${filename}`;
  }
}

export function isAllowedJournalImageUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/journal/")) return true;
  if (url.startsWith("https://") && url.includes("/storage/v1/object/public/")) {
    return true;
  }
  // Legacy seeded covers under public/journal/covers
  if (url.startsWith("/journal/covers/")) return true;
  return false;
}

export { catalogPublicUrl };
