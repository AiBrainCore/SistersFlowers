import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ImmersiveHero3D } from "@/components/immersive-hero-3d";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/hero-3d">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale as Locale);
  const base = buildPageMetadata({
    locale: locale as Locale,
    title: `3D Hero PoC · ${t.brand}`,
    description: t.hero.subtitle,
    pathWithoutLocale: "/hero-3d",
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

export default async function Hero3DPage({
  params,
}: PageProps<"/[locale]/hero-3d">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <ImmersiveHero3D locale={locale} dictionary={t} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-14">
        <h2 className="serif text-2xl text-forest sm:text-3xl">
          {locale === "vi"
            ? "Tiếp theo: 3D thật của Sisters Flowers"
            : "Next: a real Sisters Flowers 3D asset"}
        </h2>
        <ol className="mt-5 max-w-2xl list-decimal space-y-3 pl-5 text-sm leading-7 text-moss">
          <li>
            {locale === "vi"
              ? "Ảnh 360°: 24–36 góc, mỗi 10°, cùng ánh sáng + tripod — nhanh nhất cho thương mại."
              : "360° photos: 24–36 frames at 10° with fixed light + tripod — fastest commercial path."}
          </li>
          <li>
            {locale === "vi"
              ? "Photogrammetry / Gaussian Splatting (vd. Polycam): nhiều vòng độ cao, overlap lớn — giàu không gian hơn, nặng hơn trên điện thoại."
              : "Photogrammetry / Gaussian Splatting (e.g. Polycam): multi-height rings, high overlap — richer space, heavier on mobile."}
          </li>
          <li>
            {locale === "vi"
              ? "GLB riêng: scan studio hoặc artist theo bó hoa Đà Lạt thật — kiểm soát thương hiệu tốt nhất."
              : "Custom GLB: studio scan or commissioned artist of a real Da Lat bouquet — best brand control."}
          </li>
        </ol>
        <p className="mt-8 text-sm text-moss">
          <Link
            href={`/${locale}/hero-preview`}
            className="text-citrus border-b border-citrus/40"
          >
            {t.hero3d.compare2d}
          </Link>
          {" · "}
          <Link
            href={`/${locale}`}
            className="text-citrus border-b border-citrus/40"
          >
            {t.hero3d.back}
          </Link>
        </p>
      </section>
    </div>
  );
}
