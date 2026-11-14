ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "coverAltEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "coverAltVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "seoTitleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "seoTitleVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "seoDescriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JournalPost" ADD COLUMN IF NOT EXISTS "seoDescriptionVi" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "JournalPostRevision" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalPostRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JournalPostRevision_postId_createdAt_idx" ON "JournalPostRevision"("postId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "JournalPostRevision" ADD CONSTRAINT "JournalPostRevision_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "JournalPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
