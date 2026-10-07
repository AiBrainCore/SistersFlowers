import { cookies } from "next/headers";
import {
  getAdminDictionary,
  type AdminDictionary,
  type AdminLocale,
} from "@/i18n/admin-dictionaries";

export const ADMIN_LOCALE_COOKIE = "sf_admin_lang";

export function isAdminLocale(value: string): value is AdminLocale {
  return value === "en" || value === "vi";
}

export async function getAdminLocale(): Promise<AdminLocale> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_LOCALE_COOKIE)?.value || "";
  return isAdminLocale(raw) ? raw : "en";
}

export async function getAdminT(): Promise<{
  locale: AdminLocale;
  t: AdminDictionary;
}> {
  const locale = await getAdminLocale();
  return { locale, t: getAdminDictionary(locale) };
}
