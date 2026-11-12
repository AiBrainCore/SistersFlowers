ALTER TABLE "OrderMedia" ADD COLUMN IF NOT EXISTS "orderItemId" TEXT;

CREATE INDEX IF NOT EXISTS "OrderMedia_orderItemId_idx" ON "OrderMedia"("orderItemId");

DO $$ BEGIN
  ALTER TABLE "OrderMedia" ADD CONSTRAINT "OrderMedia_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
