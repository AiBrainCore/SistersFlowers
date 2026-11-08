import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { StudioContact } from "@/lib/locations";
import { studioMapsUrl } from "@/lib/locations";

export function StudioCard({
  studio,
  locale,
  directionsLabel,
  callLabel,
}: {
  studio: StudioContact;
  locale: Locale;
  directionsLabel: string;
  callLabel: string;
}) {
  const name = locale === "vi" ? studio.nameVi : studio.nameEn;
  const address = locale === "vi" ? studio.addressVi : studio.addressEn;
  const primaryPhone = studio.phones[0]!;
  const mapsHref = studioMapsUrl(address);

  return (
    <article className="overflow-hidden rounded-2xl border border-citrus/15 bg-white/70">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={studio.image}
          alt=""
          fill
          className="object-cover object-center"
          sizes="(min-width: 640px) 40vw, 92vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper/90 via-paper/10 to-transparent" />
        <h3 className="serif absolute bottom-3 left-4 text-2xl text-citrus sm:text-3xl">
          {name}
        </h3>
      </div>

      <div className="px-5 pt-4 pb-5">
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="block text-sm leading-6 text-forest transition hover:text-citrus"
        >
          {address}
        </a>
        <ul className="mt-3 space-y-0.5">
          {studio.phones.map((phone) => (
            <li key={phone.digits}>
              <a
                href={`tel:+${phone.digits}`}
                className="inline-flex min-h-10 items-center text-sm font-medium text-forest hover:text-citrus"
              >
                {phone.display}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-citrus px-4 text-[11px] tracking-[0.14em] text-ivory uppercase transition hover:bg-citrus/90 sm:flex-none"
          >
            {directionsLabel}
          </a>
          <a
            href={`tel:+${primaryPhone.digits}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-forest/20 bg-white/60 px-4 text-[11px] tracking-[0.14em] text-forest uppercase transition hover:border-citrus/40 sm:flex-none"
          >
            {callLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
