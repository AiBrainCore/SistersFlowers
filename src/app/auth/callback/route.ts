import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail/send";
import { buildWelcomeEmail } from "@/lib/mail/templates";
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
      const name =
        (data.user.user_metadata?.full_name as string | undefined) ||
        (data.user.user_metadata?.name as string | undefined) ||
        null;
      const preferredLocale =
        data.user.user_metadata?.locale === "en" ? "en" : locale;
      const provider =
        data.user.app_metadata?.provider === "google" ? "google" : "email";
      const nowVerified = data.user.email_confirmed_at
        ? new Date(data.user.email_confirmed_at)
        : null;

      const existing = await prisma.customer.findUnique({
        where: { authUserId: data.user.id },
        select: { id: true, emailVerifiedAt: true, name: true },
      });

      await prisma.customer.upsert({
        where: { authUserId: data.user.id },
        create: {
          authUserId: data.user.id,
          email,
          name,
          preferredLocale,
          provider,
          emailVerifiedAt: nowVerified,
        },
        update: {
          email: email || undefined,
          preferredLocale,
          emailVerifiedAt: nowVerified || undefined,
          name: name || undefined,
        },
      });

      // Welcome only once: first time email becomes verified (confirm link or Google).
      const shouldWelcome =
        Boolean(email) &&
        Boolean(nowVerified) &&
        !existing?.emailVerifiedAt;

      if (shouldWelcome && email) {
        const welcome = buildWelcomeEmail(
          preferredLocale,
          name || existing?.name || undefined,
          email,
        );
        await sendMail({
          to: email,
          from: "info",
          subject: welcome.subject,
          html: welcome.html,
          transactional: false,
          eventKey: `auth:${data.user.id}:welcome`,
          relatedType: "customer",
          relatedId: data.user.id,
        }).catch((err) => {
          console.error("[auth/callback] welcome mail", err);
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
