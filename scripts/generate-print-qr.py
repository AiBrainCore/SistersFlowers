#!/usr/bin/env python3
"""Generate Sisters Flowers print QR assets into public/brand/.

Primary card: horizontal wordmark on top, QR with framed SF mark,
bold sistersflowers.vn close under the code, rounded citrus outer frame.

Requires: pip install 'qrcode[pil]' pillow numpy
"""

from pathlib import Path
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brand"
MARK = OUT / "mark-black.png"
WORDMARK_H = OUT / "wordmark-black.png"
URL = "https://sistersflowers.vn"
CITRUS = (176, 84, 44)
INK = (34, 30, 26)
PAPER = (255, 255, 255)
CREAM = (252, 248, 242)


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, **kwargs)


def make_qr(border: int = 4) -> Image.Image:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=32, border=border)
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    qw, qh = img.size

    logo = Image.open(MARK).convert("RGBA")
    bb = logo.getbbox()
    if bb:
        logo = logo.crop(bb)
    max_logo = int(min(qw, qh) * 0.19)
    logo.thumbnail((max_logo, max_logo), Image.Resampling.LANCZOS)
    lw, lh = logo.size
    pad = int(max(lw, lh) * 0.26)
    side = max(lw, lh) + pad * 2
    plate = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    d = ImageDraw.Draw(plate)
    rounded_rect(
        d, (3, 3, side - 4, side - 4), radius=22, outline=CITRUS + (255,), width=10
    )
    rounded_rect(
        d,
        (16, 16, side - 17, side - 17),
        radius=14,
        outline=(50, 45, 40, 70),
        width=2,
    )
    plate.paste(logo, ((side - lw) // 2, (side - lh) // 2), logo)
    img.paste(plate, ((qw - side) // 2, (qh - side) // 2), plate)
    return img


def crop_quiet(qr_img: Image.Image, keep: int = 24) -> Image.Image:
    """Keep a small quiet zone; drop excess white for tighter print layout."""
    arr = np.asarray(qr_img.convert("L"))
    dark = arr < 250
    rows = np.where(dark.any(axis=1))[0]
    cols = np.where(dark.any(axis=0))[0]
    top, bot = int(rows[0]), int(rows[-1])
    left, right = int(cols[0]), int(cols[-1])
    t = max(0, top - keep)
    b = min(arr.shape[0] - 1, bot + keep)
    l = max(0, left - keep)
    r = min(arr.shape[1] - 1, right + keep)
    return qr_img.crop((l, t, r + 1, b + 1))


def build_card(*, use_logo_header: bool) -> Image.Image:
    qr_img = crop_quiet(make_qr(border=4), keep=24)

    canvas_w = 1600
    frame_inset = 44
    frame_radius = 52
    frame_stroke = 10
    pad_x = 64
    pad_top = 44
    pad_bottom = 40
    gap_top = 18
    gap_bot = 10

    inner_w = canvas_w - frame_inset * 2 - pad_x * 2

    if use_logo_header:
        header = Image.open(WORDMARK_H).convert("RGBA")
        bb = header.getbbox()
        if bb:
            header = header.crop(bb)
        header.thumbnail((int(inner_w * 0.96), 100), Image.Resampling.LANCZOS)
        header_img = header
    else:
        try:
            font_title = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 76
            )
        except OSError:
            font_title = ImageFont.load_default()
        title = "sistersflowers"
        tmp = Image.new("RGBA", (10, 10))
        td = ImageDraw.Draw(tmp)
        tb = td.textbbox((0, 0), title, font=font_title)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        header_img = Image.new("RGBA", (tw + 4, th + 4), (0, 0, 0, 0))
        ImageDraw.Draw(header_img).text(
            (2 - tb[0], 2 - tb[1]), title, font=font_title, fill=INK + (255,)
        )

    try:
        font_domain = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 78
        )
    except OSError:
        font_domain = ImageFont.load_default()

    domain = "sistersflowers.vn"
    tmp = Image.new("RGBA", (10, 10))
    dd = ImageDraw.Draw(tmp)
    db = dd.textbbox((0, 0), domain, font=font_domain)
    dw, dh = db[2] - db[0], db[3] - db[1]
    domain_img = Image.new("RGBA", (dw + 8, dh + 10), (0, 0, 0, 0))
    ImageDraw.Draw(domain_img).text(
        (4 - db[0], 3 - db[1]), domain, font=font_domain, fill=CITRUS + (255,)
    )

    scale = inner_w / qr_img.width
    qr_print = qr_img.resize(
        (inner_w, int(qr_img.height * scale)), Image.Resampling.NEAREST
    )

    header_h = header_img.height
    domain_h = domain_img.height
    content_h = header_h + gap_top + qr_print.height + gap_bot + domain_h
    canvas_h = frame_inset * 2 + pad_top + content_h + pad_bottom

    canvas = Image.new("RGB", (canvas_w, canvas_h), PAPER)
    draw = ImageDraw.Draw(canvas)
    rounded_rect(
        draw,
        (
            frame_inset,
            frame_inset,
            canvas_w - frame_inset - 1,
            canvas_h - frame_inset - 1,
        ),
        radius=frame_radius,
        outline=CITRUS,
        width=frame_stroke,
    )

    x0 = frame_inset + pad_x
    y = frame_inset + pad_top
    canvas.paste(
        header_img, (x0 + (inner_w - header_img.width) // 2, y), header_img
    )
    y += header_h + gap_top

    qr_frame_pad = 12
    rounded_rect(
        draw,
        (
            x0 - qr_frame_pad,
            y - qr_frame_pad,
            x0 + qr_print.width + qr_frame_pad - 1,
            y + qr_print.height + qr_frame_pad - 1,
        ),
        radius=28,
        outline=(210, 170, 140),
        width=3,
    )
    canvas.paste(qr_print.convert("RGB"), (x0, y))
    y += qr_print.height + gap_bot
    canvas.paste(
        domain_img, (x0 + (inner_w - domain_img.width) // 2, y), domain_img
    )
    return canvas


def main() -> None:
    card = build_card(use_logo_header=True)
    card.save(OUT / "qr-print-card.png", "PNG", dpi=(300, 300))
    card.save(OUT / "qr-print-card.pdf", "PDF", resolution=300.0)

    card_text = build_card(use_logo_header=False)
    card_text.save(OUT / "qr-print-card-text.png", "PNG", dpi=(300, 300))

    make_qr(border=2).convert("RGB").save(
        OUT / "qr-sistersflowers.png", "PNG", dpi=(300, 300)
    )

    pad = 36
    poster = Image.new("RGB", (card.width + pad * 2, card.height + pad * 2), CITRUS)
    poster.paste(Image.new("RGB", card.size, CREAM), (pad, pad))
    poster.paste(card, (pad, pad))
    poster.save(OUT / "qr-print-poster.png", "PNG", dpi=(300, 300))

    print("Wrote QR print assets to", OUT)


if __name__ == "__main__":
    main()
