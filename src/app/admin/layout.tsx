import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Sisters Flowers",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Avoid viewport-fit=cover — safe-area padding made the orange topbar jump height on iOS. */
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="admin-body">{children}</div>;
}
