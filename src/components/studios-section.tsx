import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { StudioCard } from "@/components/studio-card";
import type { StudioContact } from "@/lib/studio-contacts";

/** Studio locations — separate from the site footer. */
export function StudiosSection({
  locale,
  dictionary,
  studios,
}: {
  locale: Locale;
  dictionary: Dictionary;
  studios: StudioContact[];
}) {
  const t = dictionary.footer;

  return (
    <section
      aria-labelledby="studios-heading"
      className="border-t border-forest/10 bg-cream/35"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
        <div className="max-w-xl">
          <h2
            id="studios-heading"
            className="serif text-2xl text-forest sm:text-3xl"
          >
            {t.studios}
          </h2>
          <p className="mt-3 text-sm leading-7 text-moss">{t.line}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {studios.map((studio) => (
            <StudioCard
              key={studio.slug}
              studio={studio}
              locale={locale}
              directionsLabel={t.directions}
              callLabel={t.call}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
