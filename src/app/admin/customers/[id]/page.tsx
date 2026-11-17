import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { deleteCustomerAction } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

function formatWhen(date: Date, locale: string) {
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="admin-customer-field">
      <div className="admin-customer-field-label">{label}</div>
      <div className="admin-customer-field-value">{value || "—"}</div>
    </div>
  );
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnQ?: string; returnProvider?: string }>;
}) {
  const [{ id }, sp, { locale, t }] = await Promise.all([
    params,
    searchParams || Promise.resolve({}),
    getAdminT(),
  ]);
  const returnQ = (sp as { returnQ?: string }).returnQ || "";
  const returnProvider =
    (sp as { returnProvider?: string }).returnProvider || "";

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          reference: true,
          saleCode: true,
          source: true,
          status: true,
          address: true,
          phone: true,
          email: true,
          customerName: true,
          subtotal: true,
          deliveryTotal: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const backParams = new URLSearchParams();
  if (returnQ) backParams.set("q", returnQ);
  if (returnProvider && returnProvider !== "all") {
    backParams.set("provider", returnProvider);
  }
  const backQs = backParams.toString();
  const backHref = `/admin/customers${backQs ? `?${backQs}` : ""}`;

  const providerLabel =
    customer.provider === "guest"
      ? t.customers.providerGuest
      : customer.provider;

  return (
    <AdminShell title={`${t.customers.detailTitle}: ${customer.name || "—"}`}>
      <div className="admin-customer-detail-top">
        <Link href={backHref} className="admin-btn secondary admin-btn-sm">
          {t.common.backToList}
        </Link>
        <form action={deleteCustomerAction}>
          <input type="hidden" name="id" value={customer.id} />
          <input type="hidden" name="returnQ" value={returnQ} />
          <button type="submit" className="admin-btn secondary admin-btn-sm">
            {t.common.delete}
          </button>
        </form>
      </div>

      <div className="admin-card admin-customer-card">
        <div className="admin-customer-grid">
          <Field label={t.common.name} value={customer.name} />
          <Field label={t.customers.email} value={customer.email} />
          <Field label={t.customers.phone} value={customer.phone} />
          <Field label={t.customers.address} value={customer.address} />
          <Field label={t.customers.provider} value={providerLabel} />
          <Field label={t.customers.locale} value={customer.preferredLocale} />
          <Field label={t.customers.zaloId} value={customer.zaloId} />
          <Field label={t.customers.authId} value={customer.authUserId} />
          <Field
            label={t.customers.joined}
            value={formatWhen(customer.createdAt, locale)}
          />
          <Field
            label={t.customers.updated}
            value={formatWhen(customer.updatedAt, locale)}
          />
          <Field
            label={t.customers.verified}
            value={
              customer.emailVerifiedAt
                ? formatWhen(customer.emailVerifiedAt, locale)
                : customer.authUserId
                  ? t.customers.unverified
                  : "—"
            }
          />
          <Field
            label={t.customers.orders}
            value={String(customer.orders.length)}
          />
        </div>
      </div>

      <h2 className="admin-customer-orders-title">{t.customers.linkedOrders}</h2>
      <div className="admin-card admin-customers-card">
        {customer.orders.length === 0 ? (
          <p style={{ padding: 20, opacity: 0.7, margin: 0 }}>
            {t.customers.noOrders}
          </p>
        ) : (
          <table className="admin-table admin-customers-table">
            <thead>
              <tr>
                <th>{t.customers.colNum}</th>
                <th>Ref</th>
                <th>{t.common.status}</th>
                <th>{t.customers.phone}</th>
                <th>{t.customers.email}</th>
                <th>{t.customers.address}</th>
                <th>{t.common.price}</th>
                <th>{t.customers.joined}</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order, index) => (
                <tr key={order.id}>
                  <td className="admin-customers-num">{index + 1}</td>
                  <td className="admin-customers-mono">
                    {order.saleCode || order.reference}
                    <div style={{ fontSize: 11, opacity: 0.55 }}>
                      {order.source}
                    </div>
                  </td>
                  <td>{order.status}</td>
                  <td className="admin-customers-mono">{order.phone}</td>
                  <td className="admin-customers-mono">{order.email || "—"}</td>
                  <td
                    className="admin-customers-address"
                    title={order.address || undefined}
                  >
                    {order.address || "—"}
                  </td>
                  <td className="admin-customers-mono">
                    đ{order.deliveryTotal.toLocaleString("vi-VN")}
                  </td>
                  <td className="admin-customers-date">
                    {formatWhen(order.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
