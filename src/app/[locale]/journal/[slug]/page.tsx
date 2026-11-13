import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { getJournalPostBySlug } from "@/lib/journal";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getJournalPostBySlug(slug);
  if (!post) return {};
  const title = locale === "vi" ? post.titleVi : post.titleEn;
  const description = (
    locale === "vi"
      ? post.excerptVi || post.bodyVi
      : post.excerptEn || post.bodyEn
  ).slice(0, 160);
  return buildPageMetadata({
    locale: locale as Locale,
    title,
    description,
    pathWithoutLocale: `/journal/${slug}`,
  });
}

export default async function JournalPostPage({
  params,
}: PageProps<"/[locale]/journal/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = await getJournalPostBySlug(slug);
  if (!post) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);

  const title = locale === "vi" ? post.titleVi : post.titleEn;
  const body = locale === "vi" ? post.bodyVi : post.bodyEn;
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const kindLabel =
    post.kind === "story"
      ? t.journal.kinds.story
      : post.kind === "news"
        ? t.journal.kinds.news
        : post.kind === "partnership"
          ? t.journal.kinds.partnership
          : t.journal.kinds.tip;

  return (
    <article>
      {post.coverImage ? (
        <div className="relative h-[42vh] min-h-[240px] w-full">
          <Image
            src={post.coverImage}
            alt=""
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
        </p>
        <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">{title}</h1>
        <div className="mt-8 space-y-5 text-sm leading-8 text-moss">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
