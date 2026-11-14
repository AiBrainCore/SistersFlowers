#!/usr/bin/env node
/**
 * Seed 5 bilingual Journal posts (HTML bodies + covers + weekly publish dates).
 *
 *   node scripts/seed-journal-v3.mjs
 */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// Use compiled helpers via dynamic import of ts not available — inline sanitize lightly
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "scripts", "data", "journal-v3");

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      )
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

function escapeText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text) {
  return escapeText(text)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, label, href) =>
        `<a href="${String(href).replace(/"/g, "")}">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function markdownLiteToHtml(source) {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks = [];
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    if (text) blocks.push(`<p>${inline(text)}</p>`);
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push(`<h3>${inline(line.slice(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push(`<h2>${inline(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks.join("\n");
}

function resolveLinks(md, locale) {
  const catalog = `/${locale}/shop`;
  const occasions = `/${locale}/shop`;
  const custom = `/${locale}/custom`;
  return md
    .replaceAll("CATALOG_LINK", catalog)
    .replaceAll("OCCASIONS_LINK", occasions)
    .replaceAll("CUSTOM_LINK", custom)
    .replaceAll("(internal:catalog)", `(${catalog})`)
    .replaceAll("(internal:occasions)", `(${occasions})`)
    .replaceAll("(internal:custom)", `(${custom})`);
}

async function main() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase.env"));
  const prisma = new PrismaClient();
  const meta = JSON.parse(await fs.readFile(path.join(DATA, "meta.json"), "utf8"));
  const posts = Array.isArray(meta) ? meta : meta.posts;

  for (const post of posts) {
    const enMd = await fs.readFile(path.join(DATA, `${post.slug}.en.md`), "utf8");
    const viMd = await fs.readFile(path.join(DATA, `${post.slug}.vi.md`), "utf8");
    const bodyEn = markdownLiteToHtml(resolveLinks(enMd, "en"));
    const bodyVi = markdownLiteToHtml(resolveLinks(viMd, "vi"));

    const data = {
      kind: post.kind,
      cityScope: post.cityScope,
      titleEn: post.titleEn,
      titleVi: post.titleVi,
      excerptEn: post.excerptEn,
      excerptVi: post.excerptVi,
      bodyEn,
      bodyVi,
      coverImage: post.cover,
      coverAltEn: post.coverAltEn || "",
      coverAltVi: post.coverAltVi || "",
      seoTitleEn: post.seoTitleEn || "",
      seoTitleVi: post.seoTitleVi || "",
      seoDescriptionEn: post.seoDescriptionEn || "",
      seoDescriptionVi: post.seoDescriptionVi || "",
      published: true,
      publishedAt: new Date(post.publishedAtISO),
      sortOrder: post.sortOrder ?? 0,
    };

    await prisma.journalPost.upsert({
      where: { slug: post.slug },
      create: { slug: post.slug, ...data },
      update: data,
    });
    console.log(`upsert ${post.slug} · ${post.publishedAtISO}`);
  }

  const n = await prisma.journalPost.count({ where: { published: true } });
  console.log(`Published journal posts: ${n}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
