/**
 * Staff-only checkout smoke-test SKU.
 * Toggle from Admin → Payments. When off, unpublished (hidden from shop).
 * Price is 1,000 VND — banks often reject 1₫ transfers; pickup keeps total = 1,000₫.
 */

import { prisma } from "@/lib/db";

export const CHECKOUT_TEST_PRODUCT_SLUG = "sf-checkout-test";
export const CHECKOUT_TEST_PRODUCT_SKU = "SF-TEST";
/** Prefer 1,000₫ over 1₫ — Napas / bank apps often reject tiny amounts. */
export const CHECKOUT_TEST_PRODUCT_PRICE_VND = 1_000;

const IMAGE = "/brand/mark-citrus.png";

export function isCheckoutTestProductSlug(slug: string | null | undefined) {
  return (slug || "").trim().toLowerCase() === CHECKOUT_TEST_PRODUCT_SLUG;
}

const productFields = {
  slug: CHECKOUT_TEST_PRODUCT_SLUG,
  sku: CHECKOUT_TEST_PRODUCT_SKU,
  price: CHECKOUT_TEST_PRODUCT_PRICE_VND,
  priceSm: null as number | null,
  priceMd: null as number | null,
  priceLg: null as number | null,
  priceGrand: null as number | null,
  compareAtPrice: null as number | null,
  compareAtSm: null as number | null,
  compareAtMd: null as number | null,
  compareAtLg: null as number | null,
  compareAtGrand: null as number | null,
  image: IMAGE,
  imageFallback: IMAGE,
  productType: "flower-basket",
  sourceKey: "checkout-test",
  accent: "citrus",
  nameEn: "Checkout test — 1,000₫",
  nameVi: "Kiểm tra thanh toán — 1.000đ",
  tagEn: "Staff test",
  tagVi: "Kiểm tra nội bộ",
  blurbEn:
    "Temporary staff product to verify shop → cart → VietQR. Use studio pickup so the total stays 1,000₫. Turn off in Admin → Payments when finished.",
  blurbVi:
    "Sản phẩm tạm để kiểm tra shop → giỏ → VietQR. Chọn lấy tại studio để tổng còn 1.000đ. Tắt trong Admin → Thanh toán khi xong.",
  storyEn:
    "Not for sale to guests. Enable only while testing payment. Prefer pickup (no delivery fee).",
  storyVi:
    "Không bán cho khách. Chỉ bật khi kiểm tra thanh toán. Nên chọn lấy tại cửa hàng (không phí giao).",
  seoTitleEn: "",
  seoTitleVi: "",
  seoDescriptionEn: "",
  seoDescriptionVi: "",
  imageAltEn: "Sisters Flowers checkout test",
  imageAltVi: "Kiểm tra thanh toán Sisters Flowers",
  contentSource: "manual",
  contentLocked: true,
  aiStatus: "skipped",
  sortOrder: 99_999,
} as const;

export type CheckoutTestProductStatus = {
  exists: boolean;
  enabled: boolean;
  productId: string | null;
  price: number;
  slug: string;
  sku: string;
};

export async function getCheckoutTestProductStatus(): Promise<CheckoutTestProductStatus> {
  const row = await prisma.product.findUnique({
    where: { slug: CHECKOUT_TEST_PRODUCT_SLUG },
    select: { id: true, published: true, price: true },
  });
  return {
    exists: Boolean(row),
    enabled: Boolean(row?.published),
    productId: row?.id ?? null,
    price: row?.price ?? CHECKOUT_TEST_PRODUCT_PRICE_VND,
    slug: CHECKOUT_TEST_PRODUCT_SLUG,
    sku: CHECKOUT_TEST_PRODUCT_SKU,
  };
}

/** Create or refresh the test SKU; set published to match `enabled`. */
export async function setCheckoutTestProductEnabled(
  enabled: boolean,
): Promise<CheckoutTestProductStatus> {
  const product = await prisma.product.upsert({
    where: { slug: CHECKOUT_TEST_PRODUCT_SLUG },
    create: {
      ...productFields,
      published: enabled,
    },
    update: {
      ...productFields,
      published: enabled,
    },
    select: { id: true, published: true, price: true },
  });

  const cities = await prisma.city.findMany({ select: { id: true } });
  for (const city of cities) {
    await prisma.productCityAvailability.upsert({
      where: {
        productId_cityId: { productId: product.id, cityId: city.id },
      },
      create: {
        productId: product.id,
        cityId: city.id,
        available: enabled,
        priceOverride: CHECKOUT_TEST_PRODUCT_PRICE_VND,
        priceSm: null,
        priceMd: null,
        priceLg: null,
        priceGrand: null,
      },
      update: {
        available: enabled,
        priceOverride: CHECKOUT_TEST_PRODUCT_PRICE_VND,
        priceSm: null,
        priceMd: null,
        priceLg: null,
        priceGrand: null,
      },
    });
  }

  return {
    exists: true,
    enabled: product.published,
    productId: product.id,
    price: product.price,
    slug: CHECKOUT_TEST_PRODUCT_SLUG,
    sku: CHECKOUT_TEST_PRODUCT_SKU,
  };
}
