-- CreateTable
CREATE TABLE "BuilderSettings" (
    "id" TEXT NOT NULL,
    "catalog" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderSettings_pkey" PRIMARY KEY ("id")
);
