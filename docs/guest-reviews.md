# Guest reviews on the homepage

## Do we translate quotes?

**No.** A review is what a person wrote. Machine-translating it when the visitor switches EN↔VI can change meaning and looks fake. Only the section chrome (kicker, title, body, CTAs) is localized.

Quotes live in `src/lib/guest-reviews.ts`, not in `src/i18n/messages/*`.

## Where can guests write a review?

There is **no on-site review form**. Homepage CTAs open **Google** only (see listing + `writereview`) for each studio Place ID.

### Never fuzzy-search the brand on Google Maps

Do **not** use links like:

`https://www.google.com/maps/search/?api=1&query=Sisters+Flowers+Da+Nang`

Google may resolve that to a **different flower shop**. Directions use **lat/lng pins** from `STUDIO_CONTACTS`. Ratings / writereview use the studio `placeId`.

## Place IDs

| City | GBP | Place ID | Maps ftid |
| --- | --- | --- | --- |
| **Da Lat** | Sisters Flowers Shop · Thi Sách / Chi Lăng · ~4.8★ / 21 | `ChIJD3G8K7YTcTERRCQM8wSngQc` | `0x317113b62bbc710f:0x781a704f30c2444` |
| **Da Nang** | Sisters Flowers Shop · 53 Lương Nhữ Hộc · phone 032 745 3536 | `ChIJR3OPOi4ZQjERSv5_hslH2oQ` | `0x3142192e3a8f7347:0x84da47c9867ffe4a` |

Da Nang share / directions example (ftid in the URL):

`…/Sisters+Flowers+Shop,+53+Lương+Nhữ+Hộc…/data=!4m8!4m7!1m0!1m5!1m1!1s0x3142192e3a8f7347:0x84da47c9867ffe4a!2m2!1d108.2117846!2d16.0414349`

Writereview:

`https://search.google.com/local/writereview?placeid=<Place ID>`

### Adding / updating a Place ID

1. Open the **correct** Sisters listing in Google Maps (check address + phone).
2. Copy the `1s0x…:0x…` ftid from the share / directions URL, or use [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).
3. Set `placeId` (and optional `rating` / `reviewCount`) on that city in `STUDIO_GOOGLE_PROFILES`.
4. Keep `STUDIO_CONTACTS` lat/lng aligned with the GBP pin.

### Adding a real Google quote

Append to `GUEST_REVIEW_POOL` with `source: "google"`, verbatim text, guest first name (or initials), and `meta` like `Google · Đà Lạt`. Prefer 5★ only for the homepage rotation.
