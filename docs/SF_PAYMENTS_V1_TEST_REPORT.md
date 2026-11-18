# Sisters Flowers — Payments V1 Test Report

Date: 2026-11-18 (Asia/Saigon)  
Branch: `cursor/payments-fulfillment-v1-60b5`

## Automated

| Suite | Result |
| --- | --- |
| `src/lib/payments/vietqr.test.ts` | VietQR URL integer amount, short transfer content, stub methods not live-by-default, receipt ≠ e-invoice |
| Existing `shop-bot` tests | Unchanged; still in `npm test` |

Run: `npm test`

## Manual / acceptance (implementation readiness)

| Area | Status | Notes |
| --- | --- | --- |
| Checkout fulfillment pickup/delivery | Implemented | Pickup zeroes fee; delivery keeps calculator |
| Payment method radios | Implemented | Same catalog as PDP preview / API |
| VietQR pay page | Implemented | QR + copy fields; viewing QR ≠ paid |
| Guest track page | Implemented | Token-based; no sequential-only access |
| Admin Payments | Implemented | Methods + accounts; verified gate |
| Staff confirm paid | Implemented | Updates intent + OrderPayment + history |
| Manual Grab booking fields | Implemented | Customer fee vs actual cost |
| payOS webhook | Scaffold | Rejects if unconfigured / unsigned |
| Coming-soon methods | Implemented | Visible, not selectable |
| E-invoice | Explicitly out of scope | Receipt helper flags `isLegalEInvoice: false` |

## Not claimed live

- VietQR customer-selectable until verified account + admin enable
- payOS live payment link creation (`payos_not_activated`)
- Automatic Grab API quotes
- Vietnamese legal e-invoice issuance

## Production blockers (owner)

1. Verified VietinBank (or other) account details entered in admin
2. Decision: shared vs per-city receiving accounts
3. SMTP operational for studio alerts (orders already use Zoho path when configured)
4. payOS merchant + webhook only when ready for phase 2
