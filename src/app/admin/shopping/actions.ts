"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { BRAND } from "@/lib/brand";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function saveGoogleMerchantSettingsAction(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("enabled") === "on";
  const defaultLocale =
    String(formData.get("defaultLocale") || "vi") === "en" ? "en" : "vi";
  const defaultCitySlug =
    String(formData.get("defaultCitySlug") || "danang").trim() || "danang";
  const brand = String(formData.get("brand") || BRAND.name).trim() || BRAND.name;
  const googleProductCategory =
    String(formData.get("googleProductCategory") || "").trim() ||
    "Arts & Entertainment > Party & Celebration > Gift Giving > Fresh Cut Flowers";
  const shippingRaw = String(formData.get("shippingFlatVnd") || "").trim();
  const shippingFlatVnd =
    shippingRaw === ""
      ? null
      : Number.isFinite(Number(shippingRaw))
        ? Math.max(0, Math.round(Number(shippingRaw)))
        : null;

  await prisma.googleMerchantSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled,
      defaultLocale,
      defaultCitySlug,
      brand,
      googleProductCategory,
      shippingFlatVnd,
    },
    update: {
      enabled,
      defaultLocale,
      defaultCitySlug,
      brand,
      googleProductCategory,
      shippingFlatVnd,
    },
  });

  revalidatePath("/admin/shopping");
  revalidatePath("/feeds/google-merchant.xml");
  revalidatePath("/feeds/google-merchant.txt");
  redirect("/admin/shopping?saved=settings");
}

export async function setProductGoogleShoppingAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  const include = String(formData.get("include") || "") === "1";
  if (!id) redirect("/admin/shopping?error=1");

  await prisma.product.update({
    where: { id },
    data: { googleShopping: include },
  });

  revalidatePath("/admin/shopping");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/feeds/google-merchant.xml");
  revalidatePath("/feeds/google-merchant.txt");
  redirect("/admin/shopping?saved=product");
}

export async function enableAllPublishedGoogleShoppingAction() {
  await requireAdmin();
  await prisma.product.updateMany({
    where: { published: true },
    data: { googleShopping: true },
  });
  revalidatePath("/admin/shopping");
  revalidatePath("/feeds/google-merchant.xml");
  revalidatePath("/feeds/google-merchant.txt");
  redirect("/admin/shopping?saved=enable-all");
}
