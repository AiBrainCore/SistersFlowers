import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checklistComplete, CHECKLIST_FIELDS } from "@/lib/payments/checklist";
import { paymentsReportToCsv, summarizePaidRevenue } from "@/lib/payments/reporting";

describe("checklist", () => {
  it("requires every field", () => {
    const partial = Object.fromEntries(
      CHECKLIST_FIELDS.map((f) => [f, f !== "readyForHandoff"]),
    );
    assert.equal(checklistComplete(partial), false);
    const full = Object.fromEntries(CHECKLIST_FIELDS.map((f) => [f, true]));
    assert.equal(checklistComplete(full), true);
  });
});

describe("reporting", () => {
  it("excludes unpaid from paid summary and exports csv", () => {
    const rows = [
      {
        reference: "A",
        source: "shop",
        city: "Da Lat",
        branch: "Main",
        createdAt: "2026-11-18",
        paymentStatus: "paid",
        paymentMethod: "vietqr",
        productsRevenue: 100000,
        deliveryFeeCustomer: 30000,
        courierActualCost: 25000,
        deliveryMargin: 5000,
        orderTotal: 130000,
        receivingAccount: "VietinBank",
      },
      {
        reference: "B",
        source: "shop",
        city: "Da Lat",
        branch: "Main",
        createdAt: "2026-11-18",
        paymentStatus: "pending",
        paymentMethod: "vietqr",
        productsRevenue: 200000,
        deliveryFeeCustomer: 0,
        courierActualCost: 0,
        deliveryMargin: 0,
        orderTotal: 200000,
        receivingAccount: "",
      },
    ];
    const summary = summarizePaidRevenue(rows);
    assert.equal(summary.orderCount, 1);
    assert.equal(summary.gross, 130000);
    const csv = paymentsReportToCsv(rows);
    assert.match(csv, /reference/);
    assert.match(csv, /"A"/);
  });
});
