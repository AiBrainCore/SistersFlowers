-- Product SKU: short staff-facing code (unique). Backfill from slug digits.
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;

UPDATE "Product" AS p
SET "sku" = upper(
  'SF-' || COALESCE(
    (regexp_match(p."slug", '(?:^|-)img-([0-9]{3,})(?:-|$)'))[1],
    (regexp_match(p."slug", '([0-9]{3,})$'))[1],
    right(replace(p."id", '-', ''), 6)
  )
);

-- Disambiguate any collisions after backfill (append -2, -3, …).
WITH dups AS (
  SELECT "id", "sku",
    ROW_NUMBER() OVER (PARTITION BY "sku" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "Product"
)
UPDATE "Product" AS p
SET "sku" = d."sku" || '-' || d.rn::text
FROM dups AS d
WHERE p."id" = d."id" AND d.rn > 1;

ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
