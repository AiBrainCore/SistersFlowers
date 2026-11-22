import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliveryBookingStatusLabel,
  shopOrderStatusLabel,
} from "@/lib/payments/order-status-labels";

describe("order status labels", () => {
  it("uses Vietnamese by default for delivery booking", () => {
    assert.match(
      deliveryBookingStatusLabel("awaiting_arrangement", "vi"),
      /sắp xếp/i,
    );
    assert.equal(
      deliveryBookingStatusLabel("in_transit", "en"),
      "In transit",
    );
  });

  it("labels shop confirmed clearly", () => {
    assert.match(shopOrderStatusLabel("confirmed", "vi"), /xác nhận/i);
    assert.match(shopOrderStatusLabel("confirmed", "en"), /confirmed/i);
  });
});
