"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <div className="flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase">
      {locales.map((item) => (
        <Link
          key={item}
          href={`/${item}${rest ? `/${rest}` : ""}`}
          className={`rounded-full px-2 py-1 ${
            item === locale ? "bg-forest text-ivory" : "text-moss hover:text-forest"
          }`}
        >
          {item}
        </Link>
      ))}
    </div>
  );
}
