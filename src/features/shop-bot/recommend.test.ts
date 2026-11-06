import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { occasionToCategorySlug, rankBotProducts } from "./recommend";
import { parseShopBotParams } from "./params";
import {
  createInitialShopBotState,
  selectBudget,
  selectIntent,
  shopBotBack,
} from "./machine";
import type { BotProduct } from "./types";

function product(
  partial: Partial<BotProduct> & Pick<BotProduct, "id" | "slug" | "priceVnd">,
): BotProduct {
  return {
    name: partial.name || partial.slug,
    imageUrl: null,
    available: true,
    productUrl: `/en/shop/${partial.slug}`,
    tag: "",
    ...partial,
  };
}

describe("occasionToCategorySlug", () => {
  it("maps reliable occasions only", () => {
    assert.equal(occasionToCategorySlug("birthday"), "birthday");
    assert.equal(occasionToCategorySlug("love"), "romance");
    assert.equal(occasionToCategorySlug("apology"), undefined);
  });
});

describe("rankBotProducts", () => {
  const catalog = [
    product({ id: "a", slug: "a", priceVnd: 280_000, tag: "birthday" }),
    product({ id: "b", slug: "b", priceVnd: 320_000, tag: "romance" }),
    product({ id: "c", slug: "c", priceVnd: 450_000, tag: "birthday" }),
    product({ id: "d", slug: "d", priceVnd: 190_000, tag: "graduation" }),
  ];

  it("never returns items over budget", () => {
    const result = rankBotProducts({
      products: catalog,
      budgetMaxVnd: 300_000,
      limit: 3,
    });
    assert.ok(result.items.every((p) => p.priceVnd <= 300_000));
    assert.equal(result.items.length, 2);
  });

  it("relaxes occasion when no match under budget", () => {
    const result = rankBotProducts({
      products: catalog,
      budgetMaxVnd: 300_000,
      occasionCategorySlug: "wedding",
      limit: 3,
    });
    assert.equal(result.filtersRelaxed, true);
    assert.ok(result.items.length > 0);
  });

  it("returns empty when nothing fits budget", () => {
    const result = rankBotProducts({
      products: catalog,
      budgetMaxVnd: 100_000,
    });
    assert.deepEqual(result.items, []);
  });

  it("is deterministic", () => {
    const a = rankBotProducts({ products: catalog, budgetMaxVnd: 500_000 });
    const b = rankBotProducts({ products: catalog, budgetMaxVnd: 500_000 });
    assert.deepEqual(
      a.items.map((p) => p.id),
      b.items.map((p) => p.id),
    );
  });
});

describe("parseShopBotParams", () => {
  it("whitelists deep link values", () => {
    const parsed = parseShopBotParams({
      intent: "hotel",
      occasion: "sinh-nhat",
      budget: "300000",
      source: "zalo",
      phone: "0901234567",
    });
    assert.equal(parsed.intent, "hotel");
    assert.equal(parsed.occasion, "birthday");
    assert.equal(parsed.budgetMaxVnd, 300_000);
    assert.equal(parsed.source, "zalo");
    assert.equal(parsed.open, true);
    assert.deepEqual(Object.keys(parsed).sort(), [
      "budgetMaxVnd",
      "intent",
      "occasion",
      "open",
      "source",
    ]);
  });

  it("ignores malformed budget", () => {
    const parsed = parseShopBotParams({ budget: "abc" });
    assert.equal(parsed.budgetMaxVnd, undefined);
  });
});

describe("shop bot machine", () => {
  it("skips to recommendations for browse", () => {
    let state = createInitialShopBotState("en");
    state = selectIntent(state, "browse");
    assert.equal(state.step, "recommendations");
  });

  it("supports back from budget to occasion", () => {
    let state = createInitialShopBotState("vi", { intent: "gift" });
    state = selectBudget(state, 300_000);
    assert.equal(state.step, "recommendations");
    state = shopBotBack(state);
    assert.equal(state.step, "budget");
  });
});
