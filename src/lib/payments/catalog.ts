import { prisma } from "@/lib/db";
import {
  PAYMENT_METHODS,
  type PaymentMethodDef,
  type PaymentMethodId,
} from "@/lib/payments/methods";
import { accountIsLive, resolvePaymentAccount } from "@/lib/payments/accounts";
import { payosConfigured } from "@/lib/payments/payos";

export type PaymentMethodView = PaymentMethodDef & {
  enabled: boolean;
  comingSoon: boolean;
  selectable: boolean;
  reason?: string;
};

async function settingsMap() {
  const rows = await prisma.paymentMethodSetting.findMany();
  return new Map(rows.map((r) => [r.methodId, r]));
}

/** Ensure DB rows exist for catalog methods (idempotent). */
export async function ensurePaymentMethodSettings() {
  for (const m of PAYMENT_METHODS) {
    await prisma.paymentMethodSetting.upsert({
      where: { methodId: m.id },
      create: {
        methodId: m.id,
        enabled: m.defaultEnabled,
        comingSoon: m.defaultComingSoon,
        sortOrder: m.sortOrder,
      },
      update:
        m.id === "whatsapp"
          ? {
              // Keep WhatsApp off as a checkout “payment” — chat is Zalo/WhatsApp in contact UI.
              enabled: false,
              comingSoon: false,
              sortOrder: m.sortOrder,
            }
          : m.provider === "stub"
            ? {
                // Wallets/cards stay Soon until a real adapter exists (admin cannot “enable” a stub).
                enabled: false,
                comingSoon: true,
                sortOrder: m.sortOrder,
              }
            : { sortOrder: m.sortOrder },
    });
  }
}

/** One-shot: turn on VietQR + cash; keep unfinished methods Soon. Safe to re-run. */
export async function applyStorefrontPaymentDefaults() {
  await ensurePaymentMethodSettings();
  const live = ["vietqr", "cod", "cash_pickup"] as const;
  for (const methodId of live) {
    await prisma.paymentMethodSetting.update({
      where: { methodId },
      data: { enabled: true, comingSoon: false },
    });
  }
  for (const m of PAYMENT_METHODS) {
    if (m.provider === "stub" || m.id === "payos" || m.id === "whatsapp") {
      await prisma.paymentMethodSetting.update({
        where: { methodId: m.id },
        data: {
          enabled: false,
          comingSoon: m.id !== "whatsapp",
        },
      });
    }
  }
}

export async function listPaymentMethodsForDisplay(input?: {
  citySlug?: string | null;
}): Promise<PaymentMethodView[]> {
  await ensurePaymentMethodSettings();
  const settings = await settingsMap();
  const account = await resolvePaymentAccount({ citySlug: input?.citySlug });
  const vietqrReady = account ? accountIsLive(account) : false;
  const payosReady = payosConfigured();

  return PAYMENT_METHODS.map((m) => {
    const s = settings.get(m.id);
    const enabled = s?.enabled ?? m.defaultEnabled;
    const comingSoon = s?.comingSoon ?? m.defaultComingSoon;
    let selectable = enabled && !comingSoon;
    let reason: string | undefined;

    if (m.id === "vietqr") {
      if (!vietqrReady) {
        selectable = false;
        reason = "account_not_verified";
      }
    }
    if (m.id === "payos") {
      if (!payosReady) {
        selectable = false;
        reason = "provider_not_configured";
      }
    }
    if (m.provider === "stub") {
      selectable = false;
    }
    // Never offer WhatsApp as a payment method at checkout.
    if (m.id === "whatsapp") {
      selectable = false;
      reason = "chat_not_payment";
    }

    return {
      ...m,
      enabled,
      comingSoon: comingSoon || m.provider === "stub",
      selectable,
      reason,
      sortOrder: s?.sortOrder ?? m.sortOrder,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function isMethodSelectable(
  methodId: PaymentMethodId | string,
  citySlug?: string | null,
) {
  const list = await listPaymentMethodsForDisplay({ citySlug });
  return Boolean(list.find((m) => m.id === methodId)?.selectable);
}
