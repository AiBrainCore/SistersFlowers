import { notFound } from "next/navigation";
import { AccountAuthForm } from "@/components/account-auth-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getActiveCity } from "@/lib/locations";
import { supabaseConfigured } from "@/lib/supabase/env";
import { zaloConfigured } from "@/lib/zalo-oauth";

export default async function AccountLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const { error } = await searchParams;
  const city = await getActiveCity();
  const dictionary = getDictionary(raw, city.nameEn);

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
      <AccountAuthForm
        locale={raw}
        dictionary={dictionary}
        mode="login"
        errorCode={error}
        googleEnabled={supabaseConfigured()}
        zaloEnabled={zaloConfigured()}
      />
    </main>
  );
}
