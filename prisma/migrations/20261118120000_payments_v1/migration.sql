-- Payments V1: accounts, intents, delivery booking, notification outbox, order tracking
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingToken" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "anonymousSender" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_trackingToken_key" ON "Order"("trackingToken");

CREATE TABLE IF NOT EXISTS "PaymentAccount" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "holderType" TEXT NOT NULL DEFAULT 'household',
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "branchId" TEXT,
    "citySlug" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentMethodSetting" (
    "id" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "comingSoon" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentMethodSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodSetting_methodId_key" ON "PaymentMethodSetting"("methodId");

CREATE TABLE IF NOT EXISTS "PaymentIntent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "accountId" TEXT,
    "accountSnapshot" TEXT,
    "providerPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "qrImageUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentIntent_orderId_createdAt_idx" ON "PaymentIntent"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentIntent_reference_idx" ON "PaymentIntent"("reference");
CREATE INDEX IF NOT EXISTS "PaymentIntent_status_idx" ON "PaymentIntent"("status");

CREATE TABLE IF NOT EXISTS "DeliveryBooking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'grab_manual',
    "status" TEXT NOT NULL DEFAULT 'awaiting_arrangement',
    "customerFee" INTEGER NOT NULL DEFAULT 0,
    "actualCost" INTEGER,
    "bookingRef" TEXT,
    "trackingRef" TEXT,
    "courierName" TEXT,
    "courierPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliveryBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryBooking_orderId_key" ON "DeliveryBooking"("orderId");

CREATE TABLE IF NOT EXISTS "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationOutbox_dedupeKey_key" ON "NotificationOutbox"("dedupeKey");
CREATE INDEX IF NOT EXISTS "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "PaymentAccount_active_isDefault_idx" ON "PaymentAccount"("active", "isDefault");

DO $$ BEGIN
  ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryBooking" ADD CONSTRAINT "DeliveryBooking_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
