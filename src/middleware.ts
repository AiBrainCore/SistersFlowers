import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/i18n/config";
import { homeMarkdown } from "@/lib/home-markdown";

import {
  CITY_COOKIE,
  CITY_HEADER,
  isCityQuerySlug,
} from "@/lib/city-slugs";

function prefersMarkdown(accept: string | null) {
  if (!accept) return false;
  const parts = accept.split(",").map((part) => part.trim().toLowerCase());
  const md = parts.find((part) => part.startsWith("text/markdown"));
  if (!md) return false;
  const html = parts.find((part) => part.startsWith("text/html"));
  if (!html) return true;
  const mdQ = Number(/q=([0-9.]+)/.exec(md)?.[1] ?? "1");
  const htmlQ = Number(/q=([0-9.]+)/.exec(html)?.[1] ?? "1");
  return mdQ >= htmlQ;
}

function preferredLocale(request: NextRequest): Locale {
  const raw = request.cookies.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}

function withLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

/** Auth cookie refresh — only where session actually matters. */
function needsAuthRefresh(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    /\/(account|checkout)(\/|$)/.test(pathname)
  );
}

async function withSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  // Refresh auth cookies on each matched request.
  await supabase.auth.getUser();
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never run auth refresh on compiled assets — a Supabase failure must not 500 CSS/JS.
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth")
  ) {
    return withSupabaseSession(request, NextResponse.next());
  }

  const localeMatch = locales.find(
    (locale) => pathname === `/${locale}` || pathname === `/${locale}/`,
  );
  if (localeMatch && prefersMarkdown(request.headers.get("accept"))) {
    return withLocaleCookie(
      new NextResponse(homeMarkdown(localeMatch), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      }),
      localeMatch,
    );
  }

  const pathLocale = locales.find(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathLocale) {
    // Keep preference in sync when browsing a locale URL directly.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    // Footer / SEO city links: /shop?city=danang switches the active studio.
    const cityQuery = request.nextUrl.searchParams
      .get("city")
      ?.trim()
      .toLowerCase();
    if (isCityQuerySlug(cityQuery)) {
      requestHeaders.set(CITY_HEADER, cityQuery);
      request.cookies.set(CITY_COOKIE, cityQuery);
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    const current = request.cookies.get(LOCALE_COOKIE)?.value;
    if (current !== pathLocale) {
      response.cookies.set(LOCALE_COOKIE, pathLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    if (isCityQuerySlug(cityQuery)) {
      response.cookies.set(CITY_COOKIE, cityQuery, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    // Public catalog/marketing pages skip Supabase getUser (saves TTFB).
    if (needsAuthRefresh(pathname)) {
      return withSupabaseSession(request, response);
    }
    return response;
  }

  const locale = preferredLocale(request);

  if (pathname === "/" && prefersMarkdown(request.headers.get("accept"))) {
    return withLocaleCookie(
      new NextResponse(homeMarkdown(locale), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      }),
      locale,
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return withLocaleCookie(NextResponse.redirect(url), locale);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
