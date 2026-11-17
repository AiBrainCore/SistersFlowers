import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  deleteCustomerAction,
  syncGuestCustomersAction,
} from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import { supabaseConfigured } from "@/lib/supabase/env";

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function formatWhen(date: Date, locale: string) {
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortAddress(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) return null;
  if (text.length <= 42) return text;
  return `${text.slice(0, 40)}…`;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    deleted?: string;
    synced?: string;
    scanned?: string;
    provider?: string;
  }>;
}) {
  const [{ locale, t }, sp] = await Promise.all([
    getAdminT(),
    searchParams || Promise.resolve({}),
  ]);
  const params = sp as {
    q?: string;
    deleted?: string;
    synced?: string;
    scanned?: string;
    provider?: string;
  };
  const q = (params.q || "").trim();
  const providerFilter = (params.provider || "all").trim() || "all";
  const deleted = params.deleted;
  const synced = params.synced;
  const scanned = params.scanned;

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { address: true, createdAt: true },
      },
    },
  });

  const qFold = fold(q);
  const filtered = customers.filter((c) => {
    if (providerFilter !== "all" && c.provider !== providerFilter) return false;
    if (!qFold) return true;
    const latestAddress = c.address || c.orders[0]?.address || "";
    return fold(
      [
        c.name || "",
        c.email || "",
        c.phone || "",
        latestAddress,
        c.provider,
        c.zaloId || "",
      ].join(" "),
    ).includes(qFold);
  });

  const unlinkedOrders = await prisma.order.count({
    where: { customerId: null },
  });

  const counts = {
    all: customers.length,
    guest: customers.filter((c) => c.provider === "guest").length,
    email: customers.filter((c) => c.provider === "email").length,
    google: customers.filter((c) => c.provider === "google").length,
    zalo: customers.filter((c) => c.provider === "zalo").length,
  };

  const returnQs = (() => {
    const p = new URLSearchParams();
    if (q) p.set("returnQ", q);
    if (providerFilter !== "all") p.set("returnProvider", providerFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  })();

  return (
    <AdminShell title={t.customers.title}>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 720, lineHeight: 1.6 }}>
        {t.customers.intro}
      </p>
      {!supabaseConfigured() ? (
        <p
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(194,71,18,0.08)",
            color: "#8a3a12",
            fontSize: 13,
          }}
        >
          {t.customers.authOff}
        </p>
      ) : null}

      <div className="admin-customers-toolbar">
        <form method="get" className="admin-customers-filters">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.customers.searchPlaceholder}
            className="admin-customers-search"
          />
          <select name="provider" defaultValue={providerFilter}>
            <option value="all">
              {t.customers.filterAll} ({counts.all})
            </option>
            <option value="guest">
              {t.customers.providerGuest} ({counts.guest})
            </option>
            <option value="email">
              {t.customers.providerEmail} ({counts.email})
            </option>
            <option value="google">
              {t.customers.providerGoogle} ({counts.google})
            </option>
            <option value="zalo">
              {t.customers.providerZalo} ({counts.zalo})
            </option>
          </select>
          <button type="submit" className="admin-btn secondary admin-btn-sm">
            {t.customers.search}
          </button>
          {q || providerFilter !== "all" ? (
            <Link
              href="/admin/customers"
              className="admin-btn secondary admin-btn-sm"
            >
              {t.customers.clearSearch}
            </Link>
          ) : null}
        </form>

        {unlinkedOrders > 0 ? (
          <form action={syncGuestCustomersAction}>
            <input type="hidden" name="returnQ" value={q} />
            <button type="submit" className="admin-btn admin-btn-sm">
              {t.customers.syncGuests.replace("{n}", String(unlinkedOrders))}
            </button>
          </form>
        ) : null}

        <span style={{ fontSize: 13, opacity: 0.7 }}>
          {t.customers.count
            .replace("{shown}", String(filtered.length))
            .replace("{total}", String(customers.length))}
        </span>
        {deleted ? (
          <span className="admin-products-saved">{t.customers.deleted}</span>
        ) : null}
        {synced != null ? (
          <span className="admin-products-saved">
            {t.customers.synced
              .replace("{linked}", synced)
              .replace("{scanned}", scanned || synced)}
          </span>
        ) : null}
      </div>

      <div className="admin-card admin-customers-card">
        <table className="admin-table admin-customers-table">
          <thead>
            <tr>
              <th className="admin-customers-num">{t.customers.colNum}</th>
              <th>{t.common.name}</th>
              <th>{t.customers.email}</th>
              <th>{t.customers.phone}</th>
              <th>{t.customers.address}</th>
              <th>{t.customers.provider}</th>
              <th>{t.customers.orders}</th>
              <th>{t.customers.joined}</th>
              <th>{t.customers.lastOrder}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 24, opacity: 0.7 }}>
                  {customers.length === 0
                    ? t.customers.empty
                    : t.customers.emptyFilter}
                </td>
              </tr>
            ) : (
              filtered.map((c, index) => {
                const address =
                  c.address ||
                  (c.orders[0]?.address && c.orders[0].address !== "—"
                    ? c.orders[0].address
                    : null);
                const lastOrderAt = c.orders[0]?.createdAt ?? null;
                return (
                  <tr key={c.id}>
                    <td className="admin-customers-num">
                      <span
                        className="admin-customers-index"
                        title={`${index + 1} / ${filtered.length}`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <strong>{c.name || "—"}</strong>
                    </td>
                    <td className="admin-customers-mono">
                      {c.email || "—"}
                    </td>
                    <td className="admin-customers-mono">
                      {c.phone || "—"}
                    </td>
                    <td
                      className="admin-customers-address"
                      title={address || undefined}
                    >
                      {shortAddress(address) || "—"}
                    </td>
                    <td>
                      <span style={{ textTransform: "capitalize" }}>
                        {c.provider === "guest"
                          ? t.customers.providerGuest
                          : c.provider}
                      </span>
                    </td>
                    <td>
                      {c._count.orders > 0 ? (
                        <span
                          style={{ fontWeight: 600 }}
                          title={t.customers.ordersHint}
                        >
                          {c._count.orders}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>0</span>
                      )}
                    </td>
                    <td className="admin-customers-date">
                      {formatWhen(c.createdAt, locale)}
                    </td>
                    <td className="admin-customers-date">
                      {lastOrderAt ? formatWhen(lastOrderAt, locale) : "—"}
                    </td>
                    <td className="admin-customers-actions">
                      <Link
                        href={`/admin/customers/${c.id}${returnQs}`}
                        className="admin-btn secondary admin-btn-sm"
                      >
                        {t.customers.open}
                      </Link>
                      <form action={deleteCustomerAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="returnQ" value={q} />
                        <button
                          type="submit"
                          className="admin-btn secondary admin-btn-sm"
                        >
                          {t.common.delete}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
