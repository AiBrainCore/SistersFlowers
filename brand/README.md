# Sisters Flowers — brand masters

| Folder | What |
| --- | --- |
| `source/` | Vector masters (AI / EPS / PDF); older pack in `source/archive/` |
| `print/` | Approved print QR set (PNG + PDF) — keep handy with logos |
| `/public/brand/` | Web + email + QR files served on the site |

## Logos (`/public/brand/`)

| Path | Use |
| --- | --- |
| `/brand/wordmark-white.png` | Sticky header (1-line, citrus bar) |
| `/brand/wordmark-black.png` | 1-line on light UI |
| `/brand/wordmark-stacked-white.png` | 2-line on citrus/dark |
| `/brand/wordmark-stacked-black.png` | Footer, order/inquiry success |
| `/brand/mark-white.png` / `mark-black.png` | Compact SF monogram |
| `/brand/mark-citrus.png` | Social / OG / profile |
| `/brand/wordmark-stacked-citrus.png` | Square stacked presentation |
| `/brand/email-*.png` | Transactional email HTML |
| `/brand/icon-*.png` | Favicon / PWA |

## Print QR (`brand/print/` + `/public/brand/`)

Points to `https://sistersflowers.vn` (SF mark in the center).

| File | Use |
| --- | --- |
| `qr-print-card.png` / `.pdf` | Main print card (horizontal wordmark + domain) |
| `qr-print-card-approved.pdf` | Same approved PDF kept under `brand/print/` |
| `qr-print-card-text.png` | Alt card with text title `sistersflowers` |
| `qr-print-poster.png` | Citrus-border poster |
| `qr-sistersflowers.png` | QR only (stickers) |

Live download: `https://sistersflowers.vn/brand/qr-print-card.pdf`

Regenerate: `python3 scripts/generate-print-qr.py`

Code: `src/lib/brand.ts`, `<BrandLogo variant="wordmark|stacked|mark" />`.
