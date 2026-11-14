import type { Dictionary } from "@/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

export function HomeReviews({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.home;
  const reviews = [
    { quote: t.review1Quote, name: t.review1Name, meta: t.review1Meta },
    { quote: t.review2Quote, name: t.review2Name, meta: t.review2Meta },
    { quote: t.review3Quote, name: t.review3Name, meta: t.review3Meta },
  ];

  return (
    <section className="border-y border-forest/8 bg-cream/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20">
        <Reveal>
          <p className="text-[11px] tracking-[0.28em] text-citrus uppercase">
            {t.reviewsKicker}
          </p>
          <h2 className="serif mt-3 max-w-xl text-4xl text-forest sm:text-5xl">
            {t.reviewsTitle}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-moss">
            {t.reviewsBody}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal
              key={review.name}
              delay={(index + 1) as 1 | 2 | 3}
            >
              <blockquote className="flex h-full flex-col border-t border-citrus/35 pt-5">
                <p className="flex-1 text-sm leading-7 text-forest">
                  “{review.quote}”
                </p>
                <footer className="mt-5">
                  <p className="text-sm font-medium text-forest">{review.name}</p>
                  <p className="mt-0.5 text-xs tracking-[0.04em] text-moss">
                    {review.meta}
                  </p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
