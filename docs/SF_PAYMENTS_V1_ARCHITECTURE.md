# Sisters Flowers — Payments V1 Architecture

## Principles

1. Payments are part of the existing **Order** system — not a side silo.
2. **Payment status ≠ fulfillment status.**
3. Integer **VND** only; server recalculates totals.
4. Provider adapters stay behind readiness gates (configured + verified).
5. Grab starts as **manual** booking; customer fee ≠ courier actual cost.
6. Order confirmation/receipt ≠ Vietnamese **hóa đơn điện tử**.

## Stack (actual)

- Next.js App Router + Prisma + **Supabase Postgres**
- Existing cart (`sf-cart-v3`), checkout action, studio orders, Zoho/SMTP mail
- New tables: `PaymentAccount`, `PaymentMethodSetting`, `PaymentIntent`, `DeliveryBooking`, `NotificationOutbox`
- Order extensions: `trackingToken`, `paymentMethod`, `anonymousSender`

## Flow

```
Cart → CheckoutForm (fulfillment + method)
    → submitOrderAction (validate, snapshot lines, Order + history)
        → createPaymentIntentForOrder (vietqr | payos | null)
        → notifyOrderEmails (existing mail)
        → redirect pay page | WhatsApp success | provider URL
Staff → Admin Orders confirm paid / delivery booking
Customer → /order/pay/[token] · /order/track/[token]
```

## Key modules

| Module | Role |
| --- | --- |
| `lib/payments/methods.ts` | Canonical method catalog |
| `lib/payments/catalog.ts` | DB settings + readiness → selectable |
| `lib/payments/accounts.ts` | Resolve account by branch/city/default |
| `lib/payments/vietqr.ts` | QR image URL builder |
| `lib/payments/payos.ts` | Adapter stub until activated |
| `lib/payments/intents.ts` | Intent create + mark paid |
| `lib/payments/outbox.ts` | Durable notification rows |
| `lib/payments/receipt.ts` | Internal confirmation document model |
| `components/payment-methods-preview.tsx` | PDP strip |
| `admin/payments` | Config UI |
| `api/payments/methods` | Public method list for checkout |
| `api/payments/payos/webhook` | Signature-gated stub |

## Activation

See `SF_PAYMENTS_V1_ACTIVATION_CHECKLIST.md`.

## Slice B additions

- Server `repriceCheckoutItems` before charge  
- `awaiting_delivery_quote` → staff fee → `awaiting_payment` + new intent  
- `FulfillmentChecklist` gates handoff statuses  
- Ops alerts on admin dashboard  
- `/admin/reports` + CSV (customer fee vs courier cost)  
- `/api/cron/notifications` drains `NotificationOutbox` with `CRON_SECRET`

## Launch priority (founder)

1. VietQR + order persistence + staff notifications  
2. payOS automatic confirmation  
3. International methods  
