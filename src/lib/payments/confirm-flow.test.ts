import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pure rules mirrored from confirm-flow (no DB). Keep in sync with
 * ADVANCE_ON_PAID in confirm-flow.ts.
 */
const ADVANCE_ON_PAID = new Set(["new", "awaiting_payment"]);

function nextFulfillment(status: string) {
  return ADVANCE_ON_PAID.has(status) ? "confirmed" : status;
}

describe("payment confirm → production advance", () => {
  it("advances new and awaiting_payment to confirmed", () => {
    assert.equal(nextFulfillment("new"), "confirmed");
    assert.equal(nextFulfillment("awaiting_payment"), "confirmed");
  });

  it("does not move quote / preparing / pickup queues", () => {
    assert.equal(
      nextFulfillment("awaiting_delivery_quote"),
      "awaiting_delivery_quote",
    );
    assert.equal(nextFulfillment("preparing"), "preparing");
    assert.equal(nextFulfillment("ready_for_pickup"), "ready_for_pickup");
  });
});
