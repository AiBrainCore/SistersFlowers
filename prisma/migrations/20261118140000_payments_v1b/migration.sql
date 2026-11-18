-- Payments V1b: checklist, size snapshot, acknowledge for ops alerts
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3);
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;

CREATE TABLE IF NOT EXISTS "FulfillmentChecklist" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "flowersPrepared" BOOLEAN NOT NULL DEFAULT false,
    "customVerified" BOOLEAN NOT NULL DEFAULT false,
    "extrasIncluded" BOOLEAN NOT NULL DEFAULT false,
    "greetingCardIncluded" BOOLEAN NOT NULL DEFAULT false,
    "recipientVerified" BOOLEAN NOT NULL DEFAULT false,
    "packagingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "readyForHandoff" BOOLEAN NOT NULL DEFAULT false,
    "overrideNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FulfillmentChecklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FulfillmentChecklist_orderId_key" ON "FulfillmentChecklist"("orderId");

DO $$ BEGIN
  ALTER TABLE "FulfillmentChecklist" ADD CONSTRAINT "FulfillmentChecklist_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
