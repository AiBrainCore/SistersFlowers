"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  clearAdminSession,
  setAdminSession,
  verifyAdminPassword,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import { slugify } from "@/lib/products";
import { makeAddonSlug } from "@/lib/addons";
import {
  listCitiesForPricing,
  parseOptionalVnd,
  upsertProductCityStock,
} from "@/lib/product-city";
import { syncListPrice, type SizePriceMap } from "@/lib/product-sizes";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function readBaseSizePrices(formData: FormData): SizePriceMap {
  return {
    sm: parseOptionalVnd(formData.get("priceSm")),
    md: parseOptionalVnd(formData.get("priceMd")),
    lg: parseOptionalVnd(formData.get("priceLg")),
    grand: parseOptionalVnd(formData.get("priceGrand")),
  };
}

async function readCityStockFromForm(formData: FormData) {
  const cities = await listCitiesForPricing();
  return cities.map((city) => {
    const available = formData.get(`cityAvailable_${city.slug}`) === "on";
    const priceOverride = parseOptionalVnd(
      formData.get(`cityPrice_${city.slug}`),
    );
    return {
      cityId: city.id,
      available,
      priceOverride,
      priceSm: parseOptionalVnd(formData.get(`cityPriceSm_${city.slug}`)),
      priceMd: parseOptionalVnd(formData.get(`cityPriceMd_${city.slug}`)),
      priceLg: parseOptionalVnd(formData.get(`cityPriceLg_${city.slug}`)),
      priceGrand: parseOptionalVnd(
        formData.get(`cityPriceGrand_${city.slug}`),
      ),
    };
  });
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function setAdminLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") || "en");
  const { ADMIN_LOCALE_COOKIE, isAdminLocale } = await import("@/lib/admin-locale");
  const value = isAdminLocale(locale) ? locale : "en";
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(ADMIN_LOCALE_COOKIE, value, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const next = String(formData.get("next") || "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const nameEn = String(formData.get("nameEn") || "").trim();
  const nameVi = String(formData.get("nameVi") || "").trim();
  const sizePrices = readBaseSizePrices(formData);
  const legacyPrice = Number(formData.get("price") || 0);
  const price = syncListPrice(sizePrices, legacyPrice);
  let slug = String(formData.get("slug") || "").trim() || slugify(nameEn || nameVi);
  const accent = String(formData.get("accent") || "rose");
  const tagEn = String(formData.get("tagEn") || "Wrapped bouquet");
  const tagVi = String(formData.get("tagVi") || "Bó hoa gói giấy");
  const blurbEn = String(formData.get("blurbEn") || "");
  const blurbVi = String(formData.get("blurbVi") || "");
  const storyEn = String(formData.get("storyEn") || "");
  const storyVi = String(formData.get("storyVi") || "");
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const published = formData.get("published") === "on";
  const existingImage = String(formData.get("existingImage") || "");

  if (!nameEn || !nameVi || !price || !slug) {
    redirect(id ? `/admin/products/${id}?error=1` : "/admin/products/new?error=1");
  }

  const sizeData = {
    priceSm: sizePrices.sm,
    priceMd: sizePrices.md,
    priceLg: sizePrices.lg,
    priceGrand: sizePrices.grand,
  };

  let image = existingImage || "/bouquets/shown/w-01.jpg";
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const filename = `${slug}-${Date.now()}${safeExt}`;
    const dir = path.join(process.cwd(), "public", "bouquets", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    image = `/bouquets/uploads/${filename}`;
  }

  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  let productId = id;

  if (id) {
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) redirect("/admin/products");
    if (slug !== current.slug) {
      const clash = await prisma.product.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    }
    await prisma.product.update({
      where: { id },
      data: {
        slug,
        price,
        ...sizeData,
        image,
        accent,
        nameEn,
        nameVi,
        tagEn,
        tagVi,
        blurbEn,
        blurbVi,
        storyEn,
        storyVi,
        sortOrder,
        published,
      },
    });
  } else {
    const clash = await prisma.product.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    const created = await prisma.product.create({
      data: {
        slug,
        price,
        ...sizeData,
        image,
        accent,
        nameEn,
        nameVi,
        tagEn,
        tagVi,
        blurbEn,
        blurbVi,
        storyEn,
        storyVi,
        sortOrder,
        published,
      },
    });
    productId = created.id;
  }

  if (productId) {
    await prisma.productCategory.deleteMany({ where: { productId } });
    if (categoryIds.length) {
      await prisma.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      });
    }
    const cityStock = await readCityStockFromForm(formData);
    if (cityStock.length) {
      await upsertProductCityStock(productId, cityStock);
    }
  }

  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/vi");
  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/products");
}

/** Quick inline save of base + DN/DL prices (and availability) from the list. */
export async function quickSaveProductCityPricesAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/products");

  const price = Number(formData.get("price") || 0);
  if (!price || !Number.isFinite(price)) {
    redirect("/admin/products?error=price");
  }

  await prisma.product.update({
    where: { id },
    data: { price: Math.round(price) },
  });

  const cityStock = await readCityStockFromForm(formData);
  if (cityStock.length) {
    await upsertProductCityStock(id, cityStock);
  }

  revalidatePath("/");
  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/products");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (id) {
    await prisma.order.update({ where: { id }, data: { status } });
  }
  redirect("/admin/orders");
}

export async function updateInquiryStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  if (id) {
    await prisma.inquiry.update({ where: { id }, data: { status } });
  }
  redirect("/admin/inquiries");
}

export async function saveDeliverySettingsAction(formData: FormData) {
  await requireAdmin();

  const studioName = String(formData.get("studioName") || "Da Lat").trim();
  const includedKm = Number(formData.get("includedKm") || 8);
  const baseFee = Number(formData.get("baseFee") || 30000);
  const midKm = Number(formData.get("midKm") || 20);
  const midFee = Number(formData.get("midFee") || 60000);
  const maxKm = Number(formData.get("maxKm") || 45);
  const maxFee = Number(formData.get("maxFee") || 120000);

  await prisma.deliverySettings.upsert({
    where: { id: "default" },
    update: {
      studioName,
      includedKm,
      baseFee,
      midKm,
      midFee,
      maxKm,
      maxFee,
    },
    create: {
      id: "default",
      studioName,
      includedKm,
      baseFee,
      midKm,
      midFee,
      maxKm,
      maxFee,
    },
  });

  revalidatePath("/en/delivery");
  revalidatePath("/vi/delivery");
  revalidatePath("/en/checkout");
  revalidatePath("/vi/checkout");
  redirect("/admin/delivery?saved=1");
}

export async function saveDeliveryZoneAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const nameEn = String(formData.get("nameEn") || "").trim();
  const nameVi = String(formData.get("nameVi") || "").trim();
  const km = Number(formData.get("km") || 0);
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const noteEn = String(formData.get("noteEn") || "").trim();
  const noteVi = String(formData.get("noteVi") || "").trim();
  const quoteOnly = formData.get("quoteOnly") === "on";
  const active = formData.get("active") === "on";

  if (!nameEn || !nameVi) {
    redirect("/admin/delivery?error=1");
  }

  if (id) {
    await prisma.deliveryZone.update({
      where: { id },
      data: { nameEn, nameVi, km, sortOrder, noteEn, noteVi, quoteOnly, active },
    });
  } else {
    await prisma.deliveryZone.create({
      data: { nameEn, nameVi, km, sortOrder, noteEn, noteVi, quoteOnly, active },
    });
  }

  revalidatePath("/en/delivery");
  revalidatePath("/vi/delivery");
  revalidatePath("/en/checkout");
  revalidatePath("/vi/checkout");
  redirect("/admin/delivery?zones=1");
}

export async function deleteDeliveryZoneAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.deliveryZone.delete({ where: { id } });
  }
  revalidatePath("/en/delivery");
  revalidatePath("/vi/delivery");
  revalidatePath("/en/checkout");
  revalidatePath("/vi/checkout");
  redirect("/admin/delivery?zones=1");
}

export async function saveAddonAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const kind = String(formData.get("kind") || "extra") === "partner" ? "partner" : "extra";
  const nameEn = String(formData.get("nameEn") || "").trim();
  const nameVi = String(formData.get("nameVi") || "").trim();
  let slug = String(formData.get("slug") || "").trim() || makeAddonSlug(nameEn || nameVi);
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const descriptionVi = String(formData.get("descriptionVi") || "").trim();
  const price = Number(formData.get("price") || 0);
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const requiresNote = formData.get("requiresNote") === "on";
  const active = formData.get("active") === "on";
  const partnerName = String(formData.get("partnerName") || "").trim();
  const partnerCategory = String(formData.get("partnerCategory") || "").trim();
  const commissionPercent = Number(formData.get("commissionPercent") || 0);
  const validityDays = Math.max(
    1,
    Number(formData.get("validityDays") || 90) || 90,
  );
  const existingImage = String(formData.get("existingImage") || "");

  if (!nameEn || !nameVi || price < 0) {
    redirect("/admin/addons?error=1");
  }

  let image = existingImage;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const filename = `${slug}-${Date.now()}${safeExt}`;
    const dir = path.join(process.cwd(), "public", "bouquets", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    image = `/bouquets/uploads/${filename}`;
  }

  const data = {
    slug,
    kind,
    nameEn,
    nameVi,
    descriptionEn,
    descriptionVi,
    price,
    image,
    requiresNote,
    active,
    sortOrder,
    partnerName: kind === "partner" ? partnerName : "",
    partnerCategory: kind === "partner" ? partnerCategory : "",
    commissionPercent: kind === "partner" ? commissionPercent : 0,
    validityDays: kind === "partner" ? validityDays : 90,
  };

  if (id) {
    const current = await prisma.addon.findUnique({ where: { id } });
    if (!current) redirect("/admin/addons");
    if (slug !== current.slug) {
      const clash = await prisma.addon.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;
      data.slug = slug;
    }
    await prisma.addon.update({ where: { id }, data });
  } else {
    const clash = await prisma.addon.findUnique({ where: { slug } });
    if (clash) {
      data.slug = `${slug}-${Date.now().toString(36)}`;
    }
    await prisma.addon.create({ data });
  }

  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/addons?saved=1");
}

export async function deleteAddonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.addon.delete({ where: { id } });
  }
  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/addons?saved=1");
}

export async function redeemVoucherAdminAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") || "").trim();
  const { redeemVoucher } = await import("@/lib/vouchers");
  const result = await redeemVoucher(code);
  revalidatePath("/admin/vouchers");
  revalidatePath("/admin/orders");
  if (!result.ok) {
    redirect(`/admin/vouchers?error=${result.error}`);
  }
  redirect("/admin/vouchers?redeemed=1");
}

export async function createStudioOrderAction(formData: FormData) {
  await requireAdmin();

  const {
    allocateSaleCode,
    parseStudioLines,
  } = await import("@/lib/studio-orders");
  const { makeOrderReference } = await import("@/lib/orders");

  const branchId = String(formData.get("branchId") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const fulfillment =
    String(formData.get("fulfillment") || "delivery") === "pickup"
      ? "pickup"
      : "delivery";
  const address = String(formData.get("address") || "").trim();
  const deliveryDate = String(formData.get("deliveryDate") || "").trim();
  const deliveryTime = String(formData.get("deliveryTime") || "").trim();
  const cardMessage = String(formData.get("cardMessage") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const paymentStatusRaw = String(formData.get("paymentStatus") || "unpaid");
  const paymentStatus = ["unpaid", "deposit", "paid", "cod"].includes(
    paymentStatusRaw,
  )
    ? paymentStatusRaw
    : "unpaid";
  const depositAmount = Math.max(
    0,
    Math.round(Number(formData.get("depositAmount") || 0) || 0),
  );
  const deliveryFee = Math.max(
    0,
    Math.round(Number(formData.get("deliveryFee") || 0) || 0),
  );

  const structuredNames = formData.getAll("lineName").map((v) => String(v).trim());
  const structuredQty = formData.getAll("lineQty").map((v) => String(v).trim());
  const structuredPrice = formData
    .getAll("linePrice")
    .map((v) => String(v).trim());
  const structuredLines: { name: string; qty: number; price: number }[] = [];
  for (let i = 0; i < structuredNames.length; i++) {
    const name = structuredNames[i];
    if (!name) continue;
    const qty = Math.max(1, Number(structuredQty[i]) || 1);
    const price = Math.max(0, Math.round(Number(structuredPrice[i]) || 0));
    if (!price) continue;
    structuredLines.push({ name, qty, price });
  }
  const extraLines = parseStudioLines(String(formData.get("lines") || ""));
  const lines = [...structuredLines, ...extraLines];

  const branch = branchId
    ? await prisma.branch.findUnique({
        where: { id: branchId },
        include: { city: true },
      })
    : null;

  if (
    !branch ||
    !customerName ||
    !lines.length ||
    (fulfillment === "delivery" && !address)
  ) {
    redirect("/admin/studio-orders/new?error=1");
  }

  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const fee = fulfillment === "delivery" ? deliveryFee : 0;
  const deliveryTotal = subtotal + fee;
  const saleCode = await allocateSaleCode(branch.slug);
  const reference = makeOrderReference();
  const zone =
    fulfillment === "pickup"
      ? `pickup:${branch.city.slug}`
      : `studio:${branch.city.slug}`;

  const order = await prisma.order.create({
    data: {
      reference,
      saleCode,
      source: "studio",
      branchId: branch.id,
      locale: "vi",
      customerName,
      phone: phone || "—",
      zone,
      deliveryFee: fee || null,
      address:
        fulfillment === "pickup"
          ? branch.addressVi || branch.addressEn || "Pickup at studio"
          : address || "—",
      deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null,
      fulfillment,
      notes: notes || null,
      recipientName: recipientName || null,
      recipientPhone: recipientPhone || null,
      cardMessage: cardMessage || null,
      subtotal,
      deliveryTotal,
      paymentStatus,
      depositAmount: paymentStatus === "deposit" ? depositAmount : 0,
      status: "new",
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: "new",
          note: "Order created",
          actor: "admin",
        },
      },
      payments:
        paymentStatus === "unpaid"
          ? undefined
          : {
              create: {
                kind:
                  paymentStatus === "deposit"
                    ? "deposit"
                    : paymentStatus === "cod"
                      ? "cod"
                      : "full",
                method: paymentStatus === "cod" ? "cash" : "other",
                amount:
                  paymentStatus === "deposit"
                    ? depositAmount
                    : paymentStatus === "paid"
                      ? deliveryTotal
                      : deliveryTotal,
                seenAt: new Date(),
                note: "Recorded at create",
              },
            },
    },
  });

  const { mkdir, writeFile } = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "public", "studio-orders");
  let wroteDir = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const files = formData
      .getAll(`linePhotos_${lineIndex}`)
      .filter((value): value is File => value instanceof File && value.size > 0)
      .slice(0, 4);

    let primaryImage = "";
    const mediaCreates: {
      orderId: string;
      url: string;
      mime: string;
      sortOrder: number;
    }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 6 * 1024 * 1024) continue;
      const type = file.type || "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(type)) continue;
      if (!wroteDir) {
        await mkdir(dir, { recursive: true });
        wroteDir = true;
      }
      const ext =
        type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : ".jpg";
      const filename = `${order.id}-${lineIndex}-${i}${ext}`;
      await writeFile(
        path.join(dir, filename),
        Buffer.from(await file.arrayBuffer()),
      );
      const url = `/studio-orders/${filename}`;
      if (!primaryImage) primaryImage = url;
      mediaCreates.push({
        orderId: order.id,
        url,
        mime: type,
        sortOrder: i,
      });
    }

    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        slug: `studio-line-${lineIndex + 1}`,
        name: line.name,
        price: line.price,
        qty: line.qty,
        image: primaryImage,
        kind: "studio",
      },
    });

    if (mediaCreates.length) {
      await prisma.orderMedia.createMany({
        data: mediaCreates.map((m) => ({
          ...m,
          orderItemId: item.id,
        })),
      });
    }
  }

  revalidatePath("/admin/studio-orders");
  redirect(`/admin/studio-orders?created=${order.saleCode || order.reference}`);
}

export async function advanceStudioOrderAction(formData: FormData) {
  await requireAdmin();
  const studio = await import("@/lib/studio-orders");

  const id = String(formData.get("id") || "");
  const day = String(formData.get("day") || "");
  if (!id) redirect("/admin/studio-orders");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.source !== "studio") {
    redirect("/admin/studio-orders");
  }

  const current = order.status as (typeof studio.STUDIO_STATUSES)[number];
  const next = studio.STUDIO_NEXT[current];
  if (!next) {
    redirect(day ? `/admin/studio-orders?day=${day}` : "/admin/studio-orders");
  }

  if (next === "making" && !studio.canStartMaking(order.paymentStatus)) {
    redirect(
      day
        ? `/admin/studio-orders?day=${day}&needPayment=1`
        : "/admin/studio-orders?needPayment=1",
    );
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status: next, version: { increment: 1 } },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: current,
        toStatus: next,
        actor: "admin",
      },
    }),
  ]);

  revalidatePath("/admin/studio-orders");
  redirect(day ? `/admin/studio-orders?day=${day}` : "/admin/studio-orders");
}

export async function markStudioPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const day = String(formData.get("day") || "");
  const mode = String(formData.get("mode") || "paid");
  const amount = Math.max(0, Math.round(Number(formData.get("amount") || 0) || 0));

  if (!id) redirect("/admin/studio-orders");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.source !== "studio") {
    redirect("/admin/studio-orders");
  }

  const paymentStatus = mode === "deposit" ? "deposit" : "paid";
  const depositAmount =
    paymentStatus === "deposit"
      ? amount || order.depositAmount || Math.round(order.deliveryTotal / 2)
      : order.depositAmount;

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        depositAmount: paymentStatus === "deposit" ? depositAmount : order.depositAmount,
        version: { increment: 1 },
      },
    }),
    prisma.orderPayment.create({
      data: {
        orderId: id,
        kind: paymentStatus === "deposit" ? "deposit" : "full",
        method: "other",
        amount:
          paymentStatus === "deposit" ? depositAmount : order.deliveryTotal,
        seenAt: new Date(),
        note: "Marked by admin",
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: order.status,
        note: `payment:${paymentStatus}`,
        actor: "admin",
      },
    }),
  ]);

  revalidatePath("/admin/studio-orders");
  redirect(day ? `/admin/studio-orders?day=${day}` : "/admin/studio-orders");
}

export async function saveJournalPostAction(formData: FormData) {
  await requireAdmin();
  const { makeJournalSlug } = await import("@/lib/journal");

  const id = String(formData.get("id") || "");
  const titleEn = String(formData.get("titleEn") || "").trim();
  const titleVi = String(formData.get("titleVi") || "").trim();
  let slug =
    String(formData.get("slug") || "").trim() ||
    makeJournalSlug(titleEn || titleVi);
  const kind = String(formData.get("kind") || "tip");
  const cityScope = String(formData.get("cityScope") || "both");
  const excerptEn = String(formData.get("excerptEn") || "");
  const excerptVi = String(formData.get("excerptVi") || "");
  const bodyEn = String(formData.get("bodyEn") || "");
  const bodyVi = String(formData.get("bodyVi") || "");
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const published = formData.get("published") === "on";
  const existingCover = String(formData.get("existingCover") || "");

  if (!titleEn || !titleVi || !slug) {
    redirect(id ? `/admin/journal/${id}?error=1` : "/admin/journal/new?error=1");
  }

  let coverImage: string | null = existingCover || null;
  const file = formData.get("cover") as File | null;
  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    const filename = `journal-${slug}-${Date.now()}${safeExt}`;
    const dir = path.join(process.cwd(), "public", "journal", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    coverImage = `/journal/uploads/${filename}`;
  }

  const data = {
    slug,
    kind,
    cityScope,
    titleEn,
    titleVi,
    excerptEn,
    excerptVi,
    bodyEn,
    bodyVi,
    coverImage,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    published,
    publishedAt: published ? new Date() : null,
  };

  if (id) {
    const current = await prisma.journalPost.findUnique({ where: { id } });
    if (!current) redirect("/admin/journal");
    if (slug !== current.slug) {
      const clash = await prisma.journalPost.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    }
    await prisma.journalPost.update({
      where: { id },
      data: {
        ...data,
        slug,
        publishedAt:
          published && !current.publishedAt
            ? new Date()
            : published
              ? current.publishedAt
              : null,
      },
    });
  } else {
    const clash = await prisma.journalPost.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    await prisma.journalPost.create({
      data: { ...data, slug },
    });
  }

  revalidatePath("/en/journal");
  revalidatePath("/vi/journal");
  revalidatePath("/sitemap.xml");
  redirect("/admin/journal");
}

export async function deleteJournalPostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.journalPost.delete({ where: { id } });
  }
  revalidatePath("/en/journal");
  revalidatePath("/vi/journal");
  redirect("/admin/journal");
}
