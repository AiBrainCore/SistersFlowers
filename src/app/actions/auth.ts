"use server";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/db";
import {
  clearCustomerSessionCookie,
  setCustomerSessionCookie,
} from "@/lib/customer-session";
import { sendMail } from "@/lib/mail/send";
import { buildVerifyEmail } from "@/lib/mail/templates";
import { siteUrl } from "@/lib/seo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type AuthResult = { ok: true } | { ok: false; error: string };

function localeOrVi(raw: string): Locale {
  return raw === "en" ? "en" : "vi";
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

  const redirectTo = siteUrl(`/auth/callback?locale=${locale}`);
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
  const actionLink = data.properties?.action_link;
  if (!user || !actionLink) {
    return { ok: false, error: "signup_link_failed" };
  }

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

  const verify = buildVerifyEmail(locale, actionLink, email);
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
      redirectTo: siteUrl(`/auth/callback?locale=${locale}`),
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
