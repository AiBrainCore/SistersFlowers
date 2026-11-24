# Google Merchant Center product feed

Account: [Merchant Center overview](https://merchants.google.com/mc/overview?a=5905263409) (`a=5905263409`).

## Feed URLs (production)

| Format | URL |
|--------|-----|
| XML (recommended) | `https://sistersflowers.vn/feeds/google-merchant.xml?city=danang&lang=vi` |
| XML Da Lat | `https://sistersflowers.vn/feeds/google-merchant.xml?city=dalat&lang=vi` |
| TSV | `https://sistersflowers.vn/feeds/google-merchant.txt?city=danang&lang=vi` |

Query params:

- `city` — `danang` \| `dalat` (prices + city availability)
- `lang` — `vi` \| `en` (title / description / size labels)

## What is exported

- Published products with **Google Shopping** enabled (`Product.googleShopping`, default on)
- Bouquet size ladder → separate items (`SKU-sm`, `SKU-md`, `SKU-lg`) sharing `item_group_id` = SKU
- Non-ladder types → one item per SKU
- Required Google fields: `id`, `title`, `description`, `link`, `image_link`, `availability`, `condition`, `price` (`N VND`), `brand`, `identifier_exists=no`, `google_product_category`, `product_type`
- Checkout test SKU `SF-TEST` is never exported

## Admin

`/admin/shopping` — feed health, URLs, settings, per-product include/exclude, validation issues.

## Merchant Center setup

1. Products → Feeds → Add primary feed → Scheduled fetch
2. Country: **Vietnam**, language: **Vietnamese**, currency: **VND**
3. Paste the XML URL for the city you advertise
4. Fetch schedule: daily (or more often)
5. Configure shipping / free delivery rules in Merchant Center (or optional flat VND in admin settings)
6. Fix diagnostics from Admin → Google Shopping → Validation issues

## Ops

- Migration: `20261124074006_google_merchant_feed`
- After deploy, confirm feed headers `X-Merchant-Items` / `X-Merchant-Issues`
