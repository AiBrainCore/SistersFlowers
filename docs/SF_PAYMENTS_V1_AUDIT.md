# Sisters Flowers — Payments V1 Audit

Date: 2026-11-18 · Branch: `cursor/payments-fulfillment-v1-60b5`  
Stack fact check: **Prisma + Supabase Postgres** (not SQLite). SQLite archive only under `prisma/migrations_sqlite_archive/`.

## Classification legend

| Tag | Meaning |
| --- | --- |
| EXISTS AND WORKS | Production-usable today |
| EXISTS BUT INCOMPLETE | Present but gaps vs Payments V1 |
| MISSING | Not in repo |
| SHOULD BE REUSED | Prefer extend, do not rebuild |
| MUST BE MODIFIED | Required change for V1 |
| MUST NOT BE TOUCHED | Safety / out of scope |

---

## 1. Data & schema

| Area | Status | Notes |
| --- | --- | --- |
| Postgres / Supabase | EXISTS AND WORKS · MUST NOT BE TOUCHED (provider) | `DATABASE_URL` + `DIRECT_URL` |
| `Order`, `OrderItem`, `Customer`, `Branch`, `City`, `Product`, `Addon` | EXISTS AND WORKS · SHOULD BE REUSED | |
| `OrderPayment`, `OrderStatusHistory` | EXISTS AND WORKS (studio) · EXISTS BUT INCOMPLETE (shop) | Shop create never writes them |
| `paymentStatus` / `depositAmount` / `fulfillment` | EXISTS AND WORKS (studio) · EXISTS BUT INCOMPLETE (shop) | Shop always unpaid + delivery default |
| PaymentAccount / PaymentIntent / VietQR config | MISSING | Added in V1 |
| Grab / courier API tables | MISSING · MUST NOT invent live Grab | Manual booking first |

## 2. Cart & checkout

| Area | Status | Notes |
| --- | --- | --- |
| Cart (`sf-cart-v3`) | EXISTS AND WORKS · SHOULD BE REUSED | Multi-item + addons + sizes |
| Checkout form / success | EXISTS AND WORKS · MUST BE MODIFIED | WhatsApp handoff; no payment method / pickup UI |
| Server price trust | EXISTS BUT INCOMPLETE | Validates payload; no immutable payment intent |
| Custom builder → cart | MISSING (uses Inquiry) · MUST NOT force-break | Later phase; keep inquiry path |

## 3. Payments

| Area | Status | Notes |
| --- | --- | --- |
| VietQR / payOS / MoMo / ZaloPay / cards / PayPal | MISSING | |
| Studio cash/deposit marking | EXISTS AND WORKS · SHOULD BE REUSED | `OrderPayment` + gates |
| Marketing “PayPal / Wise / bank” copy | EXISTS BUT INCOMPLETE | Copy only |

## 4. Delivery

| Area | Status | Notes |
| --- | --- | --- |
| Zones + fee calculator | EXISTS AND WORKS · SHOULD BE REUSED | |
| Shop pickup option | MISSING (UI) · MUST BE MODIFIED | Schema already has `fulfillment` |
| GrabExpress API | MISSING · safe manual first | Studio pays Grab; customer pays SF fee |
| Manual delivery quote flow | MISSING | |

## 5. Admin / fulfillment

| Area | Status | Notes |
| --- | --- | --- |
| `/admin/studio-orders` | EXISTS AND WORKS · SHOULD BE REUSED | Day board, payment gate |
| `/admin/orders` | EXISTS BUT INCOMPLETE · MUST BE MODIFIED | No payment confirm / history / checklist |
| Staff RBAC by branch | MISSING | Single admin password — MUST NOT casually rewrite auth crypto |
| Payments settings admin | MISSING | |

## 6. Notifications

| Area | Status | Notes |
| --- | --- | --- |
| Zoho SMTP + branded templates | EXISTS AND WORKS · SHOULD BE REUSED | `EMAIL_ENABLED` often false until mailbox IMAP plan fixed |
| Order received emails | EXISTS AND WORKS | Fire-and-forget from shop submit |
| Status-change emails | EXISTS BUT INCOMPLETE | Implemented, **never wired** from admin status update |
| Notification outbox / retries | MISSING (partial: `EmailDeliveryLog`) | |

## 7. Tracking / receipts / e-invoice

| Area | Status | Notes |
| --- | --- | --- |
| Guest order tracking page | MISSING | |
| Printable receipt | MISSING | |
| Vietnamese e-invoice (hóa đơn điện tử) | MISSING · future module | Do **not** label PDF as legal e-invoice |

## 8. i18n / design

| Area | Status | Notes |
| --- | --- | --- |
| EN/VI storefront + admin dicts | EXISTS AND WORKS · SHOULD BE REUSED | |
| Brand tokens / UI rules | MUST NOT BE TOUCHED (redesign) | Extend components only |

---

## Summary for implementers

**Reuse:** Order stack, cart, delivery zones, Zoho mail, studio payment patterns, addons.  
**Modify:** Shop checkout (pickup + pay method), shop order persistence (history/payments), `/admin/orders`, status emails.  
**Create:** Payment accounts/methods/intents, VietQR adapter, payOS stub (disabled), PDP payment preview, guest tracking, admin Payments settings, delivery booking (manual).  
**Do not:** Hardcode VietinBank numbers, fake Grab tracking, fake paid webhooks, migrate DB engine, redesign homepage.
