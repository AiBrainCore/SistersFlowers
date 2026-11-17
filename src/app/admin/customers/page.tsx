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
    },
  });

  const qFold = fold(q);
  const filtered = customers.filter((c) => {
    if (providerFilter !== "all" && c.provider !== providerFilter) return false;
    if (!qFold) return true;
    return fold(
      [c.name || "", c.email || "", c.phone || "", c.provider, c.zaloId || ""].join(
        " ",
      ),
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        <form method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.customers.searchPlaceholder}
            style={{ minWidth: 220 }}
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
            <Link href="/admin/customers" className="admin-btn secondary admin-btn-sm">
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

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.common.name}</th>
              <th>{t.customers.contact}</th>
              <th>{t.customers.provider}</th>
              <th>{t.customers.orders}</th>
              <th>{t.customers.joined}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, opacity: 0.7 }}>
                  {customers.length === 0 ? t.customers.empty : t.customers.emptyFilter}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name || "—"}</strong>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.55,
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      {c.id.slice(0, 10)}…
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.email || "—"}</div>
                    {c.phone ? (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{c.phone}</div>
                    ) : null}
                    {c.zaloId ? (
                      <div style={{ fontSize: 11, opacity: 0.55 }}>
                        Zalo · {c.zaloId.slice(0, 12)}…
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span style={{ textTransform: "capitalize" }}>
                      {c.provider === "guest"
                        ? t.customers.providerGuest
                        : c.provider}
                    </span>
                    {c.emailVerifiedAt ? (
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {t.customers.verified}
                      </div>
                    ) : c.authUserId ? (
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {t.customers.unverified}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {c._count.orders > 0 ? (
                      <span style={{ fontWeight: 600 }} title={t.customers.ordersHint}>
                        {c._count.orders}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>0</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {c.createdAt.toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-GB",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}
                  </td>
                  <td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
