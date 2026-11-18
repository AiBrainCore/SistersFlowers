# Sisters Flowers — Payments V1 Implementation Plan

## Business launch priority (founder)

1. **VietQR + VietinBank** (configurable; live only when account verified)  
2. Reliable order save + seller email/dashboard  
3. **payOS** auto-confirm (implemented, **disabled** until credentials)  
4. International methods = Coming soon (visible, not selectable)

Grab: **manual staff booking first**; architecture ready for later API.

## Incremental slices

### Slice A — Foundation (this PR core)
- Audit + architecture docs  
- Prisma: `PaymentAccount`, `PaymentMethodSetting`, `PaymentIntent`, `DeliveryBooking`, `NotificationOutbox`; Order `trackingToken`, `paymentMethod`, `anonymousSender`  
- Payment method catalog (VietQR / payOS / MoMo / ZaloPay / cards / PayPal / cash*) with coming-soon flags  
- Admin **Payments** settings (accounts + method toggles) — secrets never in client  
- `PaymentMethodsPreview` on PDP  
- Checkout: pickup | delivery; payment method; server-side total; create `PaymentIntent`  
- VietQR pay page (img.vietqr.io when account active+verified)  
- Staff **Confirm payment** on `/admin/orders` (writes `OrderPayment`, history)  
- Guest `/order/[token]` tracking  
- Wire shop status updates → history + status email  
- payOS adapter + webhook route: **safe no-op when env missing**

### Slice B — Ops polish (PR follow-up)
- Fulfillment checklist UI + gate on handoff statuses  
- Delivery quote awaiting flow (`awaiting_delivery_quote`) + staff fee confirm  
- Server-side catalog reprice (never trust client amounts)  
- Admin order detail + ops alerts on dashboard  
- Courier cost vs customer fee reporting + CSV  
- Notification outbox processor (`/api/cron/notifications`, `CRON_SECRET`)  
- Builder → cart still optional; inquiry remains

### Slice C — Activation (owner ops, not code) — **remaining**
- Enter verified VietinBank (or other) account in admin  
- Mark verified → enable VietQR  
- Configure payOS env + webhook URL → enable after test payment  
- Ensure `EMAIL_ENABLED=true` with working SMTP (P.A Vietnam or Zoho paid IMAP)  
- Optional: schedule `CRON_SECRET` → `/api/cron/notifications`

### Optional later code (not blocking launch)
- Custom Bouquet Builder → shared cart (inquiry path still works)  
- Full payOS live link signing (adapter scaffold exists)  
- Multi-staff branch RBAC  
- Licensed Vietnamese e-invoice provider  
- Live GrabExpress API  
- Richer escalation timers / SLA clocks

## Activation policy

| Method | Implemented | Live selectable when |
| --- | --- | --- |
| VietQR | Yes | Active account + `verifiedAt` + method enabled |
| payOS | Adapter yes | `PAYOS_*` env + method enabled + test OK |
| MoMo / ZaloPay / Cards / PayPal | Preview only | Never until real adapter |
| Cash pickup / COD | Optional flags | Explicit admin enable (default off) |

## Non-goals this PR
- Legal e-invoice provider  
- Live GrabExpress API  
- Multi-staff RBAC  
- Homepage redesign  
- Destructive data migration / DB engine change
