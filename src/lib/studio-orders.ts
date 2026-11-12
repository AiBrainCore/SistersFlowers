import { prisma } from "@/lib/db";

export const STUDIO_STATUSES = [
  "new",
  "making",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type StudioStatus = (typeof STUDIO_STATUSES)[number];

export const STUDIO_NEXT: Partial<Record<StudioStatus, StudioStatus>> = {
  new: "making",
  making: "ready",
  ready: "delivered",
};

export type PaymentStatus = "unpaid" | "deposit" | "paid" | "cod";

export function canStartMaking(paymentStatus: string) {
  return (
    paymentStatus === "deposit" ||
    paymentStatus === "paid" ||
    paymentStatus === "cod"
  );
}

export function remainAmount(input: {
  deliveryTotal: number;
  paymentStatus: string;
  depositAmount: number;
}) {
  if (input.paymentStatus === "paid") return 0;
  if (input.paymentStatus === "deposit") {
    return Math.max(0, input.deliveryTotal - Math.max(0, input.depositAmount));
  }
  return input.deliveryTotal;
}

function salePrefix(branchSlug: string) {
  if (branchSlug.includes("danang")) return "DN";
  if (branchSlug.includes("dalat")) return "DL";
  return "SF";
}

function yymmdd(d = new Date()) {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** DN-260412-017 style sale codes, unique per day+branch prefix. */
export async function allocateSaleCode(branchSlug: string) {
  const prefix = `${salePrefix(branchSlug)}-${yymmdd()}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const count = await prisma.order.count({
      where: {
        saleCode: { startsWith: `${prefix}-` },
      },
    });
    const seq = String(count + 1 + attempt).padStart(3, "0");
    const saleCode = `${prefix}-${seq}`;
    const clash = await prisma.order.findUnique({ where: { saleCode } });
    if (!clash) return saleCode;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

export function parseStudioLines(raw: string) {
  const lines: { name: string; qty: number; price: number }[] = [];
  for (const row of raw.split("\n")) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    // name | qty | price   OR   name;qty;price
    const parts = trimmed.split(/[|;]/).map((p) => p.trim());
    if (parts.length < 3) continue;
    const name = parts[0];
    const qty = Math.max(1, Number(parts[1]) || 1);
    const price = Math.max(0, Math.round(Number(parts[2]) || 0));
    if (!name || !price) continue;
    lines.push({ name, qty, price });
  }
  return lines;
}
