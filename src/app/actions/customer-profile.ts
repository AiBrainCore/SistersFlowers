"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer-session";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/customer-identity";

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: "not_signed_in" | "invalid" | "save_failed" };

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  if (!email.includes("@")) return null;
  return email;
}

export async function updateCustomerProfileAction(
  formData: FormData,
): Promise<ProfileResult> {
  const customer = await getCurrentCustomer().catch(() => null);
  if (!customer) return { ok: false, error: "not_signed_in" };

  const name = String(formData.get("name") || "").trim() || null;
  const phoneRaw = String(formData.get("phone") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim() || null;

  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const email = emailRaw ? normalizeEmail(emailRaw) : null;

  if (phoneRaw && !phone) return { ok: false, error: "invalid" };
  if (emailRaw && !email) return { ok: false, error: "invalid" };

  try {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name,
        phone,
        // Keep existing email if the field was cleared; never wipe auth contact blank.
        email: email ?? customer.email,
        address,
      },
    });
  } catch {
    return { ok: false, error: "save_failed" };
  }

  revalidatePath("/en/account");
  revalidatePath("/vi/account");
  revalidatePath("/en/checkout");
  revalidatePath("/vi/checkout");
  return { ok: true };
}
