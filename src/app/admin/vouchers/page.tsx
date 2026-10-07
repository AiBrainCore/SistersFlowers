import { AdminShell } from "@/app/admin/_shell";
import { redeemVoucherAdminAction } from "@/app/admin/actions";
import { formatVnd } from "@/data/products";
import { listVouchers } from "@/lib/vouchers";

export default async function AdminVouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ redeemed?: string; error?: string }>;
}) {
  const vouchers = await listVouchers();
  const { redeemed, error } = await searchParams;

  return (
    <AdminShell title="Vouchers">
      {redeemed ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>
          Voucher marked as used. Remit the partner amount when you settle.
        </p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>
          Could not redeem ({error}).
        </p>
      ) : null}

      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 720, lineHeight: 1.7 }}>
        Money vouchers issued at checkout. Partner checks codes at{" "}
        <a href="/voucher" target="_blank" rel="noreferrer">
          /voucher
        </a>
        . After redeem, pay partner{" "}
        <strong>face value − commission %</strong> (shown as Remit).
      </p>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden", marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Partner / value</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Settle</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, opacity: 0.7 }}>
                  No vouchers yet. They appear when an order includes a partner
                  money voucher.
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong style={{ fontFamily: "ui-monospace, monospace" }}>
                      {v.code}
                    </strong>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      Order {v.orderReference}
                    </div>
                    {v.expiresAt ? (
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        Until {v.expiresAt.toISOString().slice(0, 10)}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {v.name}
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {v.partnerName || "—"}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Face {formatVnd(v.faceValue, "en")}
                    </div>
                  </td>
                  <td>
                    {v.customerName}
                    <div style={{ fontSize: 12 }}>{v.phone}</div>
                  </td>
                  <td>
                    <strong
                      style={{
                        color:
                          v.status === "issued"
                            ? "#5c6b52"
                            : v.status === "redeemed"
                              ? "#8b3a3a"
                              : "#8a6a2b",
                      }}
                    >
                      {v.status}
                    </strong>
                    {v.redeemedAt ? (
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {v.redeemedAt.toLocaleString()}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      Remit{" "}
                      <strong>
                        {formatVnd(
                          v.remitAmount ??
                            Math.max(
                              0,
                              v.faceValue -
                                Math.round(
                                  (v.faceValue * (v.commissionPercent ?? 0)) /
                                    100,
                                ),
                            ),
                          "en",
                        )}
                      </strong>
                    </div>
                    {v.commissionPercent != null && v.commissionPercent > 0 ? (
                      <div style={{ fontSize: 11, opacity: 0.65 }}>
                        Sisters {v.commissionPercent}%
                        {v.commissionAmount != null
                          ? ` (~${formatVnd(v.commissionAmount, "en")})`
                          : ""}
                      </div>
                    ) : null}
                    {v.status === "issued" ? (
                      <form action={redeemVoucherAdminAction} style={{ marginTop: 8 }}>
                        <input type="hidden" name="code" value={v.code} />
                        <button type="submit" className="admin-btn secondary">
                          Mark used
                        </button>
                      </form>
                    ) : null}
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
