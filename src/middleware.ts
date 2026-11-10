import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/i18n/config";
import { homeMarkdown } from "@/lib/home-markdown";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
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
    const response = NextResponse.next();
    const current = request.cookies.get(LOCALE_COOKIE)?.value;
    if (current !== pathLocale) {
      response.cookies.set(LOCALE_COOKIE, pathLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
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
