"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { AdminLangSwitch } from "@/components/admin-lang-switch";
import type { AdminLocale } from "@/i18n/admin-dictionaries";

export type AdminNavLabels = {
  dashboard: string;
  products: string;
  addons: string;
  vouchers: string;
  delivery: string;
  payments: string;
  shopping: string;
  reports: string;
  builder: string;
  orders: string;
  customers: string;
  inquiries: string;
  journal: string;
  viewShop: string;
  logout: string;
  menu: string;
  menuOpen: string;
  menuClose: string;
};

const LINKS: { href: string; key: keyof AdminNavLabels }[] = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/products", key: "products" },
  { href: "/admin/addons", key: "addons" },
  { href: "/admin/vouchers", key: "vouchers" },
  { href: "/admin/delivery", key: "delivery" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/shopping", key: "shopping" },
  { href: "/admin/reports", key: "reports" },
  { href: "/admin/builder", key: "builder" },
  { href: "/admin/orders", key: "orders" },
  { href: "/admin/customers", key: "customers" },
  { href: "/admin/inquiries", key: "inquiries" },
  { href: "/admin/journal", key: "journal" },
];

function linkActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({
  locale,
  labels,
}: {
  locale: AdminLocale;
  labels: AdminNavLabels;
}) {
  const pathname = usePathname() || "/admin";
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navLinks = (
    <nav className="admin-nav-links" aria-label={labels.menu}>
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            linkActive(pathname, item.href) ? "admin-nav-link on" : "admin-nav-link"
          }
          onClick={() => setOpen(false)}
        >
          {labels[item.key]}
        </Link>
      ))}
    </nav>
  );

  const foot = (
    <div className="admin-nav-foot">
      <Link
        href={`/${locale}/shop`}
        className="admin-nav-shop"
        onClick={() => setOpen(false)}
      >
        {labels.viewShop}
      </Link>
      <div className="admin-nav-tools">
        <AdminLangSwitch locale={locale} />
        <form action={logoutAction}>
          <button type="submit" className="admin-btn secondary admin-logout">
            {labels.logout}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <header className="admin-topbar">
        <Link href="/admin" className="admin-topbar-brand" aria-label="Sisters Flowers">
          <Image
            src="/brand/mark-white.png"
            alt=""
            width={28}
            height={28}
            priority
          />
        </Link>
        <p className="admin-topbar-title">{labels.menu}</p>
        <button
          type="button"
          className="admin-topbar-menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? labels.menuClose : labels.menuOpen}
        </button>
      </header>

      <aside className="admin-nav admin-nav-desktop">
        <Link href="/admin" className="admin-nav-brand" aria-label="Sisters Flowers">
          <Image
            src="/brand/mark-white.png"
            alt="Sisters Flowers"
            width={44}
            height={44}
            priority
          />
        </Link>
        {navLinks}
        {foot}
      </aside>

      <div
        className={open ? "admin-drawer-backdrop on" : "admin-drawer-backdrop"}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <aside
        id={panelId}
        className={open ? "admin-drawer on" : "admin-drawer"}
        aria-hidden={!open}
      >
        <div className="admin-drawer-head">
          <Link
            href="/admin"
            className="admin-nav-brand"
            aria-label="Sisters Flowers"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/brand/mark-white.png"
              alt="Sisters Flowers"
              width={40}
              height={40}
              priority
            />
          </Link>
          <button
            type="button"
            className="admin-drawer-close"
            onClick={() => setOpen(false)}
          >
            {labels.menuClose}
          </button>
        </div>
        {navLinks}
        {foot}
      </aside>
    </>
  );
}
