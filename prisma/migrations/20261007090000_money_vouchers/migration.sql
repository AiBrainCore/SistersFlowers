-- AlterTable
ALTER TABLE "Addon" ADD COLUMN "validityDays" INTEGER NOT NULL DEFAULT 90;

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
    "voucherCode" TEXT,
    "voucherStatus" TEXT,
    "voucherExpiresAt" DATETIME,
    "redeemedAt" DATETIME,
    "remitAmount" INTEGER,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("commissionAmount", "commissionPercent", "id", "image", "kind", "name", "note", "orderId", "partnerName", "price", "qty", "slug") SELECT "commissionAmount", "commissionPercent", "id", "image", "kind", "name", "note", "orderId", "partnerName", "price", "qty", "slug" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE UNIQUE INDEX "OrderItem_voucherCode_key" ON "OrderItem"("voucherCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
