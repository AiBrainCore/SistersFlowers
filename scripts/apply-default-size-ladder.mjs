/**
 * Set every product to S=450k / M=600k / L=850k, clear XL + Was + city size overrides.
 * Usage (from repo root, with DATABASE_URL loaded):
 *   node scripts/apply-default-size-ladder.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SM = 450_000;
const MD = 600_000;
const LG = 850_000;

async function main() {
  const result = await prisma.product.updateMany({
    data: {
      price: SM,
      priceSm: SM,
      priceMd: MD,
      priceLg: LG,
      priceGrand: null,
      compareAtPrice: null,
      compareAtSm: null,
      compareAtMd: null,
      compareAtLg: null,
      compareAtGrand: null,
    },
  });
  await prisma.productCityAvailability.updateMany({
    data: {
      priceSm: null,
      priceMd: null,
      priceLg: null,
      priceGrand: null,
      priceOverride: null,
    },
  });
  console.log(`Updated ${result.count} products → S ${SM} / M ${MD} / L ${LG}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
