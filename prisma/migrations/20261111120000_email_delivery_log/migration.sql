-- CreateTable
CREATE TABLE "EmailDeliveryLog" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailDeliveryLog_eventKey_idx" ON "EmailDeliveryLog"("eventKey");

-- CreateIndex
CREATE INDEX "EmailDeliveryLog_createdAt_idx" ON "EmailDeliveryLog"("createdAt");
