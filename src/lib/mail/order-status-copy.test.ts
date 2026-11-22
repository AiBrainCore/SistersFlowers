import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderStatusCopy } from "@/lib/mail/copy";

describe("order status customer emails", () => {
  it("has payment_accepted and pickup vs ship ready copy", () => {
    const paid = orderStatusCopy("en", "payment_accepted");
    assert.match(paid.subject("SF1"), /payment received/i);
    assert.match(paid.intro("Ann", "Da Lat"), /full payment|starting your bouquet/i);

    const pickup = orderStatusCopy("en", "ready_pickup");
    assert.match(pickup.subject("SF1"), /pickup/i);
    assert.match(pickup.intro("Ann", "Da Lat"), /collect/i);

    const ship = orderStatusCopy("en", "ready_ship");
    assert.match(ship.subject("SF1"), /deliver/i);
    assert.match(ship.intro("Ann", null), /delivery/i);

    const paidVi = orderStatusCopy("vi", "payment_accepted");
    assert.match(paidVi.heading, /thanh toán/i);
    const pickupVi = orderStatusCopy("vi", "ready_pickup");
    assert.match(pickupVi.intro("An", "Đà Lạt"), /nhận/i);
  });
});
