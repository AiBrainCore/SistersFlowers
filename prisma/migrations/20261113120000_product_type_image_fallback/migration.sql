-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageFallback" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'bouquet';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceKey" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_productType_published_idx" ON "Product"("productType", "published");
CREATE INDEX IF NOT EXISTS "Product_sourceKey_idx" ON "Product"("sourceKey");
