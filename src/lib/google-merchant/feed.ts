import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { CHECKOUT_TEST_PRODUCT_SKU } from "@/lib/checkout-test-product";
import { PUBLIC_SITE_ORIGIN, siteUrl } from "@/lib/seo";
import { getProductType } from "@/lib/product-types";
import {
  productUsesSizeLadder,
  sizeLabel,
  type ProductSizeId,
} from "@/lib/product-sizes";
import type { Locale } from "@/i18n/config";

export type MerchantFeedOptions = {
  locale?: Locale;
  citySlug?: string;
};

export type MerchantFeedItem = {
  id: string;
  itemGroupId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLink?: string;
  priceVnd: number;
  availability: "in_stock" | "out_of_stock";
  condition: "new";
  brand: string;
  productType: string;
  googleProductCategory: string;
  size?: string;
  customLabel0?: string;
  identifierExists: false;
};

export type MerchantFeedIssue = {
  sku: string;
  slug: string;
  reason: string;
};

export type MerchantFeedResult = {
  items: MerchantFeedItem[];
  issues: MerchantFeedIssue[];
  meta: {
    locale: Locale;
    citySlug: string;
    brand: string;
    googleProductCategory: string;
    shippingFlatVnd: number | null;
    productCount: number;
    itemCount: number;
  };
};

const DEFAULT_CATEGORY =
  "Arts & Entertainment > Party & Celebration > Gift Giving > Fresh Cut Flowers";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plainText(value: string, max = 5000) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function absoluteImageUrl(image: string) {
  const raw = image.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return siteUrl(raw.startsWith("/") ? raw : `/${raw}`);
}

export async function getGoogleMerchantSettings() {
  return prisma.googleMerchantSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled: true,
      defaultLocale: "vi",
      defaultCitySlug: "danang",
      brand: BRAND.name,
      googleProductCategory: DEFAULT_CATEGORY,
    },
    update: {},
  });
}

export async function buildGoogleMerchantFeed(
  opts: MerchantFeedOptions = {},
): Promise<MerchantFeedResult> {
  const settings = await getGoogleMerchantSettings();
  const locale = (opts.locale ||
    (settings.defaultLocale === "en" ? "en" : "vi")) as Locale;
  const citySlug = (opts.citySlug || settings.defaultCitySlug || "danang").trim();

  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  const products = await prisma.product.findMany({
    where: {
      published: true,
      googleShopping: true,
    },
    include: {
      cityStock: {
        where: city ? { cityId: city.id } : undefined,
        include: { city: { select: { slug: true } } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const items: MerchantFeedItem[] = [];
  const issues: MerchantFeedIssue[] = [];
  const brand = settings.brand || BRAND.name;
  const googleProductCategory =
    settings.googleProductCategory || DEFAULT_CATEGORY;

  if (!settings.enabled) {
    return {
      items: [],
      issues: [
        {
          sku: "-",
          slug: "-",
          reason: "feed_disabled_in_admin",
        },
      ],
      meta: {
        locale,
        citySlug,
        brand,
        googleProductCategory,
        shippingFlatVnd: settings.shippingFlatVnd,
        productCount: 0,
        itemCount: 0,
      },
    };
  }

  for (const product of products) {
    if (product.sku === CHECKOUT_TEST_PRODUCT_SKU) {
      issues.push({
        sku: product.sku,
        slug: product.slug,
        reason: "checkout_test_sku_excluded",
      });
      continue;
    }

    const blocked = product.cityStock.some((s) => !s.available);
    if (city && blocked) {
      issues.push({
        sku: product.sku,
        slug: product.slug,
        reason: `unavailable_in_${citySlug}`,
      });
      continue;
    }

    const imageLink = absoluteImageUrl(product.image);
    if (!imageLink || !/^https:\/\//i.test(imageLink)) {
      issues.push({
        sku: product.sku,
        slug: product.slug,
        reason: "missing_https_image",
      });
      continue;
    }

    const name =
      locale === "vi"
        ? product.nameVi || product.nameEn
        : product.nameEn || product.nameVi;
    const description = plainText(
      locale === "vi"
        ? product.seoDescriptionVi ||
            product.blurbVi ||
            product.storyVi ||
            product.nameVi
        : product.seoDescriptionEn ||
            product.blurbEn ||
            product.storyEn ||
            product.nameEn,
      5000,
    );
    if (!name.trim()) {
      issues.push({
        sku: product.sku,
        slug: product.slug,
        reason: "missing_title",
      });
      continue;
    }

    const link = `${PUBLIC_SITE_ORIGIN}/${locale}/shop/${product.slug}`;
    const typeMeta = getProductType(product.productType || "bouquet");
    const productTypeLabel =
      locale === "vi" ? typeMeta.nameVi : typeMeta.nameEn;
    const cityRow = product.cityStock[0];
    const additionalImageLink = product.imageFallback
      ? absoluteImageUrl(product.imageFallback)
      : undefined;

    const pushItem = (input: {
      id: string;
      title: string;
      priceVnd: number;
      size?: ProductSizeId;
    }) => {
      if (!input.priceVnd || input.priceVnd <= 0) {
        issues.push({
          sku: product.sku,
          slug: product.slug,
          reason: `invalid_price_${input.id}`,
        });
        return;
      }
      items.push({
        id: input.id,
        itemGroupId: product.sku,
        title: plainText(input.title, 150),
        description,
        link,
        imageLink,
        additionalImageLink:
          additionalImageLink && additionalImageLink !== imageLink
            ? additionalImageLink
            : undefined,
        priceVnd: Math.round(input.priceVnd),
        availability: "in_stock",
        condition: "new",
        brand,
        productType: productTypeLabel,
        googleProductCategory,
        size: input.size ? sizeLabel(input.size, locale) : undefined,
        customLabel0: citySlug,
        identifierExists: false,
      });
    };

    if (productUsesSizeLadder(product.productType)) {
      const sizes: { id: ProductSizeId; price: number | null | undefined }[] = [
        {
          id: "sm",
          price: cityRow?.priceSm ?? product.priceSm,
        },
        {
          id: "md",
          price: cityRow?.priceMd ?? product.priceMd,
        },
        {
          id: "lg",
          price: cityRow?.priceLg ?? product.priceLg,
        },
      ];
      const offered = sizes.filter(
        (s) => s.price != null && Number(s.price) > 0,
      );
      if (!offered.length) {
        // Fallback to list price as medium.
        pushItem({
          id: product.sku,
          title: name,
          priceVnd: cityRow?.priceOverride ?? product.price,
        });
      } else {
        for (const size of offered) {
          const label = sizeLabel(size.id, locale);
          pushItem({
            id: `${product.sku}-${size.id}`,
            title: `${name} - ${label}`,
            priceVnd: Number(size.price),
            size: size.id,
          });
        }
      }
    } else {
      pushItem({
        id: product.sku,
        title: name,
        priceVnd: cityRow?.priceOverride ?? product.price,
      });
    }
  }

  return {
    items,
    issues,
    meta: {
      locale,
      citySlug,
      brand,
      googleProductCategory,
      shippingFlatVnd: settings.shippingFlatVnd,
      productCount: products.length,
      itemCount: items.length,
    },
  };
}

export function merchantFeedToXml(
  result: MerchantFeedResult,
  opts?: { title?: string },
) {
  const { items, meta } = result;
  const channelTitle =
    opts?.title || `${meta.brand} Google Merchant feed (${meta.citySlug})`;
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `<channel>`,
    `<title>${xmlEscape(channelTitle)}</title>`,
    `<link>${xmlEscape(PUBLIC_SITE_ORIGIN)}</link>`,
    `<description>${xmlEscape(
      `Product feed for Google Merchant Center — ${meta.locale}/${meta.citySlug}`,
    )}</description>`,
  ];

  for (const item of items) {
    lines.push(`<item>`);
    lines.push(`<g:id>${xmlEscape(item.id)}</g:id>`);
    lines.push(`<g:item_group_id>${xmlEscape(item.itemGroupId)}</g:item_group_id>`);
    lines.push(`<g:title>${xmlEscape(item.title)}</g:title>`);
    lines.push(
      `<g:description>${xmlEscape(item.description)}</g:description>`,
    );
    lines.push(`<g:link>${xmlEscape(item.link)}</g:link>`);
    lines.push(`<g:image_link>${xmlEscape(item.imageLink)}</g:image_link>`);
    if (item.additionalImageLink) {
      lines.push(
        `<g:additional_image_link>${xmlEscape(item.additionalImageLink)}</g:additional_image_link>`,
      );
    }
    lines.push(
      `<g:availability>${item.availability}</g:availability>`,
    );
    lines.push(`<g:condition>${item.condition}</g:condition>`);
    lines.push(`<g:price>${item.priceVnd} VND</g:price>`);
    lines.push(`<g:brand>${xmlEscape(item.brand)}</g:brand>`);
    lines.push(
      `<g:identifier_exists>no</g:identifier_exists>`,
    );
    lines.push(
      `<g:google_product_category>${xmlEscape(item.googleProductCategory)}</g:google_product_category>`,
    );
    lines.push(
      `<g:product_type>${xmlEscape(item.productType)}</g:product_type>`,
    );
    if (item.size) {
      lines.push(`<g:size>${xmlEscape(item.size)}</g:size>`);
    }
    if (item.customLabel0) {
      lines.push(
        `<g:custom_label_0>${xmlEscape(item.customLabel0)}</g:custom_label_0>`,
      );
    }
    if (meta.shippingFlatVnd != null && meta.shippingFlatVnd >= 0) {
      lines.push(`<g:shipping>`);
      lines.push(`<g:country>VN</g:country>`);
      lines.push(`<g:service>Standard</g:service>`);
      lines.push(`<g:price>${meta.shippingFlatVnd} VND</g:price>`);
      lines.push(`</g:shipping>`);
    }
    lines.push(`</item>`);
  }

  lines.push(`</channel>`);
  lines.push(`</rss>`);
  return `${lines.join("\n")}\n`;
}

export function merchantFeedToTsv(result: MerchantFeedResult) {
  const header = [
    "id",
    "item_group_id",
    "title",
    "description",
    "link",
    "image_link",
    "additional_image_link",
    "availability",
    "condition",
    "price",
    "brand",
    "identifier_exists",
    "google_product_category",
    "product_type",
    "size",
    "custom_label_0",
  ];
  const rows = [header.join("\t")];
  for (const item of result.items) {
    rows.push(
      [
        item.id,
        item.itemGroupId,
        item.title.replace(/\t|\n/g, " "),
        item.description.replace(/\t|\n/g, " "),
        item.link,
        item.imageLink,
        item.additionalImageLink || "",
        item.availability,
        item.condition,
        `${item.priceVnd} VND`,
        item.brand,
        "no",
        item.googleProductCategory,
        item.productType,
        item.size || "",
        item.customLabel0 || "",
      ].join("\t"),
    );
  }
  return `${rows.join("\n")}\n`;
}
