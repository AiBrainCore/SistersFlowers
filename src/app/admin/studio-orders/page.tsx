import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  advanceStudioOrderAction,
  markStudioPaymentAction,
} from "@/app/admin/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import { remainAmount, STUDIO_NEXT } from "@/lib/studio-orders";

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function AdminStudioOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t } = await getAdminT();
  const raw = await searchParams;
  const day =
    typeof raw.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.day)
      ? raw.day
      : todayYmd();
  const created =
    typeof raw.created === "string" ? raw.created : "";
  const needPayment = raw.needPayment === "1";

  const orders = await prisma.order.findMany({
    where: {
      source: "studio",
      deliveryDate: day,
    },
    include: {
      items: true,
      branch: { include: { city: true } },
    },
    orderBy: [{ deliveryTime: "asc" }, { createdAt: "asc" }],
  });

  return (
    <AdminShell title={t.studio.title}>
      <p style={{ maxWidth: 640, opacity: 0.8, marginTop: 0 }}>{t.studio.intro}</p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Link href="/admin/studio-orders/new" className="admin-btn">
          {t.studio.new}
        </Link>
        <form method="get" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13 }}>
            {t.studio.date}{" "}
            <input type="date" name="day" defaultValue={day} />
          </label>
          <button type="submit" className="admin-btn secondary">
            {t.studio.list}
          </button>
        </form>
      </div>

      {created ? (
        <p style={{ color: "#5c6b52" }}>
          {t.studio.created} <strong>{created}</strong>
        </p>
      ) : null}
      {needPayment ? (
        <p style={{ color: "#a34b2e" }}>{t.studio.needPayment}</p>
      ) : null}

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.studio.saleCode}</th>
              <th>{t.studio.branch}</th>
              <th>{t.studio.customer}</th>
              <th>{t.orders.items}</th>
              <th>{t.orders.total}</th>
              <th>{t.studio.payment}</th>
              <th>{t.common.status}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, opacity: 0.7 }}>
                  {t.studio.empty}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const remain = remainAmount(order);
                const next =
                  STUDIO_NEXT[
                    order.status as keyof typeof STUDIO_NEXT
                  ];
                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.saleCode || order.reference}</strong>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {order.deliveryTime || "—"} · {order.fulfillment}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {order.branch
                        ? locale === "vi"
                          ? order.branch.nameVi
                          : order.branch.nameEn
                        : "—"}
                    </td>
                    <td>
                      {order.customerName}
                      <div style={{ fontSize: 12 }}>{order.phone}</div>
                      {order.recipientName ? (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          → {order.recipientName}
                          {order.recipientPhone ? ` · ${order.recipientPhone}` : ""}
                        </div>
                      ) : null}
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{order.address}</div>
                    </td>
                    <td>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ fontSize: 13 }}>
                          {item.qty}× {item.name}
                        </div>
                      ))}
                      {order.cardMessage ? (
                        <div style={{ fontSize: 11, fontStyle: "italic", opacity: 0.7 }}>
                          “{order.cardMessage}”
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {formatVnd(order.deliveryTotal, locale)}
                      {remain > 0 ? (
                        <div style={{ fontSize: 11, opacity: 0.7 }}>
                          {t.studio.remain} {formatVnd(remain, locale)}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{order.paymentStatus}</div>
                      {order.paymentStatus === "unpaid" ? (
                        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                          <form action={markStudioPaymentAction}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="day" value={day} />
                            <input type="hidden" name="mode" value="deposit" />
                            <button type="submit" className="admin-btn secondary">
                              {t.studio.markDeposit}
                            </button>
                          </form>
                          <form action={markStudioPaymentAction}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="day" value={day} />
                            <input type="hidden" name="mode" value="paid" />
                            <button type="submit" className="admin-btn secondary">
                              {t.studio.markPaid}
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, marginBottom: 8 }}>{order.status}</div>
                      {next ? (
                        <form action={advanceStudioOrderAction}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="day" value={day} />
                          <button type="submit" className="admin-btn">
                            {t.studio.advance} → {next}
                          </button>
                        </form>
                      ) : null}
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
