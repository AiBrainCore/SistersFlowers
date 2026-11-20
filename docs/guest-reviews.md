# Guest reviews on the homepage

## Do we translate quotes?

**No.** A review is what a person wrote. Machine-translating it when the visitor switches EN↔VI can change meaning and looks fake. Only the section chrome (kicker, title, body, CTAs) is localized.

Quotes live in `src/lib/guest-reviews.ts`, not in `src/i18n/messages/*`.

## Where can guests write a review?

There is **no on-site review form** yet.

- **With Google Place ID set** → CTA opens Google `writereview` for that listing.
- **Without Place ID** → CTA opens the studio **Facebook** page (safe fallback).

### Never fuzzy-search the brand on Google Maps

Do **not** use links like:

`https://www.google.com/maps/search/?api=1&query=Sisters+Flowers+Da+Nang`

Google may resolve that to a **different flower shop** (e.g. Lily’s Flower). Directions use **lat/lng pins** from `STUDIO_CONTACTS`. Google ratings / writereview only after a real `placeId`.

## Using Google’s 20+ reviews

| Approach | What you get | Notes |
| --- | --- | --- |
| **Curated pool (current)** | Any 5★ quotes you paste, original language; daily rotate 3 | Paste real Google wording as you collect it |
| **Places API Place Details** | Up to **5** reviews per place + rating/count | Paid SKU; needs Place ID |
| **Embed widgets** | Often more reviews via their cache | Third-party |

### Adding Place IDs (required for Google badges)

1. Open the **correct** Sisters listing in Google Maps (your GBP).
2. Use [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder) or copy the place link and extract the id.
3. Set `placeId` (and optional `rating` / `reviewCount`) on that city in `STUDIO_GOOGLE_PROFILES`.
4. Writereview becomes:  
   `https://search.google.com/local/writereview?placeid=…`

Until then the homepage shows Facebook CTAs and address pins — not competitor listings.

### Adding a real Google quote

Append to `GUEST_REVIEW_POOL` with `source: "google"`, verbatim text, guest first name (or initials), and `meta` like `Google · Đà Lạt`. Prefer 5★ only for the homepage rotation.
