-- Customer address for admin list / detail (separate from Order.address)
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;

-- Backfill from each customer's latest order with a real address
UPDATE "Customer" AS c
SET "address" = o."address"
FROM (
  SELECT DISTINCT ON ("customerId")
    "customerId",
    "address"
  FROM "Order"
  WHERE "customerId" IS NOT NULL
    AND "address" IS NOT NULL
    AND trim("address") <> ''
    AND "address" <> '—'
  ORDER BY "customerId", "createdAt" DESC
) AS o
WHERE c."id" = o."customerId"
  AND (c."address" IS NULL OR trim(c."address") = '');
