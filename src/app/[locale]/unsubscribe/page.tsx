import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { BRAND } from "@/lib/brand";
import {
  suppressEmail,
  unsubscribeCopy,
  verifyUnsubscribeToken,
} from "@/lib/mail/unsubscribe";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/unsubscribe">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = unsubscribeCopy[locale as Locale];
  return buildPageMetadata({
    locale: locale as Locale,
    title: copy.pageTitle,
    description: copy.pageBody,
    pathWithoutLocale: "/unsubscribe",
  });
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: PageProps<"/[locale]/unsubscribe">) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const copy = unsubscribeCopy[locale];
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;
  const email = verifyUnsubscribeToken(token);

  let state: "done" | "invalid" | "ready" = "ready";
  if (!email) {
    state = "invalid";
  } else {
    try {
      await suppressEmail(email, "unsubscribe_link");
      state = "done";
    } catch {
      state = "invalid";
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-5 sm:py-20">
      <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
        {BRAND.name}
      </p>
      <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
        {copy.pageTitle}
      </h1>
      <p className="mt-5 text-sm leading-7 text-moss">
        {state === "done"
          ? copy.pageDone
          : state === "invalid"
            ? copy.pageInvalid
            : copy.pageBody}
      </p>
      {state === "done" && email ? (
        <p className="mt-3 text-sm text-forest">{email}</p>
      ) : null}
      <p className="mt-4 text-sm leading-7 text-moss">{copy.pageBody}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/${locale}/shop`}
          className="inline-flex min-h-11 items-center rounded-full bg-citrus px-5 font-medium text-white"
        >
          {copy.pageCta}
        </Link>
        <Link
          href={`/${locale === "vi" ? "en" : "vi"}/unsubscribe${token ? `?token=${encodeURIComponent(token)}` : ""}`}
          className="inline-flex min-h-11 items-center text-moss underline hover:text-citrus"
        >
          {locale === "vi" ? "English" : "Tiếng Việt"}
        </Link>
      </div>
    </div>
  );
}
