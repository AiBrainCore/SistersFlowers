#!/usr/bin/env python3
"""Generate Sisters Flowers print QR assets into public/brand/.

Requires: pip install 'qrcode[pil]' pillow
"""

from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brand"
MARK = OUT / "mark-black.png"
WORDMARK = OUT / "wordmark-stacked-black.png"
URL = "https://sistersflowers.vn"
CITRUS = (176, 84, 44)
PAPER = (255, 255, 255)
CREAM = (247, 241, 232)


def build_qr_with_mark() -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=28,
        border=2,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")

    qw, qh = qr_img.size
    logo = Image.open(MARK).convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    max_logo = int(min(qw, qh) * 0.22)
    logo.thumbnail((max_logo, max_logo), Image.Resampling.LANCZOS)
    lw, lh = logo.size
    pad = int(max(lw, lh) * 0.18)
    plate = Image.new("RGBA", (lw + pad * 2, lh + pad * 2), (255, 255, 255, 255))
    plate.paste(logo, (pad, pad), logo)
    px, py = (qw - plate.width) // 2, (qh - plate.height) // 2
    qr_img.paste(plate, (px, py), plate)
    return qr_img


def main() -> None:
    qr_img = build_qr_with_mark()
    qr_img.convert("RGB").save(OUT / "qr-sistersflowers.png", "PNG", dpi=(300, 300))

    header = Image.open(WORDMARK).convert("RGBA")
    hb = header.getbbox()
    if hb:
        header = header.crop(hb)

    card_w = 1800
    margin = 120
    gap = 48
    header_max_w = card_w - margin * 2
    header.thumbnail((header_max_w, 280), Image.Resampling.LANCZOS)

    try:
        font_domain = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 54
        )
    except OSError:
        font_domain = ImageFont.load_default()

    domain = "sistersflowers.vn"
    tmp = Image.new("RGB", (10, 10))
    d0 = ImageDraw.Draw(tmp)
    dbbox = d0.textbbox((0, 0), domain, font=font_domain)
    dw, dh = dbbox[2] - dbbox[0], dbbox[3] - dbbox[1]

    qr_side = card_w - margin * 2
    qr_print = qr_img.resize((qr_side, qr_side), Image.Resampling.NEAREST)

    card_h = margin + header.height + gap + qr_print.height + gap + dh + margin
    card = Image.new("RGB", (card_w, card_h), PAPER)
    draw = ImageDraw.Draw(card)

    y = margin
    hx = (card_w - header.width) // 2
    card.paste(header, (hx, y), header)
    y += header.height + gap
    qx = (card_w - qr_print.width) // 2
    card.paste(qr_print, (qx, y), qr_print)
    y += qr_print.height + gap
    dx = (card_w - dw) // 2
    draw.text((dx, y), domain, font=font_domain, fill=CITRUS)

    card.save(OUT / "qr-print-card.png", "PNG", dpi=(300, 300))
    card.save(OUT / "qr-print-card.pdf", "PDF", resolution=300.0)

    poster_pad = 40
    poster = Image.new(
        "RGB", (card_w + poster_pad * 2, card_h + poster_pad * 2), CITRUS
    )
    inner = Image.new("RGB", (card_w, card_h), CREAM)
    inner_draw = ImageDraw.Draw(inner)
    y = margin
    inner.paste(header, (hx, y), header)
    y += header.height + gap
    inner.paste(qr_print, (qx, y), qr_print)
    y += qr_print.height + gap
    inner_draw.text((dx, y), domain, font=font_domain, fill=CITRUS)
    poster.paste(inner, (poster_pad, poster_pad))
    poster.save(OUT / "qr-print-poster.png", "PNG", dpi=(300, 300))

    print("Wrote QR print assets to", OUT)


if __name__ == "__main__":
    main()
