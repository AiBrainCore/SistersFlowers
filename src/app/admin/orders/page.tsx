import { AdminShell } from "@/app/admin/_shell";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Orders">
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, opacity: 0.7 }}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.reference}</strong>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {order.createdAt.toLocaleString()}
                    </div>
                    {order.whatsappUrl ? (
                      <a href={order.whatsappUrl} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                    ) : null}
                  </td>
                  <td>
                    {order.customerName}
                    <div style={{ fontSize: 12 }}>{order.phone}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{order.address}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {order.zone}
                      {order.deliveryKm != null ? ` · ${order.deliveryKm} km` : ""}
                      {order.deliveryFee != null
                        ? ` · ${formatVnd(order.deliveryFee, "en")}`
                        : ""}
                    </div>
                  </td>
                  <td>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ fontSize: 13, marginBottom: 6 }}>
                        {item.qty}× {item.name}
                        {item.kind !== "product" ? (
                          <span style={{ opacity: 0.6 }}> · {item.kind}</span>
                        ) : null}
                        {item.partnerName ? (
                          <div style={{ fontSize: 11, opacity: 0.7 }}>
                            Partner: {item.partnerName}
                          </div>
                        ) : null}
                        {item.voucherCode ? (
                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: "ui-monospace, monospace",
                              marginTop: 2,
                            }}
                          >
                            {item.voucherCode}
                            {item.voucherStatus ? ` · ${item.voucherStatus}` : ""}
                          </div>
                        ) : null}
                        {item.commissionAmount != null && item.commissionAmount > 0 ? (
                          <div style={{ fontSize: 11, color: "#5c6b52" }}>
                            Sisters commission ~{formatVnd(item.commissionAmount, "en")}
                            {item.commissionPercent != null
                              ? ` (${item.commissionPercent}%)`
                              : ""}
                            {item.remitAmount != null
                              ? ` · remit ${formatVnd(item.remitAmount, "en")}`
                              : ""}
                          </div>
                        ) : null}
                        {item.note ? (
                          <div style={{ fontSize: 11, fontStyle: "italic", opacity: 0.7 }}>
                            “{item.note}”
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </td>
                  <td>{formatVnd(order.subtotal, "en")}</td>
                  <td>
                    <form action={updateOrderStatusAction}>
                      <input type="hidden" name="id" value={order.id} />
                      <select name="status" defaultValue={order.status}>
                        <option value="new">new</option>
                        <option value="confirmed">confirmed</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button type="submit" className="admin-btn secondary" style={{ marginTop: 8 }}>
                        Update
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
