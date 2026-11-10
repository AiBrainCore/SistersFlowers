import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const locale = url.searchParams.get("locale") === "en" ? "en" : "vi";
  const next = url.searchParams.get("next") || `/${locale}/account`;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const email = data.user.email?.toLowerCase() || null;
      await prisma.customer.upsert({
        where: { authUserId: data.user.id },
        create: {
          authUserId: data.user.id,
          email,
          name:
            (data.user.user_metadata?.full_name as string | undefined) ||
            (data.user.user_metadata?.name as string | undefined) ||
            null,
          preferredLocale: locale,
          provider:
            data.user.app_metadata?.provider === "google" ? "google" : "email",
          emailVerifiedAt: data.user.email_confirmed_at
            ? new Date(data.user.email_confirmed_at)
            : null,
        },
        update: {
          email: email || undefined,
          preferredLocale: locale,
        },
      });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
