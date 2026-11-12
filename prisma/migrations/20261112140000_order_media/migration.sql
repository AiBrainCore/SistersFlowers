CREATE TABLE IF NOT EXISTS "OrderMedia" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mime" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "legacyDriveId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderMedia_orderId_sortOrder_idx"
  ON "OrderMedia"("orderId", "sortOrder");

DO $$ BEGIN
  ALTER TABLE "OrderMedia" ADD CONSTRAINT "OrderMedia_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
