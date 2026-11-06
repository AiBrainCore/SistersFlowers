"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd, type Product } from "@/data/products";
import { useCart } from "@/context/cart-context";
import type { AddonPublic } from "@/lib/addons";
import {
  recommendShopBotAction,
  listShopBotAddonsAction,
} from "@/app/actions/shop-bot";
import { trackShopBotEvent } from "@/features/shop-bot/analytics";
import { budgetBandLabel } from "@/features/shop-bot/params";
import {
  hotelHintsToCheckout,
  saveCheckoutHints,
} from "@/features/shop-bot/checkout-hints";
import {
  confirmExtras,
  confirmProduct,
  createInitialShopBotState,
  restartShopBot,
  selectBudget,
  selectIntent,
  selectOccasion,
  selectProduct,
  setHotelHints,
  shopBotBack,
  shopBotProgress,
  skipExtras,
  toggleAddon,
} from "@/features/shop-bot/machine";
import type {
  BotProduct,
  ShopBotDeepLink,
  ShopBotOccasion,
  ShopBotState,
} from "@/features/shop-bot/types";
import { BUDGET_CHIPS_VND, SHOP_BOT_OCCASIONS } from "@/features/shop-bot/types";
import { ShopBotChip, ShopBotChips } from "./ShopBotChips";
import { ShopBotExtras } from "./ShopBotExtras";
import { ShopBotRecommendations } from "./ShopBotRecommendations";

function botProductToCartProduct(product: BotProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    price: product.priceVnd,
    image: product.imageUrl || "/bouquets/shown/w-01.jpg",
    accent: "rose",
    names: { en: product.name, vi: product.name },
    tags: { en: product.tag || "", vi: product.tag || "" },
    blurb: { en: product.blurb || "", vi: product.blurb || "" },
    story: { en: "", vi: "" },
    published: true,
  };
}

export function ShopBotFlow({
  locale,
  dictionary,
  deepLink = {},
  onClose,
  embedded = false,
}: {
  locale: Locale;
  dictionary: Dictionary;
  deepLink?: ShopBotDeepLink;
  onClose?: () => void;
  embedded?: boolean;
}) {
  const t = dictionary.shopBot;
  const router = useRouter();
  const { addProduct } = useCart();
  const [state, setState] = useState<ShopBotState>(() =>
    createInitialShopBotState(locale, deepLink),
  );
  const [recommendations, setRecommendations] = useState<BotProduct[]>([]);
  const [filtersRelaxed, setFiltersRelaxed] = useState(false);
  const [addons, setAddons] = useState<AddonPublic[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [customBudget, setCustomBudget] = useState("");
  const [pending, startTransition] = useTransition();
  const [handoffBusy, setHandoffBusy] = useState(false);

  const progress = shopBotProgress(state.step);
  const selectedProduct = useMemo(
    () => recommendations.find((p) => p.id === state.selectedProductId),
    [recommendations, state.selectedProductId],
  );

  useEffect(() => {
    trackShopBotEvent({
      name: "shop_bot_opened",
      locale,
      source: deepLink.source,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  useEffect(() => {
    if (state.step !== "recommendations" && state.step !== "product") return;
    if (!state.intent) return;

    let cancelled = false;
    startTransition(async () => {
      try {
        const result = await recommendShopBotAction({
          locale,
          city: state.city,
          intent: state.intent!,
          occasion: state.occasion,
          budgetMaxVnd: state.budgetMaxVnd,
        });
        if (cancelled) return;
        setLoadError(false);
        setRecommendations(result.items);
        setFiltersRelaxed(result.filtersRelaxed);
        trackShopBotEvent({
          name: "shop_bot_recommendations_shown",
          count: result.items.length,
          filtersRelaxed: result.filtersRelaxed,
        });
        if (result.items.length === 0) {
          trackShopBotEvent({
            name: "shop_bot_no_match",
            reason: state.budgetMaxVnd ? "budget" : "empty",
          });
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setRecommendations([]);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    state.step,
    state.intent,
    state.occasion,
    state.budgetMaxVnd,
    locale,
  ]);

  useEffect(() => {
    if (state.step !== "extras" && state.step !== "review") return;
    let cancelled = false;
    listShopBotAddonsAction().then((rows) => {
      if (!cancelled) setAddons(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [state.step]);

  function occasionLabel(key: ShopBotOccasion) {
    const map: Record<ShopBotOccasion, string> = {
      birthday: t.occasionBirthday,
      anniversary: t.occasionAnniversary,
      love: t.occasionLove,
      congratulations: t.occasionCongratulations,
      apology: t.occasionApology,
      other: t.occasionOther,
    };
    return map[key];
  }

  function onHandoff() {
    if (!selectedProduct || handoffBusy) return;
    setHandoffBusy(true);
    const selectedAddons = addons
      .filter((a) => state.selectedAddonIds.includes(a.id))
      .map((addon) => ({ addon }));

    addProduct(botProductToCartProduct(selectedProduct), locale, selectedAddons, {
      openDrawer: false,
    });
    trackShopBotEvent({ name: "shop_bot_added_to_cart", itemKind: "product" });
    for (const a of selectedAddons) {
      trackShopBotEvent({
        name: "shop_bot_addon_selected",
        addonId: a.addon.id,
        kind: a.addon.kind,
      });
    }

    if (state.intent === "hotel") {
      saveCheckoutHints(hotelHintsToCheckout(state.hotel));
    }

    const cartCount = 1 + selectedAddons.length;
    trackShopBotEvent({
      name: "shop_bot_checkout_handoff",
      cartItems: cartCount,
    });
    onClose?.();
    router.push(`/${locale}/checkout`);
  }

  return (
    <div className={`flex h-full flex-col ${embedded ? "" : ""}`}>
      <header className="flex items-start justify-between gap-3 border-b border-forest/10 px-5 py-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-rose uppercase">
            {t.pageKicker}
          </p>
          <p className="mt-1 text-xs text-moss">
            {t.progress
              .replace("{current}", String(progress.current))
              .replace("{total}", String(progress.total))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.step !== "greeting" ? (
            <button
              type="button"
              className="min-h-11 rounded-full px-3 text-[11px] tracking-[0.12em] text-moss uppercase"
              onClick={() => setState(restartShopBot(locale, state.source))}
            >
              {t.restart}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="min-h-11 rounded-full px-3 text-[11px] tracking-[0.12em] text-forest uppercase"
              onClick={onClose}
            >
              {t.close}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {state.step !== "greeting" ? (
          <button
            type="button"
            className="mb-4 min-h-11 text-left text-[11px] tracking-[0.14em] text-moss uppercase"
            onClick={() => setState(shopBotBack(state))}
          >
            ← {t.back}
          </button>
        ) : null}

        {state.step === "greeting" ? (
          <section className="space-y-5">
            <h2 className="serif text-3xl leading-tight text-forest">
              {t.greetingTitle}
            </h2>
            <p className="text-sm leading-7 text-moss">{t.greetingBody}</p>
            <button
              type="button"
              className="min-h-11 rounded-full bg-citrus px-6 text-[12px] tracking-[0.16em] text-ivory uppercase"
              onClick={() => setState({ ...state, step: "intent" })}
            >
              {t.greetingCta}
            </button>
          </section>
        ) : null}

        {state.step === "intent" ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.intentTitle}</h2>
            <ShopBotChips>
              <ShopBotChip
                label={t.intentSelf}
                selected={state.intent === "self"}
                onClick={() => {
                  trackShopBotEvent({
                    name: "shop_bot_intent_selected",
                    intent: "self",
                  });
                  setState(selectIntent(state, "self"));
                }}
              />
              <ShopBotChip
                label={t.intentGift}
                selected={state.intent === "gift"}
                onClick={() => {
                  trackShopBotEvent({
                    name: "shop_bot_intent_selected",
                    intent: "gift",
                  });
                  setState(selectIntent(state, "gift"));
                }}
              />
              <ShopBotChip
                label={t.intentHotel}
                selected={state.intent === "hotel"}
                onClick={() => {
                  trackShopBotEvent({
                    name: "shop_bot_intent_selected",
                    intent: "hotel",
                  });
                  setState(selectIntent(state, "hotel"));
                }}
              />
              <ShopBotChip
                label={t.intentBrowse}
                selected={state.intent === "browse"}
                onClick={() => {
                  trackShopBotEvent({
                    name: "shop_bot_intent_selected",
                    intent: "browse",
                  });
                  setState(selectIntent(state, "browse"));
                }}
              />
            </ShopBotChips>
          </section>
        ) : null}

        {state.step === "occasion" ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.occasionTitle}</h2>
            <ShopBotChips>
              {SHOP_BOT_OCCASIONS.map((key) => (
                <ShopBotChip
                  key={key}
                  label={occasionLabel(key)}
                  selected={state.occasion === key}
                  onClick={() => setState(selectOccasion(state, key))}
                />
              ))}
              <ShopBotChip
                label={t.skip}
                onClick={() => setState(selectOccasion(state, "skip"))}
              />
            </ShopBotChips>
          </section>
        ) : null}

        {state.step === "budget" ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.budgetTitle}</h2>
            <p className="text-xs text-moss">{t.budgetHint}</p>
            <ShopBotChips>
              {BUDGET_CHIPS_VND.map((value) => (
                <ShopBotChip
                  key={value}
                  label={`≤ ${formatVnd(value, locale)}`}
                  selected={state.budgetMaxVnd === value}
                  onClick={() => {
                    trackShopBotEvent({
                      name: "shop_bot_budget_set",
                      budgetBand: budgetBandLabel(value),
                    });
                    setState(selectBudget(state, value));
                  }}
                />
              ))}
              <ShopBotChip
                label={t.skip}
                onClick={() => setState(selectBudget(state, "skip"))}
              />
            </ShopBotChips>
            <div className="rounded-2xl border border-forest/10 bg-white/60 p-3">
              <label className="block text-[11px] tracking-[0.14em] text-moss uppercase">
                {t.budgetCustom}
                <input
                  inputMode="numeric"
                  value={customBudget}
                  placeholder={t.budgetCustomPlaceholder}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-paper px-4 text-sm outline-none focus:border-citrus"
                />
              </label>
              <button
                type="button"
                className="mt-3 min-h-11 rounded-full bg-forest px-5 text-[11px] tracking-[0.14em] text-ivory uppercase"
                onClick={() => {
                  const n = Number(customBudget.replace(/[^\d]/g, ""));
                  if (!Number.isFinite(n) || n < 50_000) return;
                  trackShopBotEvent({
                    name: "shop_bot_budget_set",
                    budgetBand: budgetBandLabel(n),
                  });
                  setState(selectBudget(state, n));
                }}
              >
                {t.budgetCustomApply}
              </button>
            </div>
          </section>
        ) : null}

        {state.step === "recommendations" ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.recommendTitle}</h2>
            {filtersRelaxed ? (
              <p className="text-xs leading-5 text-moss">{t.recommendRelaxed}</p>
            ) : null}
            {pending ? (
              <p className="text-sm text-moss">{t.recommendLoading}</p>
            ) : null}
            {!pending && (loadError || recommendations.length === 0) ? (
              <div className="space-y-3 rounded-2xl bg-cream/70 p-4">
                <p className="text-sm leading-6 text-moss">{t.recommendEmpty}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-full border border-forest/15 px-4 text-[11px] tracking-[0.12em] uppercase"
                    onClick={() => setState({ ...state, step: "budget" })}
                  >
                    {t.retryBudget}
                  </button>
                  <Link
                    href={`/${locale}/shop`}
                    className="inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-[11px] tracking-[0.12em] text-ivory uppercase"
                  >
                    {t.seeShop}
                  </Link>
                </div>
              </div>
            ) : null}
            {!pending && recommendations.length > 0 ? (
              <ShopBotRecommendations
                locale={locale}
                items={recommendations}
                chooseLabel={t.chooseBouquet}
                viewLabel={t.viewProduct}
                onSelect={(productId) => {
                  trackShopBotEvent({
                    name: "shop_bot_product_selected",
                    productId,
                  });
                  setState(selectProduct(state, productId));
                }}
              />
            ) : null}
          </section>
        ) : null}

        {state.step === "product" && selectedProduct ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.productTitle}</h2>
            <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white/70">
              <div className="relative aspect-[4/3] bg-cream">
                {selectedProduct.imageUrl ? (
                  <Image
                    src={selectedProduct.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <p className="serif text-xl text-forest">{selectedProduct.name}</p>
                <p className="mt-2 text-sm font-medium text-citrus">
                  {formatVnd(selectedProduct.priceVnd, locale)}
                </p>
                {selectedProduct.blurb ? (
                  <p className="mt-2 text-sm leading-6 text-moss">
                    {selectedProduct.blurb}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-full bg-forest px-4 text-[11px] tracking-[0.14em] text-ivory uppercase"
                onClick={() => setState(confirmProduct(state))}
              >
                {t.chooseBouquet}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full border border-forest/15 px-4 text-[11px] tracking-[0.12em] uppercase"
                onClick={() =>
                  setState({
                    ...state,
                    step: "recommendations",
                    selectedProductId: undefined,
                  })
                }
              >
                {t.seeOthers}
              </button>
            </div>
          </section>
        ) : null}

        {state.step === "extras" ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.extrasTitle}</h2>
            <p className="text-xs leading-5 text-moss">{t.extrasHint}</p>

            {state.intent === "hotel" ? (
              <div className="space-y-3 rounded-2xl border border-forest/10 bg-cream/50 p-3">
                <h3 className="text-[11px] tracking-[0.16em] text-moss uppercase">
                  {t.hotelTitle}
                </h3>
                <input
                  className="min-h-11 w-full rounded-full border border-forest/15 bg-white/80 px-4 text-sm outline-none focus:border-citrus"
                  placeholder={t.hotelName}
                  value={state.hotel.name || ""}
                  onChange={(e) =>
                    setState(
                      setHotelHints(state, {
                        ...state.hotel,
                        name: e.target.value,
                      }),
                    )
                  }
                />
                <input
                  className="min-h-11 w-full rounded-full border border-forest/15 bg-white/80 px-4 text-sm outline-none focus:border-citrus"
                  placeholder={t.hotelRecipient}
                  value={state.hotel.recipient || ""}
                  onChange={(e) =>
                    setState(
                      setHotelHints(state, {
                        ...state.hotel,
                        recipient: e.target.value,
                      }),
                    )
                  }
                />
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-forest/15 bg-white/80 px-4 py-3 text-sm outline-none focus:border-citrus"
                  placeholder={t.hotelNote}
                  value={state.hotel.note || ""}
                  onChange={(e) =>
                    setState(
                      setHotelHints(state, {
                        ...state.hotel,
                        note: e.target.value,
                      }),
                    )
                  }
                />
              </div>
            ) : null}

            <ShopBotExtras
              locale={locale}
              addons={addons}
              selectedIds={state.selectedAddonIds}
              onToggle={(id) => setState(toggleAddon(state, id))}
              extrasTitle={t.extrasSection}
              vouchersTitle={t.vouchersSection}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-full bg-forest px-4 text-[11px] tracking-[0.14em] text-ivory uppercase"
                onClick={() => setState(confirmExtras(state))}
              >
                {t.extrasContinue}
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full border border-forest/15 px-4 text-[11px] tracking-[0.12em] uppercase"
                onClick={() => setState(skipExtras(state))}
              >
                {t.extrasNone}
              </button>
            </div>
          </section>
        ) : null}

        {state.step === "review" && selectedProduct ? (
          <section className="space-y-4">
            <h2 className="serif text-2xl text-forest">{t.reviewTitle}</h2>
            <p className="text-sm leading-6 text-moss">{t.reviewBody}</p>
            <ul className="space-y-3">
              <li className="flex gap-3 rounded-2xl bg-white/70 p-3">
                <div className="relative h-16 w-14 overflow-hidden rounded-lg bg-cream">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="serif text-lg leading-tight">
                    {selectedProduct.name}
                  </p>
                  <p className="text-sm text-citrus">
                    {formatVnd(selectedProduct.priceVnd, locale)}
                  </p>
                </div>
              </li>
              {addons
                .filter((a) => state.selectedAddonIds.includes(a.id))
                .map((addon) => (
                  <li
                    key={addon.id}
                    className="flex justify-between gap-3 rounded-2xl bg-cream/60 px-3 py-3 text-sm"
                  >
                    <span>
                      {locale === "vi" ? addon.nameVi : addon.nameEn}
                    </span>
                    <span className="text-citrus">
                      {formatVnd(addon.price, locale)}
                    </span>
                  </li>
                ))}
            </ul>
            <div className="flex items-center justify-between border-t border-forest/10 pt-3 text-sm">
              <span>{t.reviewSubtotal}</span>
              <span className="serif text-xl text-forest">
                {formatVnd(
                  selectedProduct.priceVnd +
                    addons
                      .filter((a) => state.selectedAddonIds.includes(a.id))
                      .reduce((sum, a) => sum + a.price, 0),
                  locale,
                )}
              </span>
            </div>
            <p className="text-xs leading-5 text-moss">{t.confirmNote}</p>
            <button
              type="button"
              disabled={handoffBusy}
              onClick={onHandoff}
              className="min-h-11 w-full rounded-full bg-citrus px-4 text-[12px] tracking-[0.16em] text-ivory uppercase disabled:opacity-60"
            >
              {t.reviewAddAndCheckout}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
