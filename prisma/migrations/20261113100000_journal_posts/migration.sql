-- CreateTable
CREATE TABLE "JournalPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'tip',
    "cityScope" TEXT NOT NULL DEFAULT 'both',
    "titleEn" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL DEFAULT '',
    "excerptVi" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "bodyVi" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalPost_slug_key" ON "JournalPost"("slug");

-- CreateIndex
CREATE INDEX "JournalPost_published_publishedAt_idx" ON "JournalPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "JournalPost_kind_idx" ON "JournalPost"("kind");
