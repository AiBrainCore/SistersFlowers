import type { ReactNode } from "react";
import "./admin.css";

export const metadata = {
  title: "Admin · Sisters Flowers",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="admin-body">{children}</div>;
}
