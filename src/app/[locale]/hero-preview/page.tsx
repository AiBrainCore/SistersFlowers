import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ImmersiveHero } from "@/components/immersive-hero";
import { ProductCard } from "@/components/product-card";
import { listPublishedProducts } from "@/lib/products";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/hero-preview">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
  const base = buildPageMetadata({
    locale: locale as Locale,
    title: `Hero preview · ${t.brand}`,
    description: t.hero.subtitle,
    pathWithoutLocale: "/hero-preview",
  });
  return {
    ...base,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function HeroPreviewPage({
  params,
}: PageProps<"/[locale]/hero-preview">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const featured = (await listPublishedProducts()).slice(0, 4);

  return (
    <div>
      <ImmersiveHero locale={locale} dictionary={t} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
              {locale === "vi" ? "Sau hero" : "Below the hero"}
            </p>
            <h2 className="serif mt-2 text-3xl text-forest sm:text-4xl">
              {t.home.featured}
            </h2>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="min-h-11 text-[12px] tracking-[0.16em] text-citrus uppercase border-b border-citrus/50"
          >
            {t.home.viewAll}
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-7 text-moss">
          {locale === "vi"
            ? "Trang này chỉ là nguyên mẫu Phase 3. Trang chủ hiện tại chưa thay đổi. Để có 360° thật: chụp 24–36 góc cùng một bó hoa (ánh sáng cố định) hoặc cung cấp model GLB."
            : "This page is a Phase 3 prototype only. The live homepage is unchanged. For true 360°: photograph one studio bouquet from 24–36 angles (fixed lighting) or provide a GLB model."}
        </p>
      </section>
    </div>
  );
}
