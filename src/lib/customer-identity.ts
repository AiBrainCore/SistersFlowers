import { prisma } from "@/lib/db";

/**
 * Buyer identity for analytics (registered + guest).
 * Guests are Customer rows with provider "guest" — not Supabase Auth users.
 */

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits || digits === "0") return null;
  // Vietnam local 0xxxxxxxxx → 84xxxxxxxxx
  if (digits.startsWith("0") && digits.length >= 9) {
    digits = `84${digits.slice(1)}`;
  }
  if (digits.length < 8) return null;
  return digits;
}

function normalizeEmail(raw: string | null | undefined): string | null {
  const email = (raw || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

const AUTH_PROVIDERS = new Set(["email", "google", "zalo"]);

function normalizeAddress(raw: string | null | undefined): string | null {
  const address = (raw || "").trim();
  if (!address || address === "—") return null;
  return address;
}

export async function upsertBuyerCustomer(input: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  preferredLocale?: string;
  /** Prefer logged-in account when present. */
  knownCustomerId?: string | null;
}): Promise<string | null> {
  const name = (input.name || "").trim() || null;
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const address = normalizeAddress(input.address);
  const locale =
    input.preferredLocale === "en" || input.preferredLocale === "vi"
      ? input.preferredLocale
      : "vi";

  if (!phone && !email && !input.knownCustomerId) return null;

  if (input.knownCustomerId) {
    const existing = await prisma.customer.findUnique({
      where: { id: input.knownCustomerId },
    });
    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: name || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          preferredLocale: locale,
        },
      });
      return existing.id;
    }
  }

  let match =
    (phone
      ? await prisma.customer.findFirst({
          where: { phone },
          orderBy: { createdAt: "asc" },
        })
      : null) ||
    (email
      ? await prisma.customer.findFirst({
          where: { email },
          orderBy: { createdAt: "asc" },
        })
      : null);

  // Also match legacy rows that stored local 0… format
  if (!match && phone?.startsWith("84")) {
    const local = `0${phone.slice(2)}`;
    match = await prisma.customer.findFirst({
      where: { phone: local },
      orderBy: { createdAt: "asc" },
    });
  }

  if (match) {
    const keepProvider = AUTH_PROVIDERS.has(match.provider);
    await prisma.customer.update({
      where: { id: match.id },
      data: {
        name: name || undefined,
        phone: phone || match.phone || undefined,
        email: email || match.email || undefined,
        address: address || undefined,
        preferredLocale: locale,
        // Never downgrade a real account to guest
        provider: keepProvider ? undefined : match.provider || "guest",
      },
    });
    return match.id;
  }

  const created = await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      address,
      preferredLocale: locale,
      provider: "guest",
    },
  });
  return created.id;
}

/** Attach Customer rows to past orders that only stored name/phone on the order. */
export async function backfillGuestCustomersFromOrders(limit = 200) {
  const orders = await prisma.order.findMany({
    where: { customerId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      customerName: true,
      phone: true,
      email: true,
      address: true,
      locale: true,
    },
  });

  let linked = 0;
  for (const order of orders) {
    const customerId = await upsertBuyerCustomer({
      name: order.customerName,
      phone: order.phone === "—" ? null : order.phone,
      email: order.email,
      address: order.address,
      preferredLocale: order.locale,
    });
    if (!customerId) continue;
    await prisma.order.update({
      where: { id: order.id },
      data: { customerId },
    });
    linked += 1;
  }
  return { scanned: orders.length, linked };
}
