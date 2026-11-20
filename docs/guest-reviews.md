# Guest reviews on the homepage

## Do we translate quotes?

**No.** A review is what a person wrote. Machine-translating it when the visitor switches EN↔VI can change meaning and looks fake. Only the section chrome (kicker, title, body, Google CTAs) is localized.

Quotes live in `src/lib/guest-reviews.ts`, not in `src/i18n/messages/*`.

## Where can guests write a review?

There is **no on-site review form** yet. Guests leave reviews on each studio’s **Google Business Profile** (Maps). The homepage shows a curated pool plus links to **see all / leave a review** on Google.

## Using Google’s 20+ reviews

| Approach | What you get | Notes |
| --- | --- | --- |
| **Curated pool (current)** | Any 5★ quotes you paste, original language; daily rotate 3 on the homepage | Best quality control; paste real Google wording as you collect it |
| **Places API Place Details** | Up to **5** reviews per place + rating/count | Not the full 22; paid Enterprise(+Atmosphere) SKU; must show Google attribution |
| **Embed widgets** (Elfsight, etc.) | Often more reviews via their cache | Third-party cost + branding |
| **GBP API** | Manage replies; not a free “pull all reviews for website” path for most shops | Overkill for display |

Practical pattern (what we use):

1. Keep a **curated 5★ pool** in original languages (VI + EN mixed on the page is fine).
2. Show **rating badges** (manual snapshot until Places API) linking to Maps.
3. CTA: **Leave a Google review** / **See on Google**.
4. Later: set `placeId` on each studio in `STUDIO_GOOGLE_PROFILES`, then optionally sync rating + up to 5 live reviews via Places API.

### Adding Place IDs

1. Open the listing in Google Maps → Share → copy the place link, or use [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).
2. Set `placeId` on the matching entry in `STUDIO_GOOGLE_PROFILES`.
3. Write-review deep link becomes:  
   `https://search.google.com/local/writereview?placeid=…`

### Adding a real Google quote

Append to `GUEST_REVIEW_POOL` with `source: "google"`, verbatim text, guest first name (or initials), and `meta` like `Google · Đà Lạt`. Prefer 5★ only for the homepage rotation.
