import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHECKOUT_TEST_PRODUCT_PRICE_VND,
  CHECKOUT_TEST_PRODUCT_SKU,
  CHECKOUT_TEST_PRODUCT_SLUG,
  isCheckoutTestProductSlug,
} from "@/lib/checkout-test-product";

describe("checkout-test-product", () => {
  it("uses 1,000₫ (not 1₫) so bank apps accept the transfer", () => {
    assert.equal(CHECKOUT_TEST_PRODUCT_PRICE_VND, 1_000);
    assert.ok(CHECKOUT_TEST_PRODUCT_PRICE_VND >= 1_000);
  });

  it("keeps a stable slug and SKU for admin toggle", () => {
    assert.equal(CHECKOUT_TEST_PRODUCT_SLUG, "sf-checkout-test");
    assert.equal(CHECKOUT_TEST_PRODUCT_SKU, "SF-TEST");
    assert.equal(isCheckoutTestProductSlug("sf-checkout-test"), true);
    assert.equal(isCheckoutTestProductSlug("SF-Checkout-Test"), true);
    assert.equal(isCheckoutTestProductSlug("rose-bouquet"), false);
  });
});
