"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

type ModelContextNav = Navigator & {
  modelContext?: {
    registerTool?: (tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    }) => void;
  };
};

/** Registers a tiny in-browser tool when WebMCP is available — no-op otherwise. */
export function WebMcpTools({ locale }: { locale: Locale }) {
  useEffect(() => {
    const nav = navigator as ModelContextNav;
    const register = nav.modelContext?.registerTool;
    if (typeof register !== "function") return;

    try {
      register({
        name: "open_sisters_shop",
        description: "Open the Sisters Flowers bouquet shop for the active locale.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          window.location.assign(`/${locale}/shop`);
          return { ok: true, href: `/${locale}/shop` };
        },
      });
    } catch {
      // Older browsers / absent WebMCP — ignore
    }
  }, [locale]);

  return null;
}
