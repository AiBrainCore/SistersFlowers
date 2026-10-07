"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatVnd } from "@/data/products";
import { useCart } from "@/context/cart-context";
import { submitOrderAction } from "@/app/actions/orders";
import { DeliveryCalculator } from "@/components/delivery-calculator";
import type { DeliveryConfig, DeliveryZonePublic } from "@/lib/delivery";

export function CheckoutForm({
  locale,
  dictionary,
  deliveryConfig,
  zones,
}: {
  locale: Locale;
  dictionary: Dictionary;
  deliveryConfig: DeliveryConfig;
  zones: DeliveryZonePublic[];
}) {
  const router = useRouter();
  const { items, subtotal, clear, hydrated } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [deliveryKm, setDeliveryKm] = useState(12);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(
    deliveryConfig.baseFee,
  );
  const [deliveryZone, setDeliveryZone] = useState("");

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
      zone: deliveryZone || String(form.get("deliveryZone") || ""),
      deliveryKm,
      deliveryFee: deliveryFee ?? undefined,
      address: String(form.get("address") || ""),
      deliveryDate: String(form.get("deliveryDate") || "") || undefined,
      deliveryTime: String(form.get("deliveryTime") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
      recipientName: String(form.get("recipientName") || "") || undefined,
      hotelName: String(form.get("hotelName") || "") || undefined,
      roomNumber: String(form.get("roomNumber") || "") || undefined,
      items: items.map((item) => ({
        slug: item.slug,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
        kind: item.type,
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
    const params = new URLSearchParams({
      ref: result.reference,
      wa: result.whatsappUrl,
    });
    router.push(`/${locale}/checkout/success?${params.toString()}`);
  }

  if (!hydrated || items.length === 0) {
    return (
      <p className="text-sm text-moss">{dictionary.checkout.redirecting}</p>
    );
  }

  const grandTotal = subtotal + (deliveryFee ?? 0);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="grid gap-5">
        <Field label={dictionary.checkout.name} name="customerName" required />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dictionary.checkout.phone} name="phone" required />
          <Field label={dictionary.checkout.email} name="email" type="email" />
        </div>
        <DeliveryCalculator
          locale={locale}
          dictionary={dictionary}
          config={deliveryConfig}
          zones={zones}
          compact
          onChange={onDeliveryChange}
        />
        <Field label={dictionary.checkout.address} name="address" required />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dictionary.checkout.date} name="deliveryDate" type="date" />
          <Field label={dictionary.checkout.time} name="deliveryTime" />
        </div>
        <Field label={dictionary.checkout.recipient} name="recipientName" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dictionary.checkout.hotel} name="hotelName" />
          <Field label={dictionary.checkout.room} name="roomNumber" />
        </div>
        <label className="block">
          <span className="text-[11px] tracking-[0.16em] text-moss uppercase">
            {dictionary.checkout.notes}
          </span>
          <textarea
            name="notes"
            rows={4}
            className="mt-2 w-full rounded-2xl border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
          />
        </label>
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-2 rounded-full bg-forest px-8 py-3 text-[12px] tracking-[0.18em] text-ivory uppercase disabled:opacity-60"
        >
          {status === "sending"
            ? dictionary.checkout.sending
            : dictionary.checkout.submit}
        </button>
      </form>

      <aside className="rounded-3xl bg-cream/70 p-6 h-fit">
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
              {deliveryKm ? ` · ${deliveryKm} km` : ""}
            </span>
            <span>
              {deliveryFee === null
                ? dictionary.delivery.quoted
                : formatVnd(deliveryFee, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span>{dictionary.checkout.grandTotal}</span>
            <span className="serif text-2xl">
              {deliveryFee === null
                ? formatVnd(subtotal, locale) + "+"
                : formatVnd(grandTotal, locale)}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-6 text-moss">{dictionary.checkout.payNote}</p>
        <Link
          href={`/${locale}/shop`}
          className="mt-4 inline-block text-[11px] tracking-[0.14em] uppercase border-b border-forest pb-0.5"
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="mt-2 w-full rounded-full border border-forest/15 bg-white/70 px-4 py-3 text-sm outline-none focus:border-rose"
      />
    </label>
  );
}
