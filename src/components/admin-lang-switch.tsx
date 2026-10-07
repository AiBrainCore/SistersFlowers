"use client";

import { usePathname } from "next/navigation";
import { setAdminLocaleAction } from "@/app/admin/actions";
import type { AdminLocale } from "@/i18n/admin-dictionaries";

export function AdminLangSwitch({ locale }: { locale: AdminLocale }) {
  const pathname = usePathname() || "/admin";

  return (
    <div style={{ marginTop: 28, display: "flex", gap: 8 }}>
      {(["en", "vi"] as const).map((code) => (
        <form key={code} action={setAdminLocaleAction}>
          <input type="hidden" name="locale" value={code} />
          <input type="hidden" name="next" value={pathname} />
          <button
            type="submit"
            className="admin-btn secondary"
            style={{
              color: "#f6f1e8",
              borderColor:
                locale === code
                  ? "rgba(246,241,232,0.85)"
                  : "rgba(246,241,232,0.3)",
              opacity: locale === code ? 1 : 0.7,
              padding: "6px 10px",
              fontSize: 11,
            }}
          >
            {code.toUpperCase()}
          </button>
        </form>
      ))}
    </div>
  );
}
