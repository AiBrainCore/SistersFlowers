-- Studio / phone order foundation (additive; shop orders keep defaults)

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'shop';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "saleCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillment" TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cardMessage" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "depositAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_saleCode_key" ON "Order"("saleCode");
CREATE INDEX IF NOT EXISTS "Order_source_createdAt_idx" ON "Order"("source", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_branchId_deliveryDate_idx" ON "Order"("branchId", "deliveryDate");

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "note" TEXT,
  "actor" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_createdAt_idx"
  ON "OrderStatusHistory"("orderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrderPayment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'other',
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "seenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderPayment_orderId_createdAt_idx"
  ON "OrderPayment"("orderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
