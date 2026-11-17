import type { Locale } from "@/i18n/config";

/** Client-safe city label — keep free of next/headers / Prisma. */
export function cityDisplayName(
  city: { nameEn: string; nameVi: string },
  locale: Locale,
) {
  return locale === "vi" ? city.nameVi : city.nameEn;
}
