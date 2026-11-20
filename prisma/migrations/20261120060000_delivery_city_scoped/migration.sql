-- Scope delivery zones + fee ladders by city (dalat / danang).

ALTER TABLE "DeliveryZone" ADD COLUMN IF NOT EXISTS "citySlug" TEXT NOT NULL DEFAULT 'dalat';

CREATE INDEX IF NOT EXISTS "DeliveryZone_citySlug_active_idx"
  ON "DeliveryZone"("citySlug", "active");

-- Move legacy single settings row to dalat; seed danang ladder.
UPDATE "DeliverySettings"
SET "id" = 'dalat', "studioName" = 'Da Lat'
WHERE "id" = 'default';

INSERT INTO "DeliverySettings" (
  "id",
  "studioName",
  "includedKm",
  "baseFee",
  "midKm",
  "midFee",
  "maxKm",
  "maxFee",
  "updatedAt"
)
SELECT
  'danang',
  'Da Nang',
  6,
  25000,
  15,
  50000,
  35,
  100000,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "DeliverySettings" WHERE "id" = 'danang'
);

-- Ensure existing zones are tagged dalat (default already set).
UPDATE "DeliveryZone" SET "citySlug" = 'dalat' WHERE "citySlug" IS NULL OR "citySlug" = '';
