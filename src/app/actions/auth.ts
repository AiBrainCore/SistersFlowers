"use server";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/db";
import {
  clearCustomerSessionCookie,
  setCustomerSessionCookie,
} from "@/lib/customer-session";
import { sendMail } from "@/lib/mail/send";
import { buildWelcomeEmail } from "@/lib/mail/templates";
import { siteUrl } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type AuthResult = { ok: true } | { ok: false; error: string };

function localeOrVi(raw: string): Locale {
  return raw === "en" ? "en" : "vi";
}

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

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "auth_not_configured" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, locale },
      emailRedirectTo: siteUrl(`/auth/callback?locale=${locale}`),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.user) {
    await prisma.customer.upsert({
      where: { authUserId: data.user.id },
      create: {
        authUserId: data.user.id,
        email,
        name: name || null,
        preferredLocale: locale,
        provider: "email",
      },
      update: {
        email,
        name: name || undefined,
        preferredLocale: locale,
      },
    });

    // Branded welcome (Supabase also sends its own verify email when enabled).
    const welcome = buildWelcomeEmail(locale, name || undefined, email);
    await sendMail({
      to: email,
      from: "info",
      subject: welcome.subject,
      html: welcome.html,
      transactional: false,
    });
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
