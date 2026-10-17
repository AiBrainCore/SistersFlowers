import { permanentRedirect } from "next/navigation";
import { isLocale } from "@/i18n/config";

/** Immersive Hero now lives on the development homepage. */
export default async function HeroPreviewRedirect({
  params,
}: PageProps<"/[locale]/hero-preview">) {
  const { locale } = await params;
  if (!isLocale(locale)) permanentRedirect("/en");
  permanentRedirect(`/${locale}`);
}
