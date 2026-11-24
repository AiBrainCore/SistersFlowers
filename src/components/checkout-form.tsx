"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { useCart } from "@/context/cart-context";
import { useLocation } from "@/context/location-context";
import { submitOrderAction } from "@/app/actions/orders";
import { DeliveryCalculator } from "@/components/delivery-calculator";
import { DeliveryCityBar } from "@/components/delivery-city-bar";
import type { DeliveryConfig, DeliveryZonePublic } from "@/lib/delivery";
import { DELIVERY_TIME_SLOTS } from "@/lib/delivery-time-slots";
import {
  clearCheckoutHints,
  readCheckoutHints,
} from "@/features/shop-bot/checkout-hints";

export function CheckoutForm({
  locale,
  dictionary,
  citySlug,
  deliveryConfig,
  zones,
  defaults,
}: {
  locale: Locale;
  dictionary: Dictionary;
  citySlug: string;
  deliveryConfig: DeliveryConfig;
  zones: DeliveryZonePublic[];
  defaults?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}) {
  const router = useRouter();
  const { items, subtotal, clear, hydrated } = useCart();
  const { activeCity } = useLocation();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [deliveryKm, setDeliveryKm] = useState(zones[0]?.km ?? 12);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(
    deliveryConfig.baseFee,
  );
  const [deliveryZone, setDeliveryZone] = useState("");
  const [hints, setHints] = useState<{
    hotelName?: string;
    recipientName?: string;
    notes?: string;
  }>({});
  const [hintsReady, setHintsReady] = useState(false);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState("vietqr");
  const [payMethods, setPayMethods] = useState<
    Array<{
      id: string;
      nameEn: string;
      nameVi: string;
      selectable: boolean;
      comingSoon: boolean;
    }>
  >([]);

  const hasHandwrittenCard = useMemo(
    () => items.some((item) => item.type === "addon" && item.slug === "handwritten-card"),
    [items],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const saved = readCheckoutHints();
      if (saved) setHints(saved);
      clearCheckoutHints();
      setHintsReady(true);
    });
  }, []);

  useEffect(() => {
    const city = activeCity?.slug || citySlug || "";
    let cancelled = false;
    fetch(`/api/payments/methods?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        // Storefront: VietQR always; cash only at pickup. Never COD online.
        const methods = ((data.methods || []) as typeof payMethods).filter(
          (m) => {
            if (!m.selectable || m.id === "whatsapp" || m.id === "cod") {
              return false;
            }
            if (m.id === "cash_pickup") return fulfillment === "pickup";
            return true;
          },
        );
        setPayMethods(methods);
        setPaymentMethod((current) => {
          if (methods.some((m) => m.id === current)) return current;
          return (
            methods.find((m) => m.id === "vietqr")?.id ||
            methods[0]?.id ||
            "vietqr"
          );
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPayMethods([
            {
              id: "vietqr",
              nameEn: "VietQR — banks & MoMo",
              nameVi: "VietQR — ngân hàng & MoMo",
              selectable: true,
              comingSoon: false,
            },
          ]);
          setPaymentMethod("vietqr");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeCity?.slug, citySlug, fulfillment]);

  const onDeliveryChange = useCallback(
    (value: { km: number; fee: number | null; zone: string }) => {
      setDeliveryKm(value.km);
      setDeliveryFee(value.fee);
      setDeliveryZone(value.zone);
    },
    [],
  );

  useEffect(() => {
    if (hydrated && items.length === 0 && status === "idle") {
      router.replace(`/${locale}/shop`);
    }
  }, [hydrated, items.length, locale, router, status]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(event.currentTarget);

    const result = await submitOrderAction({
      locale,
      customerName: String(form.get("customerName") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || "") || undefined,
      citySlug: activeCity?.slug || citySlug,
      zone: deliveryZone || String(form.get("deliveryZone") || ""),
      deliveryKm: fulfillment === "pickup" ? undefined : deliveryKm,
      deliveryFee: fulfillment === "pickup" ? 0 : deliveryFee ?? undefined,
      address: String(form.get("address") || ""),
      deliveryDate: String(form.get("deliveryDate") || "") || undefined,
      deliveryTime: String(form.get("deliveryTime") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
      cardMessage: String(form.get("cardMessage") || "") || undefined,
      recipientName: String(form.get("recipientName") || "") || undefined,
      recipientPhone: String(form.get("recipientPhone") || "") || undefined,
      fulfillment,
      paymentMethod,
      anonymousSender: form.get("anonymousSender") === "on",
      items: items.map((item) => ({
        slug: item.slug,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
        kind: item.type,
        size: item.size,
        note: item.note,
        addonKind: item.addonKind,
        partnerName: item.partnerName,
        commissionPercent: item.commissionPercent,
        validityDays: item.validityDays,
      })),
    });

    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }

    clear();
    if (result.paymentPath?.startsWith("http")) {
      window.location.href = result.paymentPath;
      return;
    }
    if (result.paymentPath?.startsWith("/")) {
      router.push(result.paymentPath);
      return;
    }
    const params = new URLSearchParams({
      ref: result.reference,
      wa: result.whatsappUrl,
    });
    if (result.trackingToken) params.set("track", result.trackingToken);
    router.push(`/${locale}/checkout/success?${params.toString()}`);
  }

  if (!hydrated || !hintsReady || items.length === 0) {
    return (
      <p className="text-sm text-moss">{dictionary.checkout.redirecting}</p>
    );
  }

  const effectiveFee = fulfillment === "pickup" ? 0 : deliveryFee;
  const grandTotal = subtotal + (effectiveFee ?? 0);

  const submitLabel =
    status === "sending"
      ? dictionary.checkout.sending
      : dictionary.checkout.submit;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <form
        id="checkout-form"
        onSubmit={onSubmit}
        className="grid gap-5"
      >
        <DeliveryCityBar locale={locale} dictionary={dictionary} />

        <fieldset className="grid gap-2">
          <legend className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {dictionary.checkout.fulfillment}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["delivery", dictionary.checkout.fulfillmentDelivery],
                ["pickup", dictionary.checkout.fulfillmentPickup],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFulfillment(id)}
                className={`min-h-11 rounded-full border px-4 text-sm transition ${
                  fulfillment === id
                    ? "border-citrus bg-citrus text-white"
                    : "border-forest/15 bg-white text-forest"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <Field
          label={dictionary.checkout.name}
          name="customerName"
          required
          defaultValue={defaults?.name}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label={dictionary.checkout.phone}
            name="phone"
            required
            defaultValue={defaults?.phone}
          />
          <Field
            label={dictionary.checkout.email}
            name="email"
            type="email"
            required
            defaultValue={defaults?.email}
          />
        </div>
        {fulfillment === "delivery" ? (
          <>
            <DeliveryCalculator
              key={`${citySlug}-zones`}
              locale={locale}
              dictionary={dictionary}
              config={deliveryConfig}
              zones={zones}
              compact
              onChange={onDeliveryChange}
            />
            <Field
              key="address-delivery"
              label={dictionary.checkout.address}
              name="address"
              required
              defaultValue={
                hints.hotelName || defaults?.address || undefined
              }
            />
          </>
        ) : (
          <Field
            key="address-pickup"
            label={dictionary.checkout.address}
            name="address"
            defaultValue="Pickup at studio"
          />
        )}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <label className="block min-w-0">
            <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
              {dictionary.checkout.date}
            </span>
            <input
              name="deliveryDate"
              type="date"
              className="mt-2 box-border min-h-11 w-full min-w-0 max-w-full rounded-2xl border border-forest/15 bg-white/70 px-2.5 py-2.5 text-sm outline-none focus:border-rose sm:rounded-full sm:px-4 sm:py-3"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
              {dictionary.checkout.time}
            </span>
            <select
              name="deliveryTime"
              defaultValue=""
              className="mt-2 box-border min-h-11 w-full min-w-0 max-w-full rounded-2xl border border-forest/15 bg-white/70 px-2.5 py-2.5 text-sm outline-none focus:border-rose sm:rounded-full sm:px-4 sm:py-3"
            >
              <option value="">{dictionary.checkout.timeAny}</option>
              {DELIVERY_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Field
          label={dictionary.checkout.recipient}
          name="recipientName"
          defaultValue={hints.recipientName}
        />
        <Field
          label={dictionary.checkout.recipientPhone}
          name="recipientPhone"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm text-forest">
          <input type="checkbox" name="anonymousSender" className="h-4 w-4" />
          {dictionary.checkout.anonymousSender}
        </label>
        <label className="block">
          <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {dictionary.checkout.notes}
          </span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={hints.notes}
            placeholder={dictionary.checkout.notesPlaceholder}
            className="mt-2 w-full rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
          />
        </label>

        {hasHandwrittenCard ? (
          <label className="block">
            <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
              {dictionary.checkout.cardMessage}
            </span>
            <textarea
              name="cardMessage"
              rows={3}
              placeholder={dictionary.checkout.cardMessagePlaceholder}
              className="mt-2 w-full rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
            />
          </label>
        ) : null}

        <fieldset className="grid gap-2">
          <legend className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {dictionary.checkout.paymentMethod}
          </legend>
          <div className="grid gap-2">
            {payMethods.map((m) => {
              const label = locale === "vi" ? m.nameVi : m.nameEn;
              const disabled = !m.selectable;
              return (
                <label
                  key={m.id}
                  className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 text-sm ${
                    disabled
                      ? "border-forest/10 bg-cream/40 text-moss/70"
                      : paymentMethod === m.id
                        ? "border-citrus/50 bg-citrus/8 text-forest"
                        : "border-forest/15 bg-white text-forest"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethodUi"
                    disabled={disabled}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <span className="flex-1">{label}</span>
                  {m.comingSoon || disabled ? (
                    <span className="text-[10px] tracking-wide uppercase">
                      {dictionary.payments.comingSoon}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="text-sm text-rose lg:hidden">{error}</p> : null}
      </form>

      <aside className="h-fit rounded-3xl bg-cream/70 p-6 lg:sticky lg:top-24">
        <h2 className="serif text-2xl">{dictionary.checkout.summary}</h2>
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3">
              <div className="relative h-16 w-12 overflow-hidden rounded-sm bg-cream">
                {item.image ? (
                  <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                ) : null}
              </div>
              <div className="flex-1 text-sm">
                <p className="serif text-lg leading-tight">{item.name}</p>
                {item.sku ? (
                  <p className="mt-0.5 text-[11px] tracking-[0.08em] text-moss/80">
                    {dictionary.product.skuLabel}{" "}
                    <span className="font-medium tracking-[0.04em] text-forest">
                      {item.sku}
                    </span>
                  </p>
                ) : null}
                {item.note ? (
                  <p className="text-xs text-moss italic">“{item.note}”</p>
                ) : null}
                <p className="text-moss">
                  {item.qty} × {formatVnd(item.price, locale)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-forest/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span>{dictionary.cart.total}</span>
            <span>{formatVnd(subtotal, locale)}</span>
          </div>
          <div className="flex justify-between text-moss">
            <span>
              {dictionary.delivery.feeLabel}
              {fulfillment === "delivery" && deliveryKm
                ? ` · ${deliveryKm} km`
                : ""}
            </span>
            <span>
              {fulfillment === "pickup"
                ? formatVnd(0, locale)
                : effectiveFee === null
                  ? dictionary.delivery.quoted
                  : formatVnd(effectiveFee, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span>{dictionary.checkout.grandTotal}</span>
            <span className="serif text-2xl">
              {fulfillment === "delivery" && effectiveFee === null
                ? formatVnd(subtotal, locale) + "+"
                : formatVnd(grandTotal, locale)}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-6 text-moss">{dictionary.checkout.payNote}</p>
        {error ? <p className="mt-3 hidden text-sm text-rose lg:block">{error}</p> : null}
        <button
          type="submit"
          form="checkout-form"
          disabled={status === "sending"}
          className="mt-5 w-full rounded-full bg-citrus px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase transition hover:bg-citrus/90 disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <Link
          href={`/${locale}/shop`}
          className="mt-4 inline-block border-b border-forest pb-0.5 text-[11px] tracking-[0.14em] uppercase"
        >
          {dictionary.checkout.backShop}
        </Link>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-full border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
      />
    </label>
  );
}
