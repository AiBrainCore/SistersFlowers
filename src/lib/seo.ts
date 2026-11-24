import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";
import { BRAND } from "@/lib/brand";

/** Canonical production origin — never use localhost in live auth/email links. */
export const PUBLIC_SITE_ORIGIN = "https://sistersflowers.vn";

function resolveSiteOrigin(): string {
  const candidates = [
    process.env.MAIL_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim().replace(/\/$/, "");
    if (!value) continue;
    if (/localhost|127\.0\.0\.1/i.test(value)) continue;
    return value;
  }
  // Local dev only: allow localhost when explicitly permitted or not in production.
  if (
    process.env.ALLOW_LOCALHOST_SITE_URL === "1" ||
    process.env.NODE_ENV !== "production"
  ) {
    const local =
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
      "http://localhost:3000";
    return local;
  }
  return PUBLIC_SITE_ORIGIN;
}

/** Absolute public URL for redirects, emails, and SEO. */
export function siteUrl(path = "") {
  const base = resolveSiteOrigin();
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
  languages["x-default"] = siteUrl(`/vi${path}`);

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
      siteName: BRAND.name,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
      images: [
        {
          url: siteUrl(BRAND.ogDefault),
          width: 1024,
          height: 1024,
          alt: BRAND.name,
        },
      ],
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

export function organizationJsonLd(locale: Locale) {
  const home = siteUrl(`/${locale}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${home}#organization`,
        name: BRAND.name,
        url: home,
        logo: siteUrl(BRAND.icon512),
        foundingDate: "2020",
        sameAs: [
          "https://wa.me/84327453536",
          siteUrl("/en"),
          siteUrl("/vi"),
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+84-327-453-536",
            contactType: "customer service",
            areaServed: ["VN"],
            availableLanguage: ["English", "Vietnamese"],
          },
        ],
      },
      {
        "@type": "Florist",
        "@id": `${home}#danang`,
        name: "Sisters Flowers Da Nang",
        parentOrganization: { "@id": `${home}#organization` },
        url: home,
        image: siteUrl("/bouquets/shown/w-01.jpg"),
        telephone: ["+84-904-985-761", "+84-327-453-536"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "53 Luong Nhu Hoc, Hoa Cuong Bac, Hai Chau",
          addressLocality: "Da Nang",
          addressCountry: "VN",
        },
        areaServed: {
          "@type": "City",
          name: "Da Nang",
        },
        priceRange: "₫₫",
        sameAs: ["https://wa.me/84327453536"],
      },
      {
        "@type": "Florist",
        "@id": `${home}#dalat`,
        name: "Sisters Flowers Da Lat",
        parentOrganization: { "@id": `${home}#organization` },
        url: home,
        image: siteUrl("/bouquets/shown/w-06.jpg"),
        telephone: ["+84-904-985-761", "+84-964-889-329"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "27T Thi Sach Street, Cam Ly",
          addressLocality: "Da Lat",
          addressRegion: "Lam Dong",
          postalCode: "67000",
          addressCountry: "VN",
        },
        areaServed: {
          "@type": "City",
          name: "Da Lat",
        },
        priceRange: "₫₫",
        sameAs: ["https://wa.me/84327453536"],
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name: "Sisters Flowers",
        publisher: { "@id": `${home}#organization` },
        inLanguage: [locale === "vi" ? "vi-VN" : "en-US", "vi-VN", "en-US"],
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl(`/${locale}/shop`)}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function homepageProductListJsonLd(
  locale: Locale,
  products: {
    name: string;
    description: string;
    image: string;
    price: number;
    slug: string;
  }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured bouquets",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: [siteUrl(product.image)],
        url: siteUrl(`/${locale}/shop/${product.slug}`),
        offers: {
          "@type": "Offer",
          priceCurrency: "VND",
          price: product.price,
          availability: "https://schema.org/InStock",
          url: siteUrl(`/${locale}/shop/${product.slug}`),
        },
      },
    })),
  };
}
