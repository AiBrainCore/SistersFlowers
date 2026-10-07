import { PrismaClient } from "@prisma/client";
import { products } from "../src/data/seed-products";

const prisma = new PrismaClient();

const DEFAULT_ZONES = [
  {
    nameEn: "Da Lat centre · Xuan Huong",
    nameVi: "Trung tâm Đà Lạt · Xuân Hương",
    km: 3,
    noteEn: "Lake, centre hotels, walking streets",
    noteVi: "Hồ, khách sạn trung tâm, phố đi bộ",
    sortOrder: 1,
  },
  {
    nameEn: "Central market area",
    nameVi: "Khu chợ Đà Lạt",
    km: 4,
    noteEn: "Near Cho Da Lat and nearby guesthouses",
    noteVi: "Gần chợ Đà Lạt và nhà nghỉ quanh đó",
    sortOrder: 2,
  },
  {
    nameEn: "Crazy House / centre south",
    nameVi: "Crazy House / phía nam trung tâm",
    km: 6,
    noteEn: "Popular hotel belt just outside the core",
    noteVi: "Khu khách sạn phổ biến sát trung tâm",
    sortOrder: 3,
  },
  {
    nameEn: "Valley of Love side",
    nameVi: "Hướng Thung lũng Tình Yêu",
    km: 8,
    noteEn: "Villas and stays toward the valley",
    noteVi: "Villa và homestay hướng thung lũng",
    sortOrder: 4,
  },
  {
    nameEn: "Tuyen Lam lake",
    nameVi: "Hồ Tuyền Lâm",
    km: 12,
    noteEn: "Resorts and dinner venues by the lake",
    noteVi: "Resort và tiệc quanh hồ",
    sortOrder: 5,
  },
  {
    nameEn: "Prenn / further outskirts",
    nameVi: "Prenn / ngoại ô xa hơn",
    km: 18,
    noteEn: "Longer road from the studio",
    noteVi: "Đường xa hơn từ studio",
    sortOrder: 6,
  },
  {
    nameEn: "Other / I am not sure",
    nameVi: "Khác / tôi chưa chắc",
    km: 99,
    quoteOnly: true,
    noteEn: "Leave your address — we confirm the fee",
    noteVi: "Để địa chỉ — chúng tôi xác nhận phí",
    sortOrder: 99,
  },
] as const;

async function main() {
  const productCount = await prisma.product.count();
  if (productCount === 0) {
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
  } else {
    console.log(`Skip products: ${productCount} already exist`);
  }

  await prisma.deliverySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      studioName: "Da Lat",
      includedKm: 8,
      baseFee: 30000,
      midKm: 20,
      midFee: 60000,
      maxKm: 45,
      maxFee: 120000,
    },
  });

  const zoneCount = await prisma.deliveryZone.count();
  if (zoneCount === 0) {
    for (const zone of DEFAULT_ZONES) {
      await prisma.deliveryZone.create({
        data: {
          nameEn: zone.nameEn,
          nameVi: zone.nameVi,
          km: zone.km,
          quoteOnly: "quoteOnly" in zone ? Boolean(zone.quoteOnly) : false,
          noteEn: zone.noteEn,
          noteVi: zone.noteVi,
          sortOrder: zone.sortOrder,
          active: true,
        },
      });
    }
    console.log(`Seeded ${DEFAULT_ZONES.length} delivery zones`);
  } else {
    console.log(`Skip zones: ${zoneCount} already exist`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
