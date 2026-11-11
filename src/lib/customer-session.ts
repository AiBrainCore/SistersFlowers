import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE = "sf_customer";

function secret() {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    "dev-customer-secret-change-me"
  );
}

function sign(customerId: string) {
  const ts = Date.now().toString(36);
  const body = `${customerId}.${ts}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, ts, sig] = parts;
  const body = `${customerId}.${ts}`;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const ageMs = Date.now() - parseInt(ts, 36);
  if (!Number.isFinite(ageMs) || ageMs > 1000 * 60 * 60 * 24 * 30) return null;
  return customerId;
}

export async function setCustomerSessionCookie(customerId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(customerId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentCustomer() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const byAuth = await prisma.customer.findUnique({
        where: { authUserId: data.user.id },
      });
      if (byAuth) return byAuth;
      const email = data.user.email?.toLowerCase() || null;
      return prisma.customer.upsert({
        where: { authUserId: data.user.id },
        create: {
          authUserId: data.user.id,
          email,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ||
            (data.user.user_metadata?.name as string | undefined) ||
            null,
          preferredLocale:
            (data.user.user_metadata?.locale as string | undefined) || "vi",
          provider:
            data.user.app_metadata?.provider === "google" ? "google" : "email",
          emailVerifiedAt: data.user.email_confirmed_at
            ? new Date(data.user.email_confirmed_at)
            : null,
        },
        update: {
          email: email || undefined,
        },
      });
    }
  }

  const jar = await cookies();
  const customerId = verify(jar.get(COOKIE)?.value);
  if (!customerId) return null;
  return prisma.customer.findUnique({ where: { id: customerId } });
}
