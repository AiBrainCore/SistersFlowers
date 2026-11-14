import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { getJournalPostBySlug, listPublishedJournalPosts } from "@/lib/journal";
import {
  isJournalHtml,
  sanitizeJournalHtml,
} from "@/lib/journal-html";
import { buildPageMetadata, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getJournalPostBySlug(slug);
  if (!post) return {};
  const title =
    (locale === "vi" ? post.seoTitleVi : post.seoTitleEn)?.trim() ||
    (locale === "vi" ? post.titleVi : post.titleEn);
  const description = (
    (locale === "vi" ? post.seoDescriptionVi : post.seoDescriptionEn)?.trim() ||
    (locale === "vi" ? post.excerptVi : post.excerptEn) ||
    ""
  ).slice(0, 160);
  const meta = buildPageMetadata({
    locale: locale as Locale,
    title,
    description,
    pathWithoutLocale: `/journal/${slug}`,
  });
  if (post.coverImage) {
    const alt =
      (locale === "vi" ? post.coverAltVi : post.coverAltEn) || title;
    meta.openGraph = {
      ...meta.openGraph,
      type: "article",
      images: [
        {
          url: post.coverImage.startsWith("http")
            ? post.coverImage
            : siteUrl(post.coverImage),
          alt,
        },
      ],
    };
  }
  return meta;
}

export default async function JournalPostPage({
  params,
}: PageProps<"/[locale]/journal/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = await getJournalPostBySlug(slug);
  if (!post) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const related = (await listPublishedJournalPosts())
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const title = locale === "vi" ? post.titleVi : post.titleEn;
  const bodyRaw = locale === "vi" ? post.bodyVi : post.bodyEn;
  const coverAlt =
    (locale === "vi" ? post.coverAltVi : post.coverAltEn) || title;

  const kindLabel =
    post.kind === "story"
      ? t.journal.kinds.story
      : post.kind === "news"
        ? t.journal.kinds.news
        : post.kind === "partnership"
          ? t.journal.kinds.partnership
          : t.journal.kinds.tip;

  const dateLabel = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: (locale === "vi" ? post.excerptVi : post.excerptEn) || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    image: post.coverImage
      ? [
          post.coverImage.startsWith("http")
            ? post.coverImage
            : siteUrl(post.coverImage),
        ]
      : undefined,
    inLanguage: locale === "vi" ? "vi-VN" : "en-US",
    author: { "@type": "Organization", name: "Sisters Flowers" },
    publisher: { "@type": "Organization", name: "Sisters Flowers" },
    mainEntityOfPage: siteUrl(`/${locale}/journal/${slug}`),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {post.coverImage ? (
        <div className="relative h-[42vh] min-h-[240px] w-full">
          <Image
            src={post.coverImage}
            alt={coverAlt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-transparent" />
        </div>
      ) : null}

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-5 sm:py-16">
        <Link
          href={`/${locale}/journal`}
          className="text-[11px] tracking-[0.16em] text-citrus uppercase"
        >
          ← {t.journal.back}
        </Link>
        <p className="mt-6 text-[11px] tracking-[0.28em] text-citrus uppercase">
          {kindLabel}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">{title}</h1>

        <div className="journal-article-body mt-8 space-y-5 text-sm leading-8 text-moss">
          {isJournalHtml(bodyRaw) ? (
            <div
              dangerouslySetInnerHTML={{
                __html: sanitizeJournalHtml(bodyRaw),
              }}
            />
          ) : (
            bodyRaw
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((paragraph, index) => <p key={index}>{paragraph}</p>)
          )}
        </div>

        {related.length ? (
          <aside className="mt-14 border-t border-forest/10 pt-8">
            <p className="text-[11px] tracking-[0.18em] text-moss uppercase">
              {locale === "vi" ? "Bài liên quan" : "Related"}
            </p>
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/${locale}/journal/${item.slug}`}
                    className="text-forest underline-offset-4 hover:text-citrus hover:underline"
                  >
                    {locale === "vi" ? item.titleVi : item.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
