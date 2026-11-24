import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVietQrImageUrl,
  vietQrTransferContent,
} from "@/lib/payments/vietqr";
import { buildOrderReceipt } from "@/lib/payments/receipt";
import { PAYMENT_METHODS } from "@/lib/payments/methods";

describe("vietqr", () => {
  it("builds integer amount QR url without cart payload", () => {
    const url = buildVietQrImageUrl({
      account: {
        bankCode: "970415",
        accountNumber: "0123456789",
        accountName: "SISTERS FLOWERS",
      },
      amount: 350_000.7,
      addInfo: "SFABC12345",
    });
    assert.match(url, /amount=350001/);
    assert.match(url, /970415-0123456789/);
    assert.doesNotMatch(url, /bouquet|address|recipient/i);
  });

  it("shortens transfer content", () => {
    const ref = vietQrTransferContent("SF-ORDER-ABCDEFGH1234");
    assert.equal(ref.startsWith("SF"), true);
    assert.ok(ref.length <= 25);
  });
});

describe("payment methods catalog", () => {
  it("keeps coming-soon stubs non-default-live", () => {
    const stubs = PAYMENT_METHODS.filter((m) => m.provider === "stub");
    assert.ok(stubs.length >= 4);
    for (const s of stubs) {
      assert.equal(s.defaultComingSoon, true);
      assert.equal(s.defaultEnabled, false);
    }
  });

  it("defaults VietQR + cash at pickup on; COD off online", () => {
    for (const id of ["vietqr", "cash_pickup"] as const) {
      const m = PAYMENT_METHODS.find((row) => row.id === id);
      assert.ok(m, id);
      assert.equal(m!.defaultEnabled, true);
      assert.equal(m!.defaultComingSoon, false);
    }
    const cod = PAYMENT_METHODS.find((row) => row.id === "cod");
    assert.ok(cod);
    assert.equal(cod!.defaultEnabled, false);
  });

  it("whatsapp stays off — chat is not a checkout payment method", () => {
    const wa = PAYMENT_METHODS.find((m) => m.id === "whatsapp");
    assert.ok(wa);
    assert.equal(wa!.defaultEnabled, false);
  });
});

describe("receipt", () => {
  it("marks confirmation as not legal e-invoice", () => {
    const receipt = buildOrderReceipt({
      orderNumber: "SF1",
      createdAt: new Date("2026-11-18T00:00:00Z"),
      customerName: "Test",
      paymentStatus: "paid",
      lines: [{ name: "Bouquet", qty: 1, price: 100000 }],
      subtotal: 100000,
      deliveryFee: 30000,
      total: 130000,
    });
    assert.equal(receipt.isLegalEInvoice, false);
    assert.equal(receipt.kind, "order_confirmation");
    assert.equal(receipt.total, 130000);
  });
});
