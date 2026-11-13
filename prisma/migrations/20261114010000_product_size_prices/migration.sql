-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceSm" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceMd" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceLg" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceGrand" INTEGER;

-- AlterTable ProductCityAvailability
ALTER TABLE "ProductCityAvailability" ADD COLUMN IF NOT EXISTS "priceSm" INTEGER;
ALTER TABLE "ProductCityAvailability" ADD COLUMN IF NOT EXISTS "priceMd" INTEGER;
ALTER TABLE "ProductCityAvailability" ADD COLUMN IF NOT EXISTS "priceLg" INTEGER;
ALTER TABLE "ProductCityAvailability" ADD COLUMN IF NOT EXISTS "priceGrand" INTEGER;
