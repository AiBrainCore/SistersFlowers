"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { parseShopBotParams } from "@/features/shop-bot/params";
import { ShopBotPanel } from "./ShopBotPanel";

export function ShopBotLauncher({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLink = useMemo(
    () => parseShopBotParams(searchParams),
    [searchParams],
  );
  const hideOnAssistant = Boolean(pathname?.includes("/assistant"));
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedAuto, setDismissedAuto] = useState(false);

  const autoOpen = Boolean(deepLink.open) && !hideOnAssistant && !dismissedAuto;
  const open = manualOpen || autoOpen;

  if (hideOnAssistant) return null;

  return (
    <>
      <button
        type="button"
        aria-label={dictionary.shopBot.launcherAria}
        onClick={() => setManualOpen(true)}
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex min-h-12 items-center gap-2 rounded-full bg-forest px-4 py-3 text-ivory shadow-[0_12px_30px_rgba(36,53,42,0.28)] transition hover:bg-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citrus sm:right-6"
      >
        <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M12 3.2c.7 1.8.6 3.3 0 4.4 1.2-.9 2.8-1.2 4.4-.8-.4 1.9-1.4 3.2-2.8 3.7 1.6.4 2.8 1.6 3.3 3.3-1.8.3-3.3-.1-4.3-1.1.2 1.7-.3 3.3-1.6 4.5-1.3-1.2-1.8-2.8-1.6-4.5-1 .1-2.5 1.4-4.3 1.1.5-1.7 1.7-2.9 3.3-3.3C7 9.8 6 8.5 5.6 6.6c1.6-.4 3.2-.1 4.4.8-.6-1.1-.7-2.6 0-4.4.7 0 1.4 0 2 0Z" />
          </svg>
        </span>
        <span className="text-[11px] tracking-[0.14em] uppercase">
          {dictionary.shopBot.launcher}
        </span>
      </button>
      <ShopBotPanel
        locale={locale}
        dictionary={dictionary}
        open={open}
        onClose={() => {
          setManualOpen(false);
          setDismissedAuto(true);
        }}
        deepLink={deepLink}
      />
    </>
  );
}
