-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'extra',
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionVi" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "requiresNote" BOOLEAN NOT NULL DEFAULT false,
    "partnerName" TEXT NOT NULL DEFAULT '',
    "partnerCategory" TEXT NOT NULL DEFAULT '',
    "commissionPercent" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'product',
    "note" TEXT,
    "partnerName" TEXT,
    "commissionPercent" INTEGER,
    "commissionAmount" INTEGER,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "image", "name", "orderId", "price", "qty", "slug") SELECT "id", "image", "name", "orderId", "price", "qty", "slug" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Addon_slug_key" ON "Addon"("slug");
