import type { Dictionary } from "@/i18n/dictionaries";
import { Reveal } from "@/components/reveal";
import {
  pickGuestReviews,
  STUDIO_GOOGLE_PROFILES,
  studioGoogleWriteReviewUrl,
  type GuestReview,
  type StudioGoogleProfile,
} from "@/lib/guest-reviews";

function StarRow({ stars }: { stars: number }) {
  return (
    <p
      className="flex items-center gap-0.5 text-citrus"
      aria-label={`${stars} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < stars ? "opacity-100" : "opacity-25"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </p>
  );
}

function GoogleBadge({
  profile,
  dictionary,
}: {
  profile: StudioGoogleProfile;
  dictionary: Dictionary;
}) {
  const t = dictionary.home;
  const label = profile.slug === "dalat" ? t.dalatName : t.danangName;

  return (
    <a
      href={profile.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="glass inline-flex min-h-11 items-center gap-2 rounded-full border border-citrus/20 px-3.5 py-2 text-sm text-forest shadow-[0_8px_20px_rgba(44,41,38,0.06)] transition hover:border-citrus/40"
    >
      <span className="serif text-citrus">{profile.rating.toFixed(1)}</span>
      <span className="text-citrus" aria-hidden>
        ★
      </span>
      <span className="text-moss">
        {label}
        {profile.reviewCount > 0
          ? ` · ${profile.reviewCount}+ ${t.reviewsOnGoogle}`
          : ` · ${t.reviewsOnGoogle}`}
      </span>
      <span className="sr-only">{t.reviewsSeeGoogle}</span>
    </a>
  );
}

function ReviewCard({
  review,
  index,
  viaGoogle,
}: {
  review: GuestReview;
  index: number;
  viaGoogle: string;
}) {
  return (
    <Reveal delay={(index + 1) as 1 | 2 | 3}>
      <blockquote
        lang={/[\u00C0-\u1EF9]/.test(review.quote) ? "vi" : "en"}
        className="glass flex h-full flex-col rounded-2xl border border-citrus/15 p-5 shadow-[0_14px_36px_rgba(44,41,38,0.07)] sm:p-6"
      >
        <StarRow stars={review.stars} />
        <p className="mt-3 flex-1 text-sm leading-7 text-forest">
          “{review.quote}”
        </p>
        <footer className="mt-5 border-t border-citrus/20 pt-4">
          <p className="text-sm font-medium text-forest">{review.name}</p>
          <p className="mt-0.5 text-xs tracking-[0.04em] text-moss">
            {review.meta}
            {review.source === "google" ? ` · ${viaGoogle}` : null}
          </p>
        </footer>
      </blockquote>
    </Reveal>
  );
}

export function HomeReviews({ dictionary }: { dictionary: Dictionary }) {
  const t = dictionary.home;
  const reviews = pickGuestReviews(3);
  const writeLinks = STUDIO_GOOGLE_PROFILES.map((profile) => ({
    profile,
    href: studioGoogleWriteReviewUrl(profile),
    label: profile.slug === "dalat" ? t.dalatName : t.danangName,
  }));

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
          <div className="mt-6 flex flex-wrap gap-2.5">
            {STUDIO_GOOGLE_PROFILES.map((profile) => (
              <GoogleBadge
                key={profile.slug}
                profile={profile}
                dictionary={dictionary}
              />
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={index}
              viaGoogle={t.reviewsViaGoogle}
            />
          ))}
        </div>

        <Reveal>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="text-sm text-moss">{t.reviewsWritePrompt}</p>
            <div className="flex flex-wrap gap-2">
              {writeLinks.map(({ profile, href, label }) => (
                <a
                  key={profile.slug}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full bg-citrus px-4 text-xs tracking-[0.12em] text-ivory uppercase"
                >
                  {t.reviewsLeaveGoogle} · {label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
