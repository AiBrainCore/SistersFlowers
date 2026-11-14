-- Compare-at (“was”) prices for sale display on shop + admin.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtPrice" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtSm" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtMd" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtLg" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtGrand" INTEGER;
