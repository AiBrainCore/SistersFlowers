-- CreateTable
CREATE TABLE "DeliverySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "studioName" TEXT NOT NULL DEFAULT 'Da Lat',
    "includedKm" INTEGER NOT NULL DEFAULT 8,
    "baseFee" INTEGER NOT NULL DEFAULT 30000,
    "midKm" INTEGER NOT NULL DEFAULT 20,
    "midFee" INTEGER NOT NULL DEFAULT 60000,
    "maxKm" INTEGER NOT NULL DEFAULT 45,
    "maxFee" INTEGER NOT NULL DEFAULT 120000,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "zone" TEXT NOT NULL,
    "deliveryKm" INTEGER,
    "deliveryFee" INTEGER,
    "address" TEXT NOT NULL,
    "deliveryDate" TEXT,
    "deliveryTime" TEXT,
    "notes" TEXT,
    "recipientName" TEXT,
    "hotelName" TEXT,
    "roomNumber" TEXT,
    "subtotal" INTEGER NOT NULL,
    "deliveryTotal" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "whatsappUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Order" ("address", "createdAt", "customerName", "deliveryDate", "deliveryTime", "email", "hotelName", "id", "locale", "notes", "phone", "recipientName", "reference", "roomNumber", "status", "subtotal", "whatsappUrl", "zone") SELECT "address", "createdAt", "customerName", "deliveryDate", "deliveryTime", "email", "hotelName", "id", "locale", "notes", "phone", "recipientName", "reference", "roomNumber", "status", "subtotal", "whatsappUrl", "zone" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
