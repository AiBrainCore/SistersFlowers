import { AdminShell } from "@/app/admin/_shell";
import { redeemVoucherAdminAction } from "@/app/admin/actions";
import { formatVnd } from "@/data/products";
import { listVouchers } from "@/lib/vouchers";
import { getAdminT } from "@/lib/admin-locale";

export default async function AdminVouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ redeemed?: string; error?: string }>;
}) {
  const vouchers = await listVouchers();
  const { redeemed, error } = await searchParams;
  const { locale, t } = await getAdminT();

  return (
    <AdminShell title={t.vouchers.title}>
      {redeemed ? (
        <p style={{ marginBottom: 16, color: "#5c6b52" }}>
          {t.vouchers.redeemedOk}
        </p>
      ) : null}
      {error ? (
        <p style={{ marginBottom: 16, color: "#8b3a3a" }}>
          {t.vouchers.redeemError} ({error}).
        </p>
      ) : null}

      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 720, lineHeight: 1.7 }}>
        {t.vouchers.intro}{" "}
        <a href="/voucher" target="_blank" rel="noreferrer">
          /voucher
        </a>
      </p>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden", marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.vouchers.code}</th>
              <th>{t.vouchers.partnerValue}</th>
              <th>{t.vouchers.customer}</th>
              <th>{t.common.status}</th>
              <th>{t.vouchers.settle}</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, opacity: 0.7 }}>
                  {t.vouchers.empty}
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
                      {t.vouchers.order} {v.orderReference}
                    </div>
                    {v.expiresAt ? (
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {t.vouchers.until} {v.expiresAt.toISOString().slice(0, 10)}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {v.name}
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {v.partnerName || "—"}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {t.vouchers.face} {formatVnd(v.faceValue, locale)}
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
                        {v.redeemedAt.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {t.vouchers.remit}{" "}
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
                          locale,
                        )}
                      </strong>
                    </div>
                    {v.commissionPercent != null && v.commissionPercent > 0 ? (
                      <div style={{ fontSize: 11, opacity: 0.65 }}>
                        Sisters {v.commissionPercent}%
                        {v.commissionAmount != null
                          ? ` (~${formatVnd(v.commissionAmount, locale)})`
                          : ""}
                      </div>
                    ) : null}
                    {v.status === "issued" ? (
                      <form action={redeemVoucherAdminAction} style={{ marginTop: 8 }}>
                        <input type="hidden" name="code" value={v.code} />
                        <button type="submit" className="admin-btn secondary">
                          {t.vouchers.markUsed}
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
