import { PrismaClient } from "@prisma/client";
import { products } from "../src/data/seed-products";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Skip seed: ${count} products already exist`);
    return;
  }

  for (const [index, product] of products.entries()) {
    await prisma.product.create({
      data: {
        slug: product.slug,
        price: product.price,
        image: product.image,
        accent: product.accent,
        nameEn: product.names.en,
        nameVi: product.names.vi,
        tagEn: product.tags.en,
        tagVi: product.tags.vi,
        blurbEn: product.blurb.en,
        blurbVi: product.blurb.vi,
        storyEn: product.story.en,
        storyVi: product.story.vi,
        published: true,
        sortOrder: index,
      },
    });
  }

  console.log(`Seeded ${products.length} products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
