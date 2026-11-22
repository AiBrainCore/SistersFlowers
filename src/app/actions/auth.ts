"use server";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/db";
import {
  clearCustomerSessionCookie,
  setCustomerSessionCookie,
} from "@/lib/customer-session";
import { mailPublicSiteUrl } from "@/lib/mail/config";
import { sendMail } from "@/lib/mail/send";
import { buildVerifyEmail } from "@/lib/mail/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type AuthResult = { ok: true } | { ok: false; error: string };

function localeOrVi(raw: string): Locale {
  return raw === "en" ? "en" : "vi";
}

/**
 * Customer-facing auth links must never be localhost — even if NEXT_PUBLIC_SITE_URL
 * is still set to http://localhost:3000 on a misconfigured VPS or local NODE_ENV.
 * mailPublicSiteUrl always falls back to https://sistersflowers.vn.
 */
function authPublicUrl(path: string) {
  const url = mailPublicSiteUrl(path);
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error("auth_public_url_localhost");
  }
  return url;
}

/**
 * Register with email/password.
 * Uses Auth admin generateLink (no Supabase default mail) + branded SF verify email.
 * Welcome mail is sent only after the customer confirms (auth/callback).
 */
export async function registerWithEmailAction(formData: FormData): Promise<AuthResult> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "auth_not_configured" };
  }
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const locale = localeOrVi(String(formData.get("locale") || "vi"));

  if (!email || password.length < 8) {
    return { ok: false, error: "invalid_input" };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "auth_not_configured" };
  }

  const redirectTo = authPublicUrl(`/auth/callback?locale=${locale}`);
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: { full_name: name, locale },
      redirectTo,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const user = data.user;
  const hashedToken = data.properties?.hashed_token;
  if (!user || !hashedToken) {
    return { ok: false, error: "signup_link_failed" };
  }

  // Stay on sistersflowers.vn — never send guests through supabase.co/auth/v1/verify
  // (browsers show a scary “redirect notice” for that intermediate hop).
  // Never use siteUrl() here: it may still resolve to localhost in local NODE_ENV
  // or when ALLOW_LOCALHOST_SITE_URL=1 leaks onto the VPS.
  const verifyUrl = authPublicUrl(
    `/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=signup&locale=${locale}`,
  );

  await prisma.customer.upsert({
    where: { authUserId: user.id },
    create: {
      authUserId: user.id,
      email,
      name: name || null,
      preferredLocale: locale,
      provider: "email",
      emailVerifiedAt: null,
    },
    update: {
      email,
      name: name || undefined,
      preferredLocale: locale,
      provider: "email",
    },
  });

  const verify = buildVerifyEmail(locale, verifyUrl, email);
  const sent = await sendMail({
    to: email,
    from: "info",
    subject: verify.subject,
    html: verify.html,
    transactional: true,
    eventKey: `auth:${user.id}:verify`,
    relatedType: "customer",
    relatedId: user.id,
  });

  if (!sent.ok || ("skipped" in sent && sent.skipped)) {
    // Roll back so the guest can retry register (no orphan Auth user).
    await admin.auth.admin.deleteUser(user.id).catch((err) => {
      console.error("[auth] rollback deleteUser", err);
    });
    await prisma.customer
      .deleteMany({ where: { authUserId: user.id } })
      .catch(() => undefined);
    console.error("[auth] verify email not sent", sent);
    return { ok: false, error: "verify_email_failed" };
  }

  return { ok: true };
}

export async function loginWithEmailAction(formData: FormData): Promise<AuthResult> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "auth_not_configured" };
  }
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { ok: false, error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "auth_not_configured" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logoutAction(locale: Locale = "vi") {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  await clearCustomerSessionCookie();
  redirect(`/${locale}/account/login`);
}

export async function startGoogleOAuthAction(
  locale: Locale = "vi",
): Promise<AuthResult | { ok: true; url: string }> {
  if (!supabaseConfigured()) {
    return { ok: false, error: "auth_not_configured" };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "auth_not_configured" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authPublicUrl(`/auth/callback?locale=${locale}`),
    },
  });
  if (error || !data.url) {
    return { ok: false, error: error?.message || "oauth_failed" };
  }
  return { ok: true, url: data.url };
}

/** Used by Zalo callback after profile fetch. */
export async function upsertZaloCustomer(input: {
  zaloId: string;
  name?: string | null;
  preferredLocale?: Locale;
}) {
  const customer = await prisma.customer.upsert({
    where: { zaloId: input.zaloId },
    create: {
      zaloId: input.zaloId,
      name: input.name || null,
      preferredLocale: input.preferredLocale || "vi",
      provider: "zalo",
    },
    update: {
      name: input.name || undefined,
      preferredLocale: input.preferredLocale || undefined,
    },
  });
  await setCustomerSessionCookie(customer.id);
  return customer;
}
