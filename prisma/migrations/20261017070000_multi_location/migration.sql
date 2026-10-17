-- Multi-location foundation: City → Branch → optional city assortment
-- Non-destructive: existing products, orders, and delivery stay intact.

CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coming_soon',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coming_soon',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "addressEn" TEXT NOT NULL DEFAULT '',
    "addressVi" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Branch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Branch_cityId_slug_key" ON "Branch"("cityId", "slug");

CREATE TABLE "ProductCityAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" INTEGER,
    CONSTRAINT "ProductCityAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCityAvailability_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProductCityAvailability_productId_cityId_key" ON "ProductCityAvailability"("productId", "cityId");

-- Optional city marker on inquiries (SQLite-compatible add column)
ALTER TABLE "Inquiry" ADD COLUMN "citySlug" TEXT;
