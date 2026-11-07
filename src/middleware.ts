import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";
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
    return new NextResponse(homeMarkdown(localeMatch), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  if (pathname === "/" && prefersMarkdown(request.headers.get("accept"))) {
    return new NextResponse(homeMarkdown(defaultLocale), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
