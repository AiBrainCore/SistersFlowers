# Sisters Flowers — Payments V1 Activation Checklist

Separate **Implemented** · **Configured** · **Live & verified**.

## VietQR (priority launch)

- [ ] Receiving account created in Admin → Payments (no hardcoded numbers in repo)
- [ ] Bank BIN / name / number / holder verified against VietinBank evidence
- [ ] Account marked **Verified**
- [ ] Method `vietqr` **enabled** and Coming soon **off**
- [ ] Test transfer of small amount with transfer content `SF…`
- [ ] Staff confirm-paid path verified on a test order
- [ ] Customer email / WhatsApp still work when SMTP present
- [ ] Production DB is durable Postgres (Supabase) — never ephemeral SQLite disk

## payOS

- [ ] Merchant approved in https://my.payos.vn/
- [ ] `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` in server env only
- [ ] Webhook URL registered → `/api/payments/payos/webhook`
- [ ] Signature verification implemented against current docs and tested
- [ ] Live create-payment-link activated (currently returns `payos_not_activated` by design)
- [ ] Duplicate webhook idempotency tested
- [ ] Method `payos` enabled only after the above

## MoMo / ZaloPay / Cards / PayPal

- [ ] Remain Coming soon until a real provider adapter exists
- [ ] Must never appear selectable or mark orders paid

## Cash pickup / COD

- [ ] Enable only when studio policy allows
- [ ] Staff must mark payment seen before fulfillment gates that require paid

## Delivery (Grab manual)

- [ ] Delivery fee confirmed to customer before charge
- [ ] Staff records Grab booking + **actual cost** separately from customer fee
- [ ] No fake public tracking links

## Notifications

- [ ] P.A Vietnam / maychuemail SMTP on VPS (`mail9234.maychuemail.com:465`)
- [ ] Domain MX + SPF (remove Zoho MX); DKIM from P.A when provided
- [ ] Test send OK → set `EMAIL_ENABLED=true`
- [ ] Studio inbox routing by city verified
- [ ] Failed sends do not delete orders
- [ ] Optional: set `CRON_SECRET` and schedule `POST /api/cron/notifications` every few minutes

## Legal documents

- [ ] Order confirmation/receipt copy reviewed
- [ ] **Do not** label receipts as hóa đơn điện tử until a licensed e-invoice provider is integrated

## Owner approvals required

- [ ] Verified bank account details (household vs business)
- [ ] Which cities share vs split receiving accounts
- [ ] When to turn on VietQR live for customers
- [ ] When to fund / approve payOS merchant
- [ ] Cash / COD policy per studio
