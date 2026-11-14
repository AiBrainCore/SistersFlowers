#!/usr/bin/env node
/**
 * Full-catalog AI enrichment: vision once → attributes + VI/EN copy + SEO.
 *
 * Requires OPENAI_API_KEY (secrets/openai.env or .env.local).
 *
 * Usage:
 *   node scripts/seed-catalog-attributes.mjs
 *   ENRICH_APPLY=1 node scripts/enrich-catalog-ai.mjs
 *   ENRICH_DRY_RUN=1 ENRICH_LIMIT=3 node scripts/enrich-catalog-ai.mjs
 *   ENRICH_FORCE=1 …   # re-analyze even if imageHash matches
 *   ENRICH_PRODUCT_TYPE=flower-basket   # optional; default bouquet
 *   ENRICH_PRODUCT_TYPE=all             # every published type
 *
 * Never overwrites contentLocked or contentSource=manual products' copy.
 * Placeholder names (Bouquet/Flower basket/… NNN) are eligible when ENRICH_APPLY=1.
 */
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.env.ENRICH_DRY_RUN === "1";
const APPLY = process.env.ENRICH_APPLY === "1";
const FORCE = process.env.ENRICH_FORCE === "1";
const LIMIT = process.env.ENRICH_LIMIT
  ? Number(process.env.ENRICH_LIMIT)
  : null;
const MODEL_VISION = process.env.ENRICH_VISION_MODEL || "gpt-4o-mini";
const MODEL_COPY = process.env.ENRICH_COPY_MODEL || "gpt-4o-mini";
const CONCURRENCY = Number(process.env.ENRICH_CONCURRENCY || 2);
const PRODUCT_TYPE = (process.env.ENRICH_PRODUCT_TYPE || "bouquet").trim();

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

function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return (url || "").split("?")[0];
  }
}

function isPlaceholderName(nameEn) {
  return /^(Bouquet|Flower basket|Congratulatory stand|Stand \/ tray|Condolence stand|Basket|Stand)\s+\d+$/i.test(
    (nameEn || "").trim(),
  );
}

function canApplyCopy(product) {
  if (product.contentLocked) return false;
  if (product.contentSource === "manual") return false;
  return isPlaceholderName(product.nameEn) || product.contentSource === "ai";
}

async function openaiJson({ apiKey, model, messages, maxTokens = 1200 }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
      max_tokens: maxTokens,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || `OpenAI HTTP ${res.status}`);
  }
  const text = body.choices?.[0]?.message?.content || "{}";
  const usage = body.usage || {};
  return { json: JSON.parse(text), usage };
}

async function analyzeImage(apiKey, imageUrl, jpegBase64) {
  const messages = [
    {
      role: "system",
      content:
        "You are a florist photo analyst for Sisters Flowers (Vietnam). " +
        "Identify only what is clearly visible. Never invent stem counts, " +
        "hidden flowers, or exact dimensions. Return JSON only.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            "Analyze this bouquet photo. Return JSON with keys: " +
            "mainFlowers (string[] slugs from: rose,lily,carnation,gerbera,chrysanthemum,hydrangea,sunflower,orchid,tulip,baby-breath,eucalyptus,mixed-flowers), " +
            "secondaryFlowers (string[] same vocabulary), " +
            "colors (string[] from: pink,red,white,yellow,orange,purple,blue,pastel,cream,green), " +
            "styles (string[] from: romantic,elegant,minimalist,luxury,natural,modern,classic), " +
            "occasions (string[] from: birthday,romance,congratulations,anniversary,graduation,wedding,condolences,everyday), " +
            "arrangementType (bouquet|flower-basket|flower-box|vase|other), " +
            "wrapping (short EN note), " +
            "dominantColor (one color slug), " +
            "confidence (0-1), " +
            "warnings (string[]).",
        },
        jpegBase64
          ? {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${jpegBase64}`,
                detail: "low",
              },
            }
          : {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
      ],
    },
  ];
  return openaiJson({ apiKey, model: MODEL_VISION, messages, maxTokens: 800 });
}

async function generateCopy(apiKey, analysis, keywords) {
  const messages = [
    {
      role: "system",
      content:
        "You write bilingual product copy for Sisters Flowers (Da Lat & Da Nang). " +
        "Vietnamese first, natural shopping language. English independently localized (not literal). " +
        "Never invent stem counts, sizes, delivery promises, or flower species not in analysis. " +
        "Avoid keyword stuffing. Return JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        analysis,
        matchedKeywords: keywords,
        keywordNote:
          "Keywords are market terminology, not verified search volumes.",
        required: {
          nameVi: "natural Vietnamese product name",
          nameEn: "English product name",
          tagVi: "short VI tag ≤6 words",
          tagEn: "short EN tag ≤6 words",
          blurbVi: "1–2 sentences VI",
          blurbEn: "1–2 sentences EN",
          storyVi: "2–4 sentences VI",
          storyEn: "2–4 sentences EN",
          seoTitleVi: "≤60 chars",
          seoTitleEn: "≤60 chars",
          seoDescriptionVi: "≤155 chars",
          seoDescriptionEn: "≤155 chars",
          imageAltVi: "descriptive VI alt",
          imageAltEn: "descriptive EN alt",
          accent: "rose|blush|ivory|sage",
          needsReview: "boolean if low confidence or warnings",
          reviewNotes: "string[]",
        },
      }),
    },
  ];
  return openaiJson({ apiKey, model: MODEL_COPY, messages, maxTokens: 1400 });
}

function estimateCostUsd(usageAccum) {
  // Approximate gpt-4o-mini list rates (subject to change); tracking only.
  const inTok = usageAccum.prompt_tokens || 0;
  const outTok = usageAccum.completion_tokens || 0;
  return (inTok * 0.15 + outTok * 0.6) / 1_000_000;
}

function pickKeywords(analysis) {
  const slugs = [
    ...(analysis.mainFlowers || []),
    ...(analysis.secondaryFlowers || []),
    ...(analysis.colors || []),
    ...(analysis.styles || []),
    ...(analysis.occasions || []),
  ];
  const set = new Set(slugs);
  const pool = [
    { vi: "bó hoa hồng", match: ["rose"] },
    { vi: "bó hoa hồng pastel", match: ["rose", "pastel"] },
    { vi: "bó hoa hồng đỏ", match: ["rose", "red"] },
    { vi: "bó hoa hồng màu hồng", match: ["rose", "pink"] },
    { vi: "bó hoa tặng sinh nhật", match: ["birthday"] },
    { vi: "hoa tặng người yêu", match: ["romance", "romantic"] },
    { vi: "bó hoa chúc mừng", match: ["congratulations"] },
    { vi: "bó hoa hướng dương", match: ["sunflower"] },
    { vi: "bó hoa mix", match: ["mixed-flowers"] },
  ];
  return pool.filter((k) => k.match.some((m) => set.has(m))).slice(0, 5);
}

async function main() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, "secrets", "supabase.env"));
  await loadEnvFile(path.join(ROOT, "secrets", "openai.env"));

  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    console.error(
      "Missing OPENAI_API_KEY. Add secrets/openai.env or set env, then re-run.",
    );
    process.exit(2);
  }

  const prisma = new PrismaClient();
  const attrs = await prisma.catalogAttribute.findMany({
    where: { active: true },
  });
  if (!attrs.length) {
    console.error("No CatalogAttribute rows — run scripts/seed-catalog-attributes.mjs first");
    process.exit(1);
  }
  const attrBySlug = new Map(attrs.map((a) => [a.slug, a]));

  const typeWhere =
    PRODUCT_TYPE === "all" || PRODUCT_TYPE === "*"
      ? {}
      : { productType: PRODUCT_TYPE };

  let products = await prisma.product.findMany({
    where: { published: true, ...typeWhere },
    orderBy: { nameEn: "asc" },
    include: { analysis: true },
  });
  if (LIMIT) products = products.slice(0, LIMIT);

  const job = DRY_RUN
    ? null
    : await prisma.catalogEnrichmentJob.create({
        data: {
          status: "running",
          total: products.length,
          applyWrites: APPLY,
        },
      });

  console.log(
    `Enrich ${products.length} products (type=${PRODUCT_TYPE} apply=${APPLY} dry=${DRY_RUN} force=${FORCE})`,
  );

  const usageAccum = { prompt_tokens: 0, completion_tokens: 0 };
  let done = 0;
  let failed = 0;
  let skipped = 0;
  const logLines = [];

  async function processOne(product) {
    const label = product.nameEn;
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { aiStatus: "processing" },
      });

      const imgUrl = stripQuery(product.imageFallback || product.image);
      const res = await fetch(imgUrl);
      if (!res.ok) throw new Error(`image fetch ${res.status}`);
      const raw = Buffer.from(await res.arrayBuffer());
      const hash = createHash("sha256").update(raw).digest("hex");

      let analysisPayload = product.analysis?.rawJson;
      let analysisMeta = product.analysis;

      if (
        FORCE ||
        !analysisMeta ||
        analysisMeta.imageHash !== hash ||
        !analysisPayload
      ) {
        const jpeg = await sharp(raw, { failOn: "none" })
          .rotate()
          .resize({ width: 768, withoutEnlargement: true })
          .jpeg({ quality: 78 })
          .toBuffer();
        const { json, usage } = await analyzeImage(
          apiKey,
          imgUrl,
          jpeg.toString("base64"),
        );
        usageAccum.prompt_tokens += usage.prompt_tokens || 0;
        usageAccum.completion_tokens += usage.completion_tokens || 0;
        analysisPayload = json;

        if (!DRY_RUN) {
          analysisMeta = await prisma.productAnalysis.upsert({
            where: { productId: product.id },
            create: {
              productId: product.id,
              imageHash: hash,
              rawJson: json,
              mainFlowers: json.mainFlowers || [],
              secondaryFlowers: json.secondaryFlowers || [],
              colors: json.colors || [],
              styles: json.styles || [],
              occasions: json.occasions || [],
              arrangementType: json.arrangementType || "bouquet",
              wrapping: json.wrapping || "",
              confidence: Number(json.confidence) || 0,
              warnings: json.warnings || [],
              model: MODEL_VISION,
            },
            update: {
              imageHash: hash,
              rawJson: json,
              mainFlowers: json.mainFlowers || [],
              secondaryFlowers: json.secondaryFlowers || [],
              colors: json.colors || [],
              styles: json.styles || [],
              occasions: json.occasions || [],
              arrangementType: json.arrangementType || "bouquet",
              wrapping: json.wrapping || "",
              confidence: Number(json.confidence) || 0,
              warnings: json.warnings || [],
              model: MODEL_VISION,
            },
          });
        }
      } else {
        skipped++;
        logLines.push(`${label}: reuse analysis`);
      }

      const a = analysisPayload || {};
      const kw = pickKeywords(a);
      const { json: copy, usage: copyUsage } = await generateCopy(apiKey, a, kw);
      usageAccum.prompt_tokens += copyUsage.prompt_tokens || 0;
      usageAccum.completion_tokens += copyUsage.completion_tokens || 0;

      const slugList = [
        ...(a.mainFlowers || []),
        ...(a.secondaryFlowers || []),
        ...(a.colors || []),
        ...(a.styles || []),
        a.arrangementType,
      ].filter(Boolean);

      if (!DRY_RUN) {
        // Attributes
        await prisma.productAttribute.deleteMany({
          where: { productId: product.id },
        });
        const uniqueSlugs = [...new Set(slugList)];
        for (const slug of uniqueSlugs) {
          const attr = attrBySlug.get(slug);
          if (!attr) continue;
          await prisma.productAttribute.create({
            data: {
              productId: product.id,
              attributeId: attr.id,
              confidence: Number(a.confidence) || 0.7,
            },
          });
        }

        // Occasion categories
        if (Array.isArray(a.occasions) && a.occasions.length) {
          const cats = await prisma.category.findMany({
            where: { slug: { in: a.occasions }, active: true },
          });
          for (const cat of cats) {
            await prisma.productCategory.upsert({
              where: {
                productId_categoryId: {
                  productId: product.id,
                  categoryId: cat.id,
                },
              },
              create: { productId: product.id, categoryId: cat.id },
              update: {},
            });
          }
        }

        const needsReview =
          Boolean(copy.needsReview) ||
          (Number(a.confidence) || 0) < 0.55 ||
          (a.warnings || []).length > 0;

        const data = {
          imageHash: hash,
          aiProcessedAt: new Date(),
          aiError: null,
          aiStatus: needsReview ? "needs_review" : "ready",
          accent:
            copy.accent && ["rose", "blush", "ivory", "sage"].includes(copy.accent)
              ? copy.accent
              : a.dominantColor === "pink"
                ? "blush"
                : a.dominantColor === "red"
                  ? "rose"
                  : a.dominantColor === "cream" || a.dominantColor === "white"
                    ? "ivory"
                    : product.accent,
        };

        if (APPLY && canApplyCopy(product)) {
          Object.assign(data, {
            nameEn: copy.nameEn || product.nameEn,
            nameVi: copy.nameVi || product.nameVi,
            tagEn: copy.tagEn || product.tagEn,
            tagVi: copy.tagVi || product.tagVi,
            blurbEn: copy.blurbEn || product.blurbEn,
            blurbVi: copy.blurbVi || product.blurbVi,
            storyEn: copy.storyEn || product.storyEn,
            storyVi: copy.storyVi || product.storyVi,
            seoTitleEn: copy.seoTitleEn || "",
            seoTitleVi: copy.seoTitleVi || "",
            seoDescriptionEn: copy.seoDescriptionEn || "",
            seoDescriptionVi: copy.seoDescriptionVi || "",
            imageAltEn: copy.imageAltEn || "",
            imageAltVi: copy.imageAltVi || "",
            contentSource: "ai",
            aiStatus: needsReview ? "needs_review" : "applied",
          });
        }

        await prisma.product.update({ where: { id: product.id }, data });
      }

      done++;
      console.log(
        `${label}: ok conf=${a.confidence ?? "?"} apply=${APPLY && canApplyCopy(product)}`,
      );
    } catch (err) {
      failed++;
      const msg = err?.message || String(err);
      logLines.push(`${label}: FAIL ${msg}`);
      console.error(`${label}: FAIL`, msg);
      if (!DRY_RUN) {
        await prisma.product.update({
          where: { id: product.id },
          data: { aiStatus: "error", aiError: msg.slice(0, 500) },
        });
      }
    }
  }

  // Simple pool
  let idx = 0;
  async function worker() {
    while (idx < products.length) {
      const i = idx++;
      await processOne(products[i]);
      if (job && i % 5 === 0) {
        await prisma.catalogEnrichmentJob.update({
          where: { id: job.id },
          data: { done, failed, skipped },
        });
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, products.length) }, () =>
      worker(),
    ),
  );

  const costUsd = estimateCostUsd(usageAccum);
  if (job) {
    await prisma.catalogEnrichmentJob.update({
      where: { id: job.id },
      data: {
        status: failed && !done ? "failed" : "completed",
        done,
        failed,
        skipped,
        costUsd,
        log: logLines.slice(-200).join("\n"),
        finishedAt: new Date(),
      },
    });
  }

  console.log(
    `\nDone. done=${done} failed=${failed} skipped_reuse=${skipped} ~$${costUsd.toFixed(4)}`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
