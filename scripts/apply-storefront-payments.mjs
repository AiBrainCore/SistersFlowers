/**
 * Enable VietQR + cash (COD / pickup); keep MoMo/card/etc. as Soon.
 * Usage: node scripts/apply-storefront-payments.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const live = ["vietqr", "cod", "cash_pickup"];
  const soon = ["momo", "zalopay", "card", "paypal", "payos"];

  for (const methodId of live) {
    await prisma.paymentMethodSetting.upsert({
      where: { methodId },
      create: {
        methodId,
        enabled: true,
        comingSoon: false,
        sortOrder: methodId === "vietqr" ? 10 : methodId === "cash_pickup" ? 70 : 80,
      },
      update: { enabled: true, comingSoon: false },
    });
    console.log(`ON  ${methodId}`);
  }

  for (const methodId of soon) {
    await prisma.paymentMethodSetting.upsert({
      where: { methodId },
      create: {
        methodId,
        enabled: false,
        comingSoon: true,
        sortOrder: 50,
      },
      update: { enabled: false, comingSoon: true },
    });
    console.log(`SOON ${methodId}`);
  }

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
  console.log("OFF whatsapp");

  const rows = await prisma.paymentMethodSetting.findMany({
    orderBy: { sortOrder: "asc" },
  });
  console.log(
    "settings",
    rows.map((r) => ({
      id: r.methodId,
      enabled: r.enabled,
      comingSoon: r.comingSoon,
    })),
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
