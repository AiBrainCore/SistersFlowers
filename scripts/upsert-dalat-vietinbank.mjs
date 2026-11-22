#!/usr/bin/env node
/**
 * Upsert Da Lat VietinBank receiving account + enable VietQR.
 * Reads DATABASE_URL from env (or secrets/supabase.env via --env-file).
 *
 * Never commit live account numbers into the app source — this ops script
 * is the intentional place for a one-shot / redeployable upsert.
 *
 *   node --env-file=secrets/supabase.env scripts/upsert-dalat-vietinbank.mjs
 */
import { PrismaClient } from "@prisma/client";

const ACCOUNT = {
  label: "Da Lat · VietinBank · Sister Flower",
  bankCode: "970415",
  bankName: "VietinBank",
  accountNumber: "30556886",
  accountName: "HO KINH DOANH SISTER FLOWER",
  holderType: "household",
  citySlug: "dalat",
  isDefault: false,
  active: true,
  internalNote:
    "From Da Lat e-invoice HKD Sister Flower (MST 044192008767). Verified from sales invoice bank line.",
};

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing");
  }

  const existing = await prisma.paymentAccount.findFirst({
    where: {
      OR: [
        { accountNumber: ACCOUNT.accountNumber, citySlug: "dalat" },
        { accountNumber: ACCOUNT.accountNumber, bankCode: ACCOUNT.bankCode },
      ],
    },
  });

  const data = {
    ...ACCOUNT,
    verifiedAt: new Date(),
  };

  const row = existing
    ? await prisma.paymentAccount.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.paymentAccount.create({ data });

  await prisma.paymentMethodSetting.upsert({
    where: { methodId: "vietqr" },
    create: {
      methodId: "vietqr",
      enabled: true,
      comingSoon: false,
      sortOrder: 10,
    },
    update: {
      enabled: true,
      comingSoon: false,
    },
  });

  // Keep WhatsApp off as a checkout payment.
  await prisma.paymentMethodSetting.upsert({
    where: { methodId: "whatsapp" },
    create: {
      methodId: "whatsapp",
      enabled: false,
      comingSoon: false,
      sortOrder: 90,
    },
    update: { enabled: false, comingSoon: false },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: row.id,
        citySlug: row.citySlug,
        bankCode: row.bankCode,
        accountNumber: row.accountNumber,
        active: row.active,
        verified: Boolean(row.verifiedAt),
        action: existing ? "updated" : "created",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
