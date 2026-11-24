-- Google Shopping / Merchant Center feed controls
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "googleShopping" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "GoogleMerchantSetting" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultLocale" TEXT NOT NULL DEFAULT 'vi',
    "defaultCitySlug" TEXT NOT NULL DEFAULT 'danang',
    "brand" TEXT NOT NULL DEFAULT 'Sisters Flowers',
    "googleProductCategory" TEXT NOT NULL DEFAULT 'Arts & Entertainment > Party & Celebration > Gift Giving > Fresh Cut Flowers',
    "shippingFlatVnd" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleMerchantSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Product_googleShopping_published_idx" ON "Product"("googleShopping", "published");
