import Image from "next/image";
import type { Locale } from "@/i18n/config";
import {
  studioMapsUrl,
  studioPrimaryPhone,
  studioWhatsAppDigits,
  studioZaloUrl,
  type StudioContact,
} from "@/lib/studio-contacts";

type SocialLabels = {
  phones: string;
  social: string;
  facebook: string;
  messenger: string;
  tiktok: string;
  whatsapp: string;
  zalo: string;
};

export function StudioCard({
  studio,
  locale,
  directionsLabel,
  callLabel,
  socialLabels,
  emphasize = false,
}: {
  studio: StudioContact;
  locale: Locale;
  directionsLabel: string;
  callLabel: string;
  /** When set, show phone list heading + social chips (contact page). */
  socialLabels?: SocialLabels;
  emphasize?: boolean;
}) {
  const name = locale === "vi" ? studio.nameVi : studio.nameEn;
  const address = locale === "vi" ? studio.addressVi : studio.addressEn;
  const primaryPhone = studioPrimaryPhone(studio);
  const mapsHref = studioMapsUrl(address);
  const waDigits = studioWhatsAppDigits(studio);

  const socialLinks = [
    {
      key: "facebook",
      href: studio.socials.facebook,
      label: socialLabels?.facebook || "Facebook",
    },
    {
      key: "messenger",
      href: studio.socials.messenger,
      label: socialLabels?.messenger || "Messenger",
    },
    {
      key: "tiktok",
      href: studio.socials.tiktok,
      label: socialLabels?.tiktok || "TikTok",
    },
    {
      key: "whatsapp",
      href: `https://wa.me/${waDigits}`,
      label: socialLabels?.whatsapp || "WhatsApp",
    },
    {
      key: "zalo",
      href: studioZaloUrl(studio),
      label: socialLabels?.zalo || "Zalo",
    },
  ];

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-citrus/15 bg-white/85 shadow-[0_12px_32px_rgba(44,41,38,0.06)] ${
        emphasize ? "shadow-[0_16px_40px_rgba(44,41,38,0.1)]" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          emphasize ? "aspect-[16/9] sm:aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={studio.image}
          alt={
            locale === "vi"
              ? `Studio Sisters Flowers — ${name}`
              : `Sisters Flowers studio — ${name}`
          }
          fill
          className="object-cover object-center"
          sizes="(min-width: 640px) 40vw, 92vw"
          quality={68}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper/95 via-paper/15 to-transparent" />
        <h3 className="serif absolute bottom-3 left-4 text-2xl text-citrus sm:text-3xl">
          {name}
        </h3>
      </div>

      <div className={`px-5 pb-5 ${emphasize ? "pt-5" : "pt-4"}`}>
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="block text-sm leading-6 text-forest transition hover:text-citrus"
        >
          {address}
        </a>

        {socialLabels ? (
          <p className="mt-5 text-[10px] tracking-[0.16em] text-citrus uppercase">
            {socialLabels.phones}
          </p>
        ) : null}
        <ul className={`${socialLabels ? "mt-2" : "mt-3"} space-y-0.5`}>
          {studio.phones.map((phone) => (
            <li key={phone.digits}>
              <a
                href={`tel:+${phone.digits}`}
                className="inline-flex min-h-11 items-center text-base font-medium tabular-nums tracking-wide text-forest hover:text-citrus sm:text-[1.05rem]"
              >
                {phone.display}
              </a>
            </li>
          ))}
        </ul>

        {socialLabels ? (
          <div className="mt-5">
            <p className="text-[10px] tracking-[0.16em] text-citrus uppercase">
              {socialLabels.social}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center rounded-full border border-forest/15 bg-cream/70 px-3.5 text-[11px] tracking-[0.1em] text-forest uppercase transition hover:border-citrus/45 hover:text-citrus"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
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
