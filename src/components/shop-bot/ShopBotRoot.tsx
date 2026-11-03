"use client";

import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ShopBotLauncher } from "./ShopBotLauncher";

export function ShopBotRoot({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <Suspense fallback={null}>
      <ShopBotLauncher locale={locale} dictionary={dictionary} />
    </Suspense>
  );
}
