import { prisma } from "@/lib/db";
import { commissionAmount } from "@/lib/addons";

export type VoucherStatus = "issued" | "redeemed" | "expired";

export type VoucherPublic = {
  code: string;
  name: string;
  partnerName: string;
  faceValue: number;
  status: VoucherStatus;
  expiresAt: Date | null;
  redeemedAt: Date | null;
  remitAmount: number | null;
  orderReference: string;
};

function randomChunk(len: number) {
  return Math.floor(Math.random() * 36 ** len)
    .toString(36)
    .toUpperCase()
    .padStart(len, "0");
}

/** Unique face-value voucher code, e.g. SF-V-K7M2P9 */
export async function makeVoucherCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = `SF-V-${randomChunk(3)}${randomChunk(3)}`;
    const existing = await prisma.orderItem.findUnique({
      where: { voucherCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `SF-V-${Date.now().toString(36).toUpperCase()}`;
}

export function remitToPartner(faceValue: number, commissionPercent: number) {
  const commission = commissionAmount(faceValue, commissionPercent);
  return Math.max(0, faceValue - commission);
}

export function resolveVoucherStatus(
  status: string | null | undefined,
  expiresAt: Date | null | undefined,
  now = new Date(),
): VoucherStatus {
  if (status === "redeemed") return "redeemed";
  if (expiresAt && expiresAt.getTime() < now.getTime()) return "expired";
  return "issued";
}

export async function lookupVoucher(rawCode: string): Promise<VoucherPublic | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const item = await prisma.orderItem.findUnique({
    where: { voucherCode: code },
    include: { order: { select: { reference: true } } },
  });
  if (!item || !item.voucherCode) return null;

  const status = resolveVoucherStatus(item.voucherStatus, item.voucherExpiresAt);
  if (status === "expired" && item.voucherStatus !== "expired") {
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { voucherStatus: "expired" },
    });
  }

  return {
    code: item.voucherCode,
    name: item.name,
    partnerName: item.partnerName || "",
    faceValue: item.price,
    status,
    expiresAt: item.voucherExpiresAt,
    redeemedAt: item.redeemedAt,
    remitAmount: item.remitAmount,
    orderReference: item.order.reference,
  };
}

export type RedeemResult =
  | { ok: true; voucher: VoucherPublic }
  | { ok: false; error: "not_found" | "already_redeemed" | "expired" };

export async function redeemVoucher(rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  const item = await prisma.orderItem.findUnique({
    where: { voucherCode: code },
    include: { order: { select: { reference: true } } },
  });
  if (!item || !item.voucherCode) {
    return { ok: false, error: "not_found" };
  }

  const status = resolveVoucherStatus(item.voucherStatus, item.voucherExpiresAt);
  if (status === "redeemed") return { ok: false, error: "already_redeemed" };
  if (status === "expired") {
    if (item.voucherStatus !== "expired") {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { voucherStatus: "expired" },
      });
    }
    return { ok: false, error: "expired" };
  }

  const percent = item.commissionPercent ?? 0;
  const remit = remitToPartner(item.price, percent);
  const commission =
    percent > 0 ? commissionAmount(item.price, percent) : item.commissionAmount;

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      voucherStatus: "redeemed",
      redeemedAt: new Date(),
      remitAmount: remit,
      commissionAmount: commission,
    },
    include: { order: { select: { reference: true } } },
  });

  return {
    ok: true,
    voucher: {
      code: updated.voucherCode!,
      name: updated.name,
      partnerName: updated.partnerName || "",
      faceValue: updated.price,
      status: "redeemed",
      expiresAt: updated.voucherExpiresAt,
      redeemedAt: updated.redeemedAt,
      remitAmount: updated.remitAmount,
      orderReference: updated.order.reference,
    },
  };
}

export async function listVouchers() {
  const rows = await prisma.orderItem.findMany({
    where: { voucherCode: { not: null } },
    include: {
      order: {
        select: {
          reference: true,
          customerName: true,
          phone: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  return rows.map((item) => ({
    id: item.id,
    code: item.voucherCode!,
    name: item.name,
    partnerName: item.partnerName || "",
    faceValue: item.price,
    status: resolveVoucherStatus(item.voucherStatus, item.voucherExpiresAt),
    expiresAt: item.voucherExpiresAt,
    redeemedAt: item.redeemedAt,
    remitAmount: item.remitAmount,
    commissionPercent: item.commissionPercent,
    commissionAmount: item.commissionAmount,
    orderReference: item.order.reference,
    customerName: item.order.customerName,
    phone: item.order.phone,
    createdAt: item.order.createdAt,
  }));
}
