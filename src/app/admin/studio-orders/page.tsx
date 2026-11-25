import Link from "next/link";
import { AdminShell } from "@/app/admin/_shell";
import {
  advanceStudioOrderAction,
  markStudioPaymentAction,
} from "@/app/admin/actions";
import { formatVnd } from "@/data/products";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";
import {
  remainAmount,
  STUDIO_NEXT,
  STUDIO_STATUSES,
  type StudioStatus,
} from "@/lib/studio-orders";

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function isYmd(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isStudioStatus(value: string): value is StudioStatus {
  return (STUDIO_STATUSES as readonly string[]).includes(value);
}

function studioStatusLabel(status: string, locale: "en" | "vi") {
  const map: Record<string, { en: string; vi: string }> = {
    new: { en: "New", vi: "Mới" },
    making: { en: "Making", vi: "Đang làm" },
    ready: { en: "Ready", vi: "Sẵn sàng" },
    delivered: { en: "Delivered", vi: "Đã giao" },
    cancelled: { en: "Cancelled", vi: "Huỷ" },
  };
  const row = map[status];
  if (!row) return status;
  return locale === "vi" ? row.vi : row.en;
}

function paymentLabel(
  status: string,
  t: {
    unpaid: string;
    deposit: string;
    paid: string;
    cod: string;
  },
) {
  if (status === "paid") return t.paid;
  if (status === "deposit") return t.deposit;
  if (status === "cod") return t.cod;
  return t.unpaid;
}

export default async function AdminStudioOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t } = await getAdminT();
  const loc = locale === "en" ? "en" : "vi";
  const raw = await searchParams;

  const dayRaw = typeof raw.day === "string" ? raw.day.trim() : "";
  /** Empty / "all" = show every studio order (WooCommerce-style list). */
  const dayFilter =
    dayRaw === "" || dayRaw === "all"
      ? null
      : isYmd(dayRaw)
        ? dayRaw
        : null;

  const statusRaw = typeof raw.status === "string" ? raw.status.trim() : "";
  const statusFilter =
    statusRaw === "" || statusRaw === "all"
      ? null
      : isStudioStatus(statusRaw)
        ? statusRaw
        : null;

  const created = typeof raw.created === "string" ? raw.created : "";
  const needPayment = raw.needPayment === "1";

  const returnDay = dayFilter || "";
  const returnStatus = statusFilter || "";

  const orders = await prisma.order.findMany({
    where: {
      source: "studio",
      ...(dayFilter ? { deliveryDate: dayFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      items: true,
      media: { orderBy: { sortOrder: "asc" }, take: 3 },
      branch: { include: { city: true } },
    },
    orderBy: [
      { deliveryDate: "asc" },
      { deliveryTime: "asc" },
      { createdAt: "desc" },
    ],
    take: 150,
  });

  const statusLinks: { id: string; label: string }[] = [
    { id: "all", label: t.studio.filterAll },
    ...STUDIO_STATUSES.map((s) => ({
      id: s,
      label: studioStatusLabel(s, loc),
    })),
  ];

  function filterHref(next: { day?: string | null; status?: string | null }) {
    const params = new URLSearchParams();
    const d = next.day === undefined ? dayFilter : next.day;
    const s = next.status === undefined ? statusFilter : next.status;
    if (d) params.set("day", d);
    if (s) params.set("status", s);
    const q = params.toString();
    return q ? `/admin/studio-orders?${q}` : "/admin/studio-orders";
  }

  return (
    <AdminShell title={t.studio.title}>
      <p style={{ maxWidth: 640, opacity: 0.8, marginTop: 0 }}>{t.studio.intro}</p>

      <div className="admin-studio-toolbar">
        <Link href="/admin/orders" className="admin-btn secondary">
          {t.orders.title}
        </Link>
        <Link href="/admin/studio-orders/new" className="admin-btn">
          {t.studio.new}
        </Link>
        <form method="get" className="admin-card admin-studio-day">
          {statusFilter ? (
            <input type="hidden" name="status" value={statusFilter} />
          ) : null}
          <label className="admin-field" style={{ marginBottom: 0 }}>
            <span>{t.studio.date}</span>
            <input
              type="date"
              name="day"
              defaultValue={dayFilter || ""}
            />
          </label>
          <button type="submit" className="admin-btn secondary admin-btn-sm">
            {t.studio.filterApply}
          </button>
          <Link
            href={filterHref({ day: todayYmd() })}
            className="admin-btn secondary admin-btn-sm"
          >
            {t.studio.today}
          </Link>
          {dayFilter ? (
            <Link
              href={filterHref({ day: null })}
              className="admin-btn secondary admin-btn-sm"
            >
              {t.studio.filterAllDates}
            </Link>
          ) : null}
        </form>
      </div>

      <div className="admin-studio-status-filters">
        {statusLinks.map((link) => {
          const active =
            (link.id === "all" && !statusFilter) || link.id === statusFilter;
          return (
            <Link
              key={link.id}
              href={filterHref({
                status: link.id === "all" ? null : link.id,
              })}
              className={
                active
                  ? "admin-studio-status-chip on"
                  : "admin-studio-status-chip"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <p className="admin-studio-count">
        {t.studio.showing.replace("{count}", String(orders.length))}
        {dayFilter ? ` · ${dayFilter}` : ` · ${t.studio.filterAllDates}`}
        {statusFilter
          ? ` · ${studioStatusLabel(statusFilter, loc)}`
          : ""}
      </p>

      {created ? (
        <p style={{ color: "#5c6b52" }}>
          {t.studio.created} <strong>{created}</strong>
        </p>
      ) : null}
      {needPayment ? (
        <p style={{ color: "#a34b2e" }}>{t.studio.needPayment}</p>
      ) : null}

      {orders.length === 0 ? (
        <div className="admin-card">
          <p style={{ margin: 0, opacity: 0.75 }}>{t.studio.empty}</p>
        </div>
      ) : (
        <div className="admin-studio-order-list">
          {orders.map((order) => {
            const remain = remainAmount(order);
            const next =
              STUDIO_NEXT[order.status as keyof typeof STUDIO_NEXT];
            const cityName = order.branch?.city
              ? loc === "vi"
                ? order.branch.city.nameVi
                : order.branch.city.nameEn
              : "—";
            const fulfillLabel =
              order.fulfillment === "pickup" ? t.studio.pickup : t.studio.delivery;

            return (
              <article key={order.id} className="admin-card admin-studio-order">
                <header className="admin-studio-order-head">
                  <div>
                    <strong className="admin-studio-order-code">
                      {order.saleCode || order.reference}
                    </strong>
                    <p className="admin-studio-order-when">
                      {order.deliveryDate || "—"}
                      {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
                      {` · ${fulfillLabel}`}
                    </p>
                  </div>
                  <span className="admin-studio-order-city">{cityName}</span>
                </header>

                <dl className="admin-studio-order-facts">
                  <div>
                    <dt>{t.studio.customer}</dt>
                    <dd>{order.customerName || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t.studio.phone}</dt>
                    <dd>{order.phone || "—"}</dd>
                  </div>
                  {(order.recipientName || order.recipientPhone) && (
                    <div>
                      <dt>{t.studio.receiver}</dt>
                      <dd>
                        {[order.recipientName, order.recipientPhone]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  )}
                  {order.fulfillment === "delivery" ? (
                    <div className="admin-studio-order-address">
                      <dt>{t.studio.address}</dt>
                      <dd>{order.address || "—"}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="admin-studio-order-items">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.qty}× {item.name}
                    </div>
                  ))}
                  {order.cardMessage ? (
                    <div className="admin-studio-order-card">
                      {t.studio.card}: “{order.cardMessage}”
                    </div>
                  ) : null}
                </div>

                <div className="admin-studio-order-foot">
                  <div className="admin-studio-order-money">
                    <strong>{formatVnd(order.deliveryTotal, locale)}</strong>
                    {remain > 0 ? (
                      <span>
                        {t.studio.remain} {formatVnd(remain, locale)}
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-studio-order-badges">
                    <span>{paymentLabel(order.paymentStatus, t.studio)}</span>
                    <span>{studioStatusLabel(order.status, loc)}</span>
                  </div>
                </div>

                <div className="admin-studio-order-actions">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="admin-btn secondary admin-btn-sm"
                  >
                    {t.orders.open}
                  </Link>
                  <Link
                    href={`/admin/orders/${order.id}/edit`}
                    className="admin-btn secondary admin-btn-sm"
                  >
                    {t.common.edit}
                  </Link>
                  {order.paymentStatus === "unpaid" ||
                  order.paymentStatus === "deposit" ||
                  order.paymentStatus === "cod" ? (
                    <>
                      {order.paymentStatus === "unpaid" ? (
                        <form action={markStudioPaymentAction}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="day" value={returnDay} />
                          <input
                            type="hidden"
                            name="status"
                            value={returnStatus}
                          />
                          <input type="hidden" name="mode" value="deposit" />
                          <button
                            type="submit"
                            className="admin-btn secondary admin-btn-sm"
                          >
                            {t.studio.markDeposit}
                          </button>
                        </form>
                      ) : null}
                      <form action={markStudioPaymentAction}>
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="day" value={returnDay} />
                        <input type="hidden" name="status" value={returnStatus} />
                        <input type="hidden" name="mode" value="paid" />
                        <button
                          type="submit"
                          className="admin-btn secondary admin-btn-sm"
                        >
                          {t.studio.markPaid}
                        </button>
                      </form>
                    </>
                  ) : null}
                  {next ? (
                    <form action={advanceStudioOrderAction}>
                      <input type="hidden" name="id" value={order.id} />
                      <input type="hidden" name="day" value={returnDay} />
                      <input type="hidden" name="status" value={returnStatus} />
                      <button type="submit" className="admin-btn admin-btn-sm">
                        {t.studio.advance} → {studioStatusLabel(next, loc)}
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
