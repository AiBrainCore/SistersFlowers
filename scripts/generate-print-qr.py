#!/usr/bin/env python3
"""Generate Sisters Flowers print QR assets into public/brand/.

Symmetric print card with equal top/bottom bands:
  - horizontal wordmark optically centered between outer frame and thin rule
  - QR with smaller framed SF mark (white gap to modules)
  - sistersflowers.vn optically centered in the matching bottom band

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
CITRUS_SOFT = (210, 170, 140)
INK = (34, 30, 26)
PAPER = (255, 255, 255)
CREAM = (252, 248, 242)


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, **kwargs)


def ink_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    """Visible ink box (ignores sparse tulip overflow for optical centering)."""
    arr = np.asarray(im.convert("RGBA"))
    alpha = arr[:, :, 3] > 16
    dark = (arr[:, :, 0] < 210) | (arr[:, :, 1] < 180)
    ink = alpha & dark
    ys, xs = np.where(ink)
    if len(ys) == 0:
        return 0, 0, im.width, im.height
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def make_qr_base(border: int = 4) -> Image.Image:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=32, border=border)
    qr.add_data(URL)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGBA")


def paste_framed_mark(qr_img: Image.Image) -> Image.Image:
    qw, qh = qr_img.size
    logo = Image.open(MARK).convert("RGBA")
    bb = logo.getbbox()
    if bb:
        logo = logo.crop(bb)

    max_logo = int(min(qw, qh) * 0.145)
    logo.thumbnail((max_logo, max_logo), Image.Resampling.LANCZOS)
    lw, lh = logo.size
    inner_pad = int(max(lw, lh) * 0.30)
    frame_w = 6
    gap = int(min(qw, qh) * 0.045)  # white ring — frame must not kiss modules
    content = max(lw, lh) + inner_pad * 2
    side = content + frame_w * 2 + gap * 2

    plate = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    d = ImageDraw.Draw(plate)
    inset = gap
    rounded_rect(
        d,
        (inset, inset, side - inset - 1, side - inset - 1),
        radius=16,
        outline=CITRUS + (255,),
        width=frame_w,
    )
    plate.paste(logo, ((side - lw) // 2, (side - lh) // 2), logo)
    qr_img.paste(plate, ((qw - side) // 2, (qh - side) // 2), plate)
    return qr_img


def crop_quiet(qr_img: Image.Image, keep: int = 20) -> Image.Image:
    arr = np.asarray(qr_img.convert("L"))
    dark = arr < 250
    rows = np.where(dark.any(axis=1))[0]
    cols = np.where(dark.any(axis=0))[0]
    t = max(0, int(rows[0]) - keep)
    b = min(arr.shape[0] - 1, int(rows[-1]) + keep)
    l = max(0, int(cols[0]) - keep)
    r = min(arr.shape[1] - 1, int(cols[-1]) + keep)
    return qr_img.crop((l, t, r + 1, b + 1))


def place_centered_in_band(
    canvas: Image.Image,
    artwork: Image.Image,
    band_y0: int,
    band_h: int,
    x0: int,
    area_w: int,
) -> None:
    """Center the visible ink (not transparent padding) inside the band."""
    ix0, iy0, ix1, iy1 = ink_bbox(artwork)
    ink_h = iy1 - iy0
    target_ink_y0 = band_y0 + (band_h - ink_h) // 2
    paste_y = target_ink_y0 - iy0
    paste_x = x0 + (area_w - artwork.width) // 2
    canvas.paste(artwork, (paste_x, paste_y), artwork)


def build_card(*, use_logo_header: bool) -> Image.Image:
    qr_img = crop_quiet(paste_framed_mark(make_qr_base(border=4)), keep=20)

    canvas_w = 1600
    frame_inset = 40
    frame_stroke = 12
    frame_radius = 48
    side_pad = 56
    rail_pad = 10
    band_h = 160  # identical top & bottom

    inner_w = canvas_w - (frame_inset + side_pad) * 2
    scale = inner_w / qr_img.width
    qr_print = qr_img.resize(
        (inner_w, int(qr_img.height * scale)), Image.Resampling.NEAREST
    )

    if use_logo_header:
        header = Image.open(WORDMARK_H).convert("RGBA")
        bb = header.getbbox()
        if bb:
            header = header.crop(bb)
        ix0, iy0, ix1, iy1 = ink_bbox(header)
        ink_h = max(iy1 - iy0, 1)
        target_ink_h = int(band_h * 0.48)
        scale_h = target_ink_h / ink_h
        header = header.resize(
            (
                max(1, int(header.width * scale_h)),
                max(1, int(header.height * scale_h)),
            ),
            Image.Resampling.LANCZOS,
        )
        if header.width > int(inner_w * 0.92):
            ratio = (inner_w * 0.92) / header.width
            header = header.resize(
                (int(header.width * ratio), int(header.height * ratio)),
                Image.Resampling.LANCZOS,
            )
        header_img = header
    else:
        try:
            font_title = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 60
            )
        except OSError:
            font_title = ImageFont.load_default()
        title = "sistersflowers"
        tmp = Image.new("RGBA", (10, 10))
        tb = ImageDraw.Draw(tmp).textbbox((0, 0), title, font=font_title)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        header_img = Image.new("RGBA", (tw + 4, th + 4), (0, 0, 0, 0))
        ImageDraw.Draw(header_img).text(
            (2 - tb[0], 2 - tb[1]), title, font=font_title, fill=INK + (255,)
        )

    try:
        font_domain = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 62
        )
    except OSError:
        font_domain = ImageFont.load_default()
    domain = "sistersflowers.vn"
    tmp = Image.new("RGBA", (10, 10))
    db = ImageDraw.Draw(tmp).textbbox((0, 0), domain, font=font_domain)
    dw, dh = db[2] - db[0], db[3] - db[1]
    domain_img = Image.new("RGBA", (dw + 4, dh + 4), (0, 0, 0, 0))
    ImageDraw.Draw(domain_img).text(
        (2 - db[0], 2 - db[1]), domain, font=font_domain, fill=CITRUS + (255,)
    )
    dix0, diy0, dix1, diy1 = ink_bbox(domain_img)
    d_ink_h = max(diy1 - diy0, 1)
    target_dom_h = int(band_h * 0.42)
    sc = target_dom_h / d_ink_h
    domain_img = domain_img.resize(
        (
            max(1, int(domain_img.width * sc)),
            max(1, int(domain_img.height * sc)),
        ),
        Image.Resampling.LANCZOS,
    )

    qr_block_h = qr_print.height + rail_pad * 2
    canvas_h = (
        frame_inset
        + frame_stroke
        + band_h
        + qr_block_h
        + band_h
        + frame_stroke
        + frame_inset
    )

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

    top_band_y0 = frame_inset + frame_stroke
    top_band_y1 = top_band_y0 + band_h
    bot_band_y0 = top_band_y1 + qr_block_h
    x0 = frame_inset + side_pad
    qr_y = top_band_y1 + rail_pad

    rule_left = frame_inset + side_pad - 8
    rule_right = canvas_w - frame_inset - side_pad + 8
    draw.line(
        (rule_left, top_band_y1, rule_right, top_band_y1),
        fill=CITRUS_SOFT,
        width=2,
    )
    draw.line(
        (rule_left, bot_band_y0, rule_right, bot_band_y0),
        fill=CITRUS_SOFT,
        width=2,
    )
    rounded_rect(
        draw,
        (
            x0 - rail_pad,
            top_band_y1,
            x0 + qr_print.width + rail_pad - 1,
            bot_band_y0 - 1,
        ),
        radius=24,
        outline=CITRUS_SOFT,
        width=3,
    )

    place_centered_in_band(canvas, header_img, top_band_y0, band_h, x0, inner_w)
    canvas.paste(qr_print.convert("RGB"), (x0, qr_y))
    place_centered_in_band(canvas, domain_img, bot_band_y0, band_h, x0, inner_w)
    return canvas


def main() -> None:
    card = build_card(use_logo_header=True)
    card.save(OUT / "qr-print-card.png", "PNG", dpi=(300, 300))
    card.save(OUT / "qr-print-card.pdf", "PDF", resolution=300.0)

    build_card(use_logo_header=False).save(
        OUT / "qr-print-card-text.png", "PNG", dpi=(300, 300)
    )
    paste_framed_mark(make_qr_base(border=2)).convert("RGB").save(
        OUT / "qr-sistersflowers.png", "PNG", dpi=(300, 300)
    )

    pad = 36
    poster = Image.new("RGB", (card.width + pad * 2, card.height + pad * 2), CITRUS)
    poster.paste(Image.new("RGB", card.size, CREAM), (pad, pad))
    poster.paste(card, (pad, pad))
    poster.save(OUT / "qr-print-poster.png", "PNG", dpi=(300, 300))
    print("Wrote", OUT, "card", card.size)


if __name__ == "__main__":
    main()
