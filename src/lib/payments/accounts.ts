import { prisma } from "@/lib/db";

export async function resolvePaymentAccount(input?: {
  citySlug?: string | null;
  branchId?: string | null;
}) {
  const citySlug = input?.citySlug || null;
  const branchId = input?.branchId || null;

  const accounts = await prisma.paymentAccount.findMany({
    where: { active: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (!accounts.length) return null;

  const byBranch = branchId
    ? accounts.find((a) => a.branchId === branchId)
    : null;
  if (byBranch) return byBranch;

  const byCity = citySlug
    ? accounts.find((a) => a.citySlug === citySlug)
    : null;
  if (byCity) return byCity;

  const globalDefault =
    accounts.find((a) => a.isDefault && !a.citySlug && !a.branchId) ||
    accounts.find((a) => a.isDefault) ||
    accounts.find((a) => !a.citySlug && !a.branchId) ||
    accounts[0];

  return globalDefault || null;
}

export function accountIsLive(account: {
  active: boolean;
  verifiedAt: Date | null;
}) {
  return Boolean(account.active && account.verifiedAt);
}

export function snapshotAccount(account: {
  id: string;
  label: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  holderType: string;
  citySlug: string | null;
}) {
  return JSON.stringify({
    id: account.id,
    label: account.label,
    bankCode: account.bankCode,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    holderType: account.holderType,
    citySlug: account.citySlug,
  });
}
