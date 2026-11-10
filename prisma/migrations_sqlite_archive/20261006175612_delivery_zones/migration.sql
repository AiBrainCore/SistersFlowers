-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "quoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "noteEn" TEXT NOT NULL DEFAULT '',
    "noteVi" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
