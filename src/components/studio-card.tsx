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
  /** Short friendly hint, e.g. “Chat with us” — no jargon. */
  chatHint?: string;
};

const SOCIAL_ICONS: Record<string, string | "messenger-svg"> = {
  facebook: "/brand/social/facebook.png",
  messenger: "messenger-svg",
  tiktok: "/brand/social/tiktok.png",
  whatsapp: "/brand/social/whatsapp.png",
  zalo: "/brand/social/zalo.png",
};

function MessengerMark({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      aria-hidden
      focusable="false"
    >
      <circle cx="64" cy="64" r="64" fill="#0866FF" />
      <path
        fill="#fff"
        d="M64 24c-22.1 0-40 16.5-40 36.9 0 11.6 5.7 22 14.7 28.8V104l13.5-7.4c3.7 1 7.6 1.6 11.8 1.6 22.1 0 40-16.5 40-36.9S86.1 24 64 24zm4.1 49.7-10.2-10.9-19.9 10.9 21.9-23.3 10.4 10.9 19.7-10.9-21.9 23.3z"
      />
    </svg>
  );
}

function SocialGlyph({
  kind,
  size = 22,
}: {
  kind: string;
  size?: number;
}) {
  const src = SOCIAL_ICONS[kind];
  if (src === "messenger-svg") {
    return (
      <MessengerMark
        className={size <= 16 ? "h-4 w-4" : "h-[22px] w-[22px]"}
      />
    );
  }
  return (
    <Image
      src={src!}
      alt=""
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function StudioCard({
  studio,
  locale,
  directionsLabel,
  callLabel,
  socialLabels,
  emphasize = false,
  showCallButton = true,
}: {
  studio: StudioContact;
  locale: Locale;
  directionsLabel: string;
  callLabel: string;
  /** Contact headings + accessible names for social chips. */
  socialLabels?: SocialLabels;
  emphasize?: boolean;
  /** Find us cards hide Call — phone numbers are already tappable. */
  showCallButton?: boolean;
}) {
  const name = locale === "vi" ? studio.nameVi : studio.nameEn;
  const address = locale === "vi" ? studio.addressVi : studio.addressEn;
  const primaryPhone = studioPrimaryPhone(studio);
  const mapsHref = studioMapsUrl(studio);
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

  const chatHint =
    socialLabels?.chatHint ||
    (locale === "vi" ? "Nhắn tin cho studio" : "Chat with the studio");

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
        {!emphasize ? (
          <>
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
                    className="inline-flex min-h-10 items-center text-base font-medium tabular-nums tracking-wide text-forest hover:text-citrus sm:text-[1.05rem]"
                  >
                    {phone.display}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs leading-5 text-moss">{chatHint}</p>
            <nav
              aria-label={chatHint}
              className="mt-2.5 flex flex-wrap items-center gap-2"
            >
              {socialLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-forest/10 bg-[#fff8f2] shadow-[0_1px_0_rgba(44,41,38,0.04)] transition hover:-translate-y-0.5 hover:border-citrus/35 hover:bg-white hover:shadow-[0_6px_16px_rgba(44,41,38,0.1)] active:translate-y-0"
                >
                  <SocialGlyph kind={item.key} size={22} />
                </a>
              ))}
            </nav>

            <div className="mt-4">
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-citrus px-4 text-[11px] tracking-[0.14em] text-ivory uppercase transition hover:bg-citrus/90 sm:w-auto"
              >
                {directionsLabel}
              </a>
            </div>
          </>
        ) : (
          <>
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

            <div className="mt-5">
              {socialLabels ? (
                <p className="text-[10px] tracking-[0.16em] text-citrus uppercase">
                  {socialLabels.social}
                </p>
              ) : null}
              <div
                className={`flex flex-wrap items-center gap-2 ${
                  socialLabels ? "mt-2.5" : ""
                }`}
                aria-label={socialLabels?.social || chatHint}
              >
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-forest/15 bg-cream/70 px-3.5 text-[11px] tracking-[0.1em] text-forest uppercase transition hover:border-citrus/45 hover:text-citrus"
                  >
                    <SocialGlyph kind={item.key} size={16} />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-citrus px-4 text-[11px] tracking-[0.14em] text-ivory uppercase transition hover:bg-citrus/90 sm:flex-none"
              >
                {directionsLabel}
              </a>
              {showCallButton ? (
                <a
                  href={`tel:+${primaryPhone.digits}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-forest/20 bg-white/60 px-4 text-[11px] tracking-[0.14em] text-forest uppercase transition hover:border-citrus/40 sm:flex-none"
                >
                  {callLabel}
                </a>
              ) : null}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
