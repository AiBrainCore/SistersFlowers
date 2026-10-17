import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://sisters-flowers-lofu.vercel.app");

export function siteUrl(path = "") {
  const base = SITE_URL.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean === "/" ? "" : clean}`;
}

export function localeAlternates(pathWithoutLocale: string) {
  const path =
    pathWithoutLocale === "/"
      ? ""
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;

  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = siteUrl(`/${locale}${path}`);
  }
  languages["x-default"] = siteUrl(`/en${path}`);

  return {
    canonical: undefined as string | undefined,
    languages,
  };
}

export function buildPageMetadata({
  locale,
  title,
  description,
  pathWithoutLocale = "",
}: {
  locale: Locale;
  title: string;
  description: string;
  pathWithoutLocale?: string;
}): Metadata {
  const path =
    pathWithoutLocale === "/"
      ? ""
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : pathWithoutLocale
          ? `/${pathWithoutLocale}`
          : "";
  const url = siteUrl(`/${locale}${path}`);
  const alternates = localeAlternates(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Sisters Flowers",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
    },
  };
}

export function productJsonLd(input: {
  locale: Locale;
  name: string;
  description: string;
  image: string;
  price: number;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: [siteUrl(input.image)],
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: input.price,
      availability: "https://schema.org/InStock",
      url: input.url,
    },
  };
}
