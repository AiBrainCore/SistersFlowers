-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT 'rose',
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "tagEn" TEXT NOT NULL,
    "tagVi" TEXT NOT NULL,
    "blurbEn" TEXT NOT NULL,
    "blurbVi" TEXT NOT NULL,
    "storyEn" TEXT NOT NULL,
    "storyVi" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
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
    "voucherExpiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "remitAmount" INTEGER,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "date" TEXT,
    "message" TEXT NOT NULL,
    "hotel" TEXT,
    "room" TEXT,
    "venue" TEXT,
    "guests" TEXT,
    "citySlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "studioName" TEXT NOT NULL DEFAULT 'Da Lat',
    "includedKm" INTEGER NOT NULL DEFAULT 8,
    "baseFee" INTEGER NOT NULL DEFAULT 30000,
    "midKm" INTEGER NOT NULL DEFAULT 20,
    "midFee" INTEGER NOT NULL DEFAULT 60000,
    "maxKm" INTEGER NOT NULL DEFAULT 45,
    "maxFee" INTEGER NOT NULL DEFAULT 120000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "quoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "noteEn" TEXT NOT NULL DEFAULT '',
    "noteVi" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
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
    "validityDays" INTEGER NOT NULL DEFAULT 90,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coming_soon',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coming_soon',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "addressEn" TEXT NOT NULL DEFAULT '',
    "addressVi" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCityAvailability" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" INTEGER,

    CONSTRAINT "ProductCityAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_voucherCode_key" ON "OrderItem"("voucherCode");

-- CreateIndex
CREATE UNIQUE INDEX "Addon_slug_key" ON "Addon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_cityId_slug_key" ON "Branch"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCityAvailability_productId_cityId_key" ON "ProductCityAvailability"("productId", "cityId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCityAvailability" ADD CONSTRAINT "ProductCityAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCityAvailability" ADD CONSTRAINT "ProductCityAvailability_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

