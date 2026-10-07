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
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  const price = Number(formData.get("price") || 0);
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
    await prisma.product.create({
      data: {
        slug,
        price,
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
  }

  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/vi");
  revalidatePath("/en/shop");
  revalidatePath("/vi/shop");
  redirect("/admin/products");
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
