import type { Locale } from "@/i18n/config";
import {
  STUDIO_CONTACTS,
  studioMapsUrl,
  type StudioContact,
} from "@/lib/locations";

export type MailCitySlug = "dalat" | "danang";

export function normalizeMailCity(citySlug?: string | null): MailCitySlug | null {
  const slug = (citySlug || "").toLowerCase().trim();
  if (slug === "dalat" || slug === "da-lat" || slug === "da lat") return "dalat";
  if (slug === "danang" || slug === "da-nang" || slug === "da nang") return "danang";
  return null;
}

export function studioContactForCity(
  citySlug?: string | null,
): StudioContact | null {
  const normalized = normalizeMailCity(citySlug);
  if (!normalized) return null;
  return STUDIO_CONTACTS.find((s) => s.slug === normalized) || null;
}

export function cityLabel(citySlug?: string | null, locale: Locale = "en") {
  const studio = studioContactForCity(citySlug);
  if (!studio) return null;
  return locale === "vi" ? studio.nameVi : studio.nameEn;
}

/** Inbox subject marker so studio can sort Da Lat vs Da Nang at a glance. */
export function citySubjectTag(citySlug?: string | null) {
  const label = cityLabel(citySlug, "en");
  return label ? `[${label}]` : null;
}

export function studioAddress(
  studio: StudioContact,
  locale: Locale = "en",
) {
  return locale === "vi" ? studio.addressVi : studio.addressEn;
}

export function studioPhoneLine(studio: StudioContact) {
  return studio.phones.map((p) => p.display).join(" · ");
}

export function studioWhatsAppUrl(studio: StudioContact) {
  const digits = studio.phones[0]?.digits || studio.phones[1]?.digits;
  return digits ? `https://wa.me/${digits}` : "https://wa.me/84327453536";
}

export function studioMapsLink(studio: StudioContact, locale: Locale = "en") {
  return studioMapsUrl(studioAddress(studio, locale));
}

/** Brand socials — override via env when handles change. */
export function mailSocialLinks(citySlug?: string | null) {
  const studio = studioContactForCity(citySlug);
  const whatsapp =
    process.env.MAIL_SOCIAL_WHATSAPP?.trim() ||
    (studio ? studioWhatsAppUrl(studio) : "https://wa.me/84327453536");
  return [
    {
      key: "instagram",
      label: "Instagram",
      href:
        process.env.MAIL_SOCIAL_INSTAGRAM?.trim() ||
        "https://www.instagram.com/sistersflowers.vn/",
      cid: "sf-social-instagram",
      path: "/brand/social/instagram.png",
    },
    {
      key: "facebook",
      label: "Facebook",
      href:
        process.env.MAIL_SOCIAL_FACEBOOK?.trim() ||
        "https://www.facebook.com/sistersflowers92",
      cid: "sf-social-facebook",
      path: "/brand/social/facebook.png",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: whatsapp,
      cid: "sf-social-whatsapp",
      path: "/brand/social/whatsapp.png",
    },
    {
      key: "zalo",
      label: "Zalo",
      href:
        process.env.MAIL_SOCIAL_ZALO?.trim() ||
        "https://zalo.me/84327453536",
      cid: "sf-social-zalo",
      path: "/brand/social/zalo.png",
    },
  ] as const;
}
