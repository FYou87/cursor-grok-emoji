#!/usr/bin/env python3
"""Build transparent pack PNGs, the README banner, and the key preview.

Reads the original white-background sheets and per-key PNGs from the source
zip (default: the uploaded grok-emoji-images zip) and writes:

  assets/emoji/grok/images/<key>.png   256x256 transparent pack images
  assets/emoji/grok/pack.json
  assets/readme/banner.png
  assets/readme/preview.png
  assets/readme/sheets/sheet-1.jpg … sheet-5.jpg
  plugin/assets/logo.png

Background removal flood-fills near-white pixels that touch the canvas edge,
then feathers the light fringe. Interior whites (eyes, popcorn, paper) stay.
"""

from __future__ import annotations

import argparse
import json
import zipfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
KEYS = [
    "happy", "sad", "confused", "watching", "angry", "speechless", "doge",
    "overloaded", "neutral", "laughing", "crying", "sweating", "thinking",
    "okay", "nodding", "sleeping", "hurt", "peeking", "approve", "heart",
    "shy", "star-eyes", "laugh-cry", "touched", "scared", "facepalm",
    "eye-roll", "sigh", "frustrated", "playful", "snickering", "sarcastic",
    "cool", "celebrate", "cheer", "thanks", "sorry", "hug", "please",
    "applause",
]
BANNER_KEYS = ["happy", "doge", "celebrate", "heart", "cool", "applause"]
FONT_CN = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
FONT_EN = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"
FONT_EN_BOLD = "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf"


def knock_white(im: Image.Image, thresh: int = 246, neutral: int = 18) -> Image.Image:
    im = im.convert("RGBA")
    arr = np.array(im)
    height, width = arr.shape[:2]
    red = arr[:, :, 0].astype(np.int16)
    green = arr[:, :, 1].astype(np.int16)
    blue = arr[:, :, 2].astype(np.int16)
    mn = np.minimum(np.minimum(red, green), blue)
    mx = np.maximum(np.maximum(red, green), blue)
    background = (mn >= thresh) & ((mx - mn) <= neutral)

    seen = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((0, x))
        queue.append((height - 1, x))
    for y in range(height):
        queue.append((y, 0))
        queue.append((y, width - 1))
    while queue:
        y, x = queue.popleft()
        if y < 0 or x < 0 or y >= height or x >= width or seen[y, x]:
            continue
        seen[y, x] = True
        if not background[y, x]:
            continue
        arr[y, x, 3] = 0
        queue.append((y + 1, x))
        queue.append((y - 1, x))
        queue.append((y, x + 1))
        queue.append((y, x - 1))

    alpha = arr[:, :, 3]
    for _ in range(2):
        transparent = alpha == 0
        neighbors = np.zeros_like(transparent)
        neighbors[1:] |= transparent[:-1]
        neighbors[:-1] |= transparent[1:]
        neighbors[:, 1:] |= transparent[:, :-1]
        neighbors[:, :-1] |= transparent[:, 1:]
        channel_min = np.minimum(
            np.minimum(arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16)),
            arr[:, :, 2].astype(np.int16),
        )
        channel_max = np.maximum(
            np.maximum(arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16)),
            arr[:, :, 2].astype(np.int16),
        )
        fringe = neighbors & (alpha > 0) & (channel_min >= 210) & ((channel_max - channel_min) <= 30)
        ys, xs = np.where(fringe)
        for y, x in zip(ys.tolist(), xs.tolist()):
            lightness = int(channel_min[y, x])
            faded = int(round((255 - lightness) * 255 / (255 - 210)))
            arr[y, x, 3] = max(0, min(255, faded))
        alpha = arr[:, :, 3]
    return Image.fromarray(arr)


def trim(im: Image.Image, pad: int = 8) -> Image.Image:
    alpha = np.array(im.split()[-1])
    ys, xs = np.where(alpha > 12)
    if len(xs) == 0:
        return im
    left = max(0, int(xs.min()) - pad)
    top = max(0, int(ys.min()) - pad)
    right = min(im.width, int(xs.max()) + pad + 1)
    bottom = min(im.height, int(ys.max()) + pad + 1)
    return im.crop((left, top, right, bottom))


def fit_height(im: Image.Image, height: int) -> Image.Image:
    scale = height / im.height
    size = (max(1, round(im.width * scale)), height)
    return im.resize(size, Image.Resampling.LANCZOS)


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def build_banner(images: dict[str, Image.Image], path: Path) -> None:
    width, height = 1500, 420
    pixels = np.zeros((height, width, 4), dtype=np.uint8)
    for y in range(height):
        t = y / (height - 1)
        pixels[y, :, 0] = int(255 * (1 - t) + 244 * t)
        pixels[y, :, 1] = int(248 * (1 - t) + 240 * t)
        pixels[y, :, 2] = int(243 * (1 - t) + 250 * t)
        pixels[y, :, 3] = 255
    canvas = Image.fromarray(pixels, "RGBA")
    draw = ImageDraw.Draw(canvas)
    title = ImageFont.truetype(FONT_CN, 72)
    sub = ImageFont.truetype(FONT_CN, 26)
    meta = ImageFont.truetype(FONT_EN, 18)
    draw.text((56, 128), "Grok 娘", font=title, fill=(42, 32, 48, 255))
    draw.text((60, 214), "Cursor 对话表情", font=sub, fill=(92, 72, 96, 255))
    draw.text((60, 258), "dsh-emoji-core@1  ·  40 keys", font=meta, fill=(120, 104, 124, 255))

    row = [fit_height(trim(images[key]), 360) for key in BANNER_KEYS]
    gap = 4
    total = sum(im.width for im in row) + gap * (len(row) - 1)
    max_width = 1080
    if total > max_width:
        scale = max_width / total
        row = [
            im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.LANCZOS)
            for im in row
        ]
        total = sum(im.width for im in row) + gap * (len(row) - 1)
    x = width - 28 - total
    for im in row:
        y = (height - im.height) // 2
        canvas.alpha_composite(im, (x, y))
        x += im.width + gap
    save_png(canvas, path)


def build_preview(images: dict[str, Image.Image], path: Path) -> None:
    cols = 8
    cell = 168
    label = 28
    rows = (len(KEYS) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * (cell + label)), (255, 252, 249))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(FONT_EN, 15)
    for index, key in enumerate(KEYS):
        thumb = trim(images[key], pad=4)
        thumb = fit_height(thumb, cell - 16)
        if thumb.width > cell - 8:
            scale = (cell - 8) / thumb.width
            thumb = thumb.resize((cell - 8, max(1, round(thumb.height * scale))), Image.Resampling.LANCZOS)
        plate = Image.new("RGBA", (cell, cell), (255, 252, 249, 255))
        plate.alpha_composite(thumb, ((cell - thumb.width) // 2, (cell - thumb.height) // 2))
        x = (index % cols) * cell
        y = (index // cols) * (cell + label)
        sheet.paste(plate.convert("RGB"), (x, y))
        bbox = draw.textbbox((0, 0), key, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((x + (cell - text_w) / 2, y + cell + 2), key, font=font, fill=(70, 58, 74))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", dest="zip_path", required=True)
    args = parser.parse_args()
    archive = zipfile.ZipFile(args.zip_path)
    names = {info.filename for info in archive.infolist()}
    missing = [key for key in KEYS if f"images/{key}.png" not in names]
    if missing:
        raise SystemExit(f"zip is missing keys: {', '.join(missing)}")

    out_dir = ROOT / "assets" / "emoji" / "grok" / "images"
    images: dict[str, Image.Image] = {}
    for key in KEYS:
        source = Image.open(archive.open(f"images/{key}.png"))
        if source.size != (256, 256):
            raise SystemExit(f"{key} is {source.size}, expected 256x256")
        image = knock_white(source)
        images[key] = image
        save_png(image, out_dir / f"{key}.png")

    pack = {
        "schemaVersion": 1,
        "keySet": "dsh-emoji-core@1",
        "id": "grok",
        "name": "Grok 娘",
        "version": "1.0.0",
        "displayMode": "block",
    }
    pack_path = ROOT / "assets" / "emoji" / "grok" / "pack.json"
    pack_path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sheets = ROOT / "assets" / "readme" / "sheets"
    sheets.mkdir(parents=True, exist_ok=True)
    for index in range(1, 6):
        (sheets / f"sheet-{index}.jpg").write_bytes(archive.read(f"sheet{index}.jpg"))

    build_banner(images, ROOT / "assets" / "readme" / "banner.png")
    build_preview(images, ROOT / "assets" / "readme" / "preview.png")
    save_png(images["happy"], ROOT / "plugin" / "assets" / "logo.png")
    print(f"wrote {len(KEYS)} images")


if __name__ == "__main__":
    main()
