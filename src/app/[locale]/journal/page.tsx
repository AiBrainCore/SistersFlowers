import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontDictionary } from "@/lib/storefront";
import { listPublishedJournalPosts } from "@/lib/journal";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/journal">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { dictionary: t } = await getStorefrontDictionary(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    title: t.journal.title,
    description: t.journal.intro,
    pathWithoutLocale: "/journal",
  });
}

export default async function JournalIndexPage({
  params,
}: PageProps<"/[locale]/journal">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dictionary: t } = await getStorefrontDictionary(locale);
  const posts = await listPublishedJournalPosts();

  const kindLabel = (kind: string) => {
    if (kind === "story") return t.journal.kinds.story;
    if (kind === "news") return t.journal.kinds.news;
    if (kind === "partnership") return t.journal.kinds.partnership;
    return t.journal.kinds.tip;
  };

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(176,84,44,0.1),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-5 sm:py-16">
        <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
          {t.journal.kicker}
        </p>
        <h1 className="serif mt-3 text-4xl text-forest sm:text-5xl">
          {t.journal.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-moss">
          {t.journal.intro}
        </p>

        {posts.length === 0 ? (
          <p className="mt-12 text-sm text-moss">{t.journal.empty}</p>
        ) : (
          <ul className="mt-12 space-y-10">
            {posts.map((post) => {
              const title = locale === "vi" ? post.titleVi : post.titleEn;
              const excerpt =
                locale === "vi" ? post.excerptVi : post.excerptEn;
              return (
                <li key={post.id}>
                  <Link
                    href={`/${locale}/journal/${post.slug}`}
                    className="group block"
                  >
                    {post.coverImage ? (
                      <div className="relative mb-4 aspect-[16/9] overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={
                            (locale === "vi"
                              ? post.coverAltVi
                              : post.coverAltEn) || title
                          }
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                          sizes="(min-width: 768px) 48rem, 100vw"
                        />
                      </div>
                    ) : null}
                    <p className="text-[11px] tracking-[0.2em] text-citrus uppercase">
                      {kindLabel(post.kind)}
                    </p>
                    <h2 className="serif mt-2 text-2xl text-forest transition group-hover:text-citrus sm:text-3xl">
                      {title}
                    </h2>
                    {excerpt ? (
                      <p className="mt-2 text-sm leading-7 text-moss">
                        {excerpt}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-block text-[11px] tracking-[0.16em] text-citrus uppercase">
                      {t.journal.read}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
