import type { Dictionary } from "@/i18n/dictionaries";
import { Reveal } from "@/components/reveal";
import {
  pickGuestReviews,
  STUDIO_GOOGLE_PROFILES,
  studioGoogleListingUrl,
  studioReviewCtaIsGoogle,
  studioReviewCtaUrl,
  type GuestReview,
  type StudioGoogleProfile,
} from "@/lib/guest-reviews";

/** Multicolor “G” so guests recognize Google Reviews at a glance. */
function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7 12.9 19.6C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.3 44 31.5 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

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

function CityReviewActions({
  profile,
  dictionary,
}: {
  profile: StudioGoogleProfile;
  dictionary: Dictionary;
}) {
  const t = dictionary.home;
  const label = profile.slug === "dalat" ? t.dalatName : t.danangName;
  const seeHref = studioGoogleListingUrl(profile);
  const leaveHref = studioReviewCtaUrl(profile);
  // Both studios must be Google Place IDs — skip the card if misconfigured.
  if (!seeHref || !leaveHref || !studioReviewCtaIsGoogle(profile)) return null;

  const hasRating =
    typeof profile.rating === "number" && (profile.reviewCount ?? 0) > 0;

  return (
    <div className="glass flex h-full flex-col gap-3 rounded-2xl border border-citrus/15 p-4 shadow-[0_10px_28px_rgba(44,41,38,0.06)] sm:p-5">
      <div className="flex items-start gap-3">
        <GoogleMark className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="serif text-lg text-forest">{label}</p>
          {hasRating ? (
            <p className="mt-1 text-sm text-moss">
              <span className="font-medium text-citrus">
                {profile.rating!.toFixed(1)} ★
              </span>
              <span>
                {" "}
                · {profile.reviewCount}+ {t.reviewsOnGoogleReviews}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-moss">{t.reviewsGoogleNewListing}</p>
          )}
        </div>
      </div>

      <a
        href={seeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest/15 bg-white px-4 text-center text-xs tracking-[0.1em] text-forest uppercase transition hover:border-citrus/40"
      >
        {t.reviewsSeeGoogleReviews}
      </a>
      <a
        href={leaveHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-citrus px-4 text-center text-xs tracking-[0.1em] text-ivory uppercase transition hover:bg-citrus/90"
      >
        {t.reviewsLeaveGoogle}
      </a>
    </div>
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
          <div className="mt-10">
            <p className="text-sm text-moss">{t.reviewsWritePrompt}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
              {STUDIO_GOOGLE_PROFILES.map((profile) => (
                <CityReviewActions
                  key={profile.slug}
                  profile={profile}
                  dictionary={dictionary}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
