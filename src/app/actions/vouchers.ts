"use server";

import { redeemVoucher, lookupVoucher, type RedeemResult } from "@/lib/vouchers";
import { revalidatePath } from "next/cache";

export type CheckVoucherResult =
  | { ok: true; voucher: Awaited<ReturnType<typeof lookupVoucher>> }
  | { ok: false; error: "empty" | "not_found" };

export async function checkVoucherAction(
  code: string,
): Promise<CheckVoucherResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  const voucher = await lookupVoucher(trimmed);
  if (!voucher) return { ok: false, error: "not_found" };
  return { ok: true, voucher };
}

export async function redeemVoucherAction(code: string): Promise<RedeemResult> {
  const result = await redeemVoucher(code);
  if (result.ok) {
    revalidatePath("/admin/vouchers");
    revalidatePath("/admin/orders");
  }
  return result;
}
