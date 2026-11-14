-- Catalog AI intelligence: SEO fields, content provenance, attributes, analysis, jobs

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteSmEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteSmVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteMdEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteMdVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteLgEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteLgVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteGrandEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizeNoteGrandVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoTitleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoTitleVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoDescriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoDescriptionVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageAltEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageAltVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "contentSource" TEXT NOT NULL DEFAULT 'import';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "contentLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiError" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiProcessedAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageHash" TEXT;

CREATE INDEX IF NOT EXISTS "Product_aiStatus_idx" ON "Product"("aiStatus");
CREATE INDEX IF NOT EXISTS "Product_contentSource_idx" ON "Product"("contentSource");

CREATE TABLE IF NOT EXISTS "CatalogAttribute" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogAttribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogAttribute_slug_key" ON "CatalogAttribute"("slug");
CREATE INDEX IF NOT EXISTS "CatalogAttribute_kind_active_idx" ON "CatalogAttribute"("kind", "active");

CREATE TABLE IF NOT EXISTS "ProductAttribute" (
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("productId","attributeId")
);

CREATE INDEX IF NOT EXISTS "ProductAttribute_attributeId_idx" ON "ProductAttribute"("attributeId");

CREATE TABLE IF NOT EXISTS "ProductAnalysis" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "mainFlowers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secondaryFlowers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "arrangementType" TEXT NOT NULL DEFAULT 'bouquet',
    "wrapping" TEXT NOT NULL DEFAULT '',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "model" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductAnalysis_productId_key" ON "ProductAnalysis"("productId");

CREATE TABLE IF NOT EXISTS "CatalogEnrichmentJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "total" INTEGER NOT NULL DEFAULT 0,
    "done" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "applyWrites" BOOLEAN NOT NULL DEFAULT false,
    "costUsd" DOUBLE PRECISION,
    "log" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "CatalogEnrichmentJob_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeId_fkey"
    FOREIGN KEY ("attributeId") REFERENCES "CatalogAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProductAnalysis" ADD CONSTRAINT "ProductAnalysis_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
