import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CategoryPublic } from "@/lib/category-constants";
import { OCCASION_SHOWCASE } from "@/lib/occasion-showcase";
import { Reveal } from "@/components/reveal";

type OccasionCard = {
  slug: string;
  nameEn: string;
  nameVi: string;
  image: string;
  mood: "playful" | "warm" | "refined" | "calm";
};

export function ShopByOccasion({
  locale,
  dictionary,
  categories,
}: {
  locale: Locale;
  dictionary: Dictionary;
  categories: CategoryPublic[];
}) {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const cards: OccasionCard[] = [];

  for (const entry of OCCASION_SHOWCASE) {
    const cat = bySlug.get(entry.slug);
    if (!cat || (cat.productCount ?? 0) <= 0) continue;
    cards.push({
      slug: cat.slug,
      nameEn: cat.nameEn,
      nameVi: cat.nameVi,
      image: entry.image,
      mood: entry.mood,
    });
  }

  if (cards.length === 0) return null;

  const t = dictionary.home;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
      <Reveal>
        <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
          {t.occasionsKicker}
        </p>
        <h2 className="serif mt-2.5 max-w-xl text-3xl text-forest sm:text-4xl">
          {t.occasionsTitle}
        </h2>
        <p className="mt-2.5 max-w-md text-sm leading-6 text-moss">
          {t.occasionsBody}
        </p>
      </Reveal>

      {/* Mobile: snap rail · Desktop: equal 5-up row */}
      <div
        className="mt-7 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-px-4 sm:mt-8 sm:gap-3.5 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {cards.map((card, index) => {
          const name = locale === "vi" ? card.nameVi : card.nameEn;
          const calm = card.mood === "calm";
          return (
            <Reveal
              key={card.slug}
              delay={(index % 3) as 0 | 1 | 2 | 3}
              className="w-[42%] max-w-[11.5rem] shrink-0 snap-start sm:w-[38%] sm:max-w-[13rem] md:w-auto md:max-w-none md:shrink"
            >
              <Link
                role="listitem"
                href={`/${locale}/shop?category=${card.slug}`}
                className={`group relative block aspect-[3/4] overflow-hidden rounded-[1.15rem] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-citrus ${
                  calm
                    ? "shadow-[0_8px_24px_rgba(36,53,42,0.06)]"
                    : "shadow-[0_10px_28px_rgba(36,53,42,0.08)]"
                } transition duration-500 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_16px_36px_rgba(36,53,42,0.12)]`}
              >
                <Image
                  src={card.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 18vw, 42vw"
                  className={`object-cover transition duration-700 ease-out ${
                    calm
                      ? "motion-safe:group-hover:scale-[1.03]"
                      : "motion-safe:group-hover:scale-105"
                  }`}
                />
                {/* Soft bottom read gradient — keeps glass label legible */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${
                    calm
                      ? "from-forest/35 via-forest/10 to-transparent"
                      : "from-forest/40 via-forest/12 to-transparent"
                  }`}
                />
                <div
                  className={`glass-label absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${
                    calm ? "opacity-95" : ""
                  }`}
                >
                  <span className="serif text-[15px] leading-tight text-forest sm:text-base">
                    {name}
                  </span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-[11px] text-citrus transition duration-300 ${
                      calm
                        ? "opacity-50"
                        : "opacity-60 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:opacity-100"
                    }`}
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
