import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  accountIsLive,
  resolvePaymentAccount,
  snapshotAccount,
} from "@/lib/payments/accounts";
import { isMethodSelectable } from "@/lib/payments/catalog";
import {
  buildVietQrImageUrl,
  vietQrTransferContent,
} from "@/lib/payments/vietqr";
import { createPayosPaymentLink } from "@/lib/payments/payos";

export function makeTrackingToken() {
  return randomBytes(24).toString("base64url");
}

export async function createPaymentIntentForOrder(input: {
  orderId: string;
  orderReference: string;
  amount: number;
  method: string;
  citySlug?: string | null;
  branchId?: string | null;
  locale?: string;
  siteUrl?: string;
}) {
  const amount = Math.max(0, Math.round(input.amount));
  const method = input.method || "whatsapp";

  if (method === "whatsapp") {
    return null;
  }

  const selectable = await isMethodSelectable(method, input.citySlug);
  if (!selectable) {
    throw new Error("payment_method_unavailable");
  }

  const idempotencyKey = `order:${input.orderId}:method:${method}:amt:${amount}:v1`;
  const existing = await prisma.paymentIntent.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return existing;

  // Cancel older pending intents for this order+method when amount changes (quote flow).
  await prisma.paymentIntent.updateMany({
    where: {
      orderId: input.orderId,
      method,
      status: "pending",
    },
    data: { status: "cancelled" },
  });

  if (method === "vietqr") {
    const account = await resolvePaymentAccount({
      citySlug: input.citySlug,
      branchId: input.branchId,
    });
    if (!account || !accountIsLive(account)) {
      throw new Error("vietqr_account_unavailable");
    }
    const reference = vietQrTransferContent(input.orderReference);
    const qrImageUrl = buildVietQrImageUrl({
      account: {
        bankCode: account.bankCode,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
      },
      amount,
      addInfo: reference,
    });
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    return prisma.paymentIntent.create({
      data: {
        orderId: input.orderId,
        provider: "vietqr",
        method: "vietqr",
        amount,
        status: "pending",
        reference,
        idempotencyKey,
        accountId: account.id,
        accountSnapshot: snapshotAccount(account),
        qrImageUrl,
        expiresAt,
      },
    });
  }

  if (method === "payos") {
    const orderCode = Number.parseInt(
      Date.now().toString().slice(-9),
      10,
    );
    const site = (input.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(
      /\/$/,
      "",
    );
    const payos = await createPayosPaymentLink({
      orderCode,
      amount,
      description: input.orderReference.slice(0, 25),
      returnUrl: `${site}/order/pay/return`,
      cancelUrl: `${site}/checkout`,
    });
    if (!payos.ok) {
      throw new Error(payos.error);
    }
    return prisma.paymentIntent.create({
      data: {
        orderId: input.orderId,
        provider: "payos",
        method: "payos",
        amount,
        status: "pending",
        reference: String(payos.orderCode),
        idempotencyKey,
        providerPaymentId: payos.paymentLinkId,
        checkoutUrl: payos.checkoutUrl,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
      },
    });
  }

  // cash / cod — intent not required; staff marks payment later
  return null;
}

export async function markIntentPaid(input: {
  intentId: string;
  actor?: string;
  note?: string;
}) {
  const { markIntentPaidAndAdvance } = await import(
    "@/lib/payments/confirm-flow"
  );
  const result = await markIntentPaidAndAdvance(input);
  return result.intent;
}
