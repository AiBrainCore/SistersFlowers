import { prisma } from "@/lib/db";
import {
  baseSizePrices,
  citySizePrices,
  isProductSizeId,
  resolveSizePrice,
  type ProductSizeId,
} from "@/lib/product-sizes";
import type { CheckoutItem } from "@/lib/orders";

export type PricedCheckoutItem = CheckoutItem & {
  price: number;
  serverPrice: number;
  priceAdjusted: boolean;
};

/**
 * Recalculate line prices from catalog. Never trusts client amounts for charge.
 * Returns errors for unavailable / missing products.
 */
export async function repriceCheckoutItems(input: {
  items: CheckoutItem[];
  citySlug?: string | null;
}): Promise<
  | { ok: true; items: PricedCheckoutItem[]; subtotal: number }
  | { ok: false; error: string }
> {
  if (!input.items.length) {
    return { ok: false, error: "Cart is empty" };
  }

  const city = input.citySlug
    ? await prisma.city.findUnique({ where: { slug: input.citySlug } })
    : null;

  const priced: PricedCheckoutItem[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Math.round(item.qty) || 1);

    if (item.kind === "addon") {
      const addon = await prisma.addon.findFirst({
        where: { slug: item.slug, active: true },
      });
      if (!addon) {
        return {
          ok: false,
          error: `Unavailable extra: ${item.name || item.slug}`,
        };
      }
      const serverPrice = Math.round(addon.price);
      priced.push({
        ...item,
        qty,
        name: item.name || addon.nameEn,
        image: item.image || addon.image || "",
        price: serverPrice,
        serverPrice,
        priceAdjusted: serverPrice !== Math.round(item.price),
        addonKind: (addon.kind === "partner" ? "partner" : "extra") as
          | "extra"
          | "partner",
        partnerName: addon.partnerName || item.partnerName,
        commissionPercent: addon.commissionPercent ?? item.commissionPercent,
        validityDays: addon.validityDays ?? item.validityDays,
      });
      continue;
    }

    const product = await prisma.product.findFirst({
      where: { slug: item.slug, published: true },
      include: {
        cityStock: city ? { where: { cityId: city.id }, take: 1 } : false,
      },
    });
    if (!product) {
      return {
        ok: false,
        error: `Unavailable product: ${item.name || item.slug}`,
      };
    }

    const cityRow =
      Array.isArray(product.cityStock) && product.cityStock[0]
        ? product.cityStock[0]
        : null;
    if (cityRow && cityRow.available === false) {
      return {
        ok: false,
        error: `Not available in this city: ${item.name || item.slug}`,
      };
    }

    const base = baseSizePrices(product);
    const cityMap = cityRow ? citySizePrices(cityRow) : undefined;
    const fallback =
      cityRow?.priceOverride != null && cityRow.priceOverride > 0
        ? cityRow.priceOverride
        : product.price;

    let serverPrice = Math.round(fallback);
    const size = item.size && isProductSizeId(item.size) ? item.size : null;
    if (size) {
      serverPrice = Math.round(
        resolveSizePrice(size as ProductSizeId, base, cityMap, fallback),
      );
    }

    priced.push({
      ...item,
      qty,
      size: size || item.size,
      name: item.name || product.nameEn,
      image: item.image || product.image || "",
      price: serverPrice,
      serverPrice,
      priceAdjusted: serverPrice !== Math.round(item.price),
    });
  }

  const subtotal = priced.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { ok: true, items: priced, subtotal };
}
