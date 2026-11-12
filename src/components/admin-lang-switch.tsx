"use client";

import { usePathname } from "next/navigation";
import { setAdminLocaleAction } from "@/app/admin/actions";
import type { AdminLocale } from "@/i18n/admin-dictionaries";

export function AdminLangSwitch({ locale }: { locale: AdminLocale }) {
  const pathname = usePathname() || "/admin";

  return (
    <div className="admin-lang">
      {(["en", "vi"] as const).map((code) => (
        <form key={code} action={setAdminLocaleAction}>
          <input type="hidden" name="locale" value={code} />
          <input type="hidden" name="next" value={pathname} />
          <button
            type="submit"
            className={`admin-lang-btn${locale === code ? " on" : ""}`}
          >
            {code.toUpperCase()}
          </button>
        </form>
      ))}
    </div>
  );
}
