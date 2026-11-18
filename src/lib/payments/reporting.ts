import { prisma } from "@/lib/db";

export type PaymentsReportRow = {
  reference: string;
  source: string;
  city: string;
  branch: string;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string;
  productsRevenue: number;
  deliveryFeeCustomer: number;
  courierActualCost: number;
  deliveryMargin: number;
  orderTotal: number;
  receivingAccount: string;
};

export async function buildPaymentsReport(input?: {
  citySlug?: string | null;
  from?: Date | null;
  to?: Date | null;
}): Promise<PaymentsReportRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      ...(input?.from || input?.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
      ...(input?.citySlug
        ? { branch: { city: { slug: input.citySlug } } }
        : {}),
    },
    include: {
      branch: { include: { city: true } },
      deliveryBooking: true,
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  return orders.map((o) => {
    const customerFee = o.deliveryFee ?? o.deliveryBooking?.customerFee ?? 0;
    const actual = o.deliveryBooking?.actualCost ?? 0;
    let account = "";
    const snap = o.paymentIntents[0]?.accountSnapshot;
    if (snap) {
      try {
        const parsed = JSON.parse(snap) as {
          bankName?: string;
          accountNumber?: string;
        };
        account = [parsed.bankName, parsed.accountNumber]
          .filter(Boolean)
          .join(" ");
      } catch {
        account = "";
      }
    }
    return {
      reference: o.reference,
      source: o.source,
      city: o.branch?.city.nameEn || "",
      branch: o.branch?.nameEn || "",
      createdAt: o.createdAt.toISOString(),
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || "",
      productsRevenue: o.subtotal,
      deliveryFeeCustomer: customerFee,
      courierActualCost: actual,
      deliveryMargin: customerFee - actual,
      orderTotal: o.deliveryTotal,
      receivingAccount: account,
    };
  });
}

export function paymentsReportToCsv(rows: PaymentsReportRow[]) {
  const header = [
    "reference",
    "source",
    "city",
    "branch",
    "createdAt",
    "paymentStatus",
    "paymentMethod",
    "productsRevenue",
    "deliveryFeeCustomer",
    "courierActualCost",
    "deliveryMargin",
    "orderTotal",
    "receivingAccount",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.reference,
        r.source,
        r.city,
        r.branch,
        r.createdAt,
        r.paymentStatus,
        r.paymentMethod,
        r.productsRevenue,
        r.deliveryFeeCustomer,
        r.courierActualCost,
        r.deliveryMargin,
        r.orderTotal,
        r.receivingAccount,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
  }
  return lines.join("\n");
}

/** Only count paid/deposit as received revenue in summaries. */
export function summarizePaidRevenue(rows: PaymentsReportRow[]) {
  const paid = rows.filter((r) =>
    ["paid", "deposit"].includes(r.paymentStatus),
  );
  return {
    orderCount: paid.length,
    productsRevenue: paid.reduce((s, r) => s + r.productsRevenue, 0),
    deliveryFees: paid.reduce((s, r) => s + r.deliveryFeeCustomer, 0),
    courierCosts: paid.reduce((s, r) => s + r.courierActualCost, 0),
    deliveryMargin: paid.reduce((s, r) => s + r.deliveryMargin, 0),
    gross: paid.reduce((s, r) => s + r.orderTotal, 0),
  };
}
