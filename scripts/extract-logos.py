"""Crops each agency's round logo from the Sahel screenshots into public/logos-local/ (LOCAL ONLY).

screenshots/ and public/logos-local/ are git-ignored: the logos are official marks and never go to GitHub.
The page uses public/logos-local/logos.json when it exists, otherwise it shows the letter circles.

How it works: in services-list screenshots every agency row has its logo centred at x≈531 (576-px
screenshots). Full circles are found by scanning that column, then numbered by row position from the first fully visible
logo, whose agency index in the app order is known per screenshot (below). Each logo is cut out with a
round alpha mask (dark background removed) and saved at 2x the CSS size (90 px).
Run: python scripts/extract-logos.py   (then check public/logos-local/contact-sheet.png by eye)
"""
import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..')
SHOTS = os.path.join(ROOT, 'screenshots')
OUT = os.path.join(ROOT, 'public', 'logos-local')
KB = os.path.join(ROOT, 'knowledge', 'services.json')

# screenshot number -> app-order index of the first fully visible logo found (read off the screenshots)
SOURCES = {6: 0, 32: 0, 7: 11, 33: 11, 34: 11, 35: 21, 36: 31}
PITCH = 85.5       # agency row pitch in screenshot px
CX = 531           # logo centre x in screenshot px
LIST_TOP, LIST_BOTTOM = 222, 1150
BG = (0x1C, 0x1C, 0x1E)
SIZE = 90          # 2x of the 44.7-px CSS circle


def dist(a, b):
    return sum(abs(x - y) for x, y in zip(a, b))


def circles(im):
    """Centres (y) of complete logo circles in the list area."""
    ys = [y for y in range(LIST_TOP, LIST_BOTTOM) if any(dist(im.getpixel((x, y)), BG) > 30 for x in (CX - 6, CX, CX + 6))]
    runs, start, prev = [], None, None
    for y in ys:
        if start is None:
            start = y
        elif y - prev > 6:  # allow small gaps inside a logo
            runs.append((start, prev)); start = y
        prev = y
    if start is not None:
        runs.append((start, prev))
    full = [(a, b) for a, b in runs if 58 <= b - a + 1 <= 72 and a > LIST_TOP + 2 and b < LIST_BOTTOM - 2]
    return [((a + b) // 2, (b - a + 1) / 2) for a, b in full]


def cut(im, cy, r):
    r = int(round(r)) + 1
    box = (CX - r, cy - r, CX + r, cy + r)
    crop = im.crop(box).resize((SIZE * 4, SIZE * 4), Image.LANCZOS)
    mask = Image.new('L', crop.size, 0)
    ImageDraw.Draw(mask).ellipse((22, 22, crop.size[0] - 23, crop.size[1] - 23), fill=255)
    crop.putalpha(mask)
    return crop.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    names = [a['name'] for a in json.load(open(KB, encoding='utf8'))['agencies']]
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):  # remove this script's own earlier output (generated files only)
        if f.endswith('.png') or f == 'logos.json':
            os.remove(os.path.join(OUT, f))
    found = {}
    for shot, first in SOURCES.items():
        path = os.path.join(SHOTS, f'sahel_{shot:02d}.jpg')
        if not os.path.exists(path):
            continue
        im = Image.open(path).convert('RGB')
        found_here = circles(im)
        if not found_here:
            continue
        y0 = found_here[0][0]
        # rows the scan missed (logos with dark edges) are taken at their expected position if fully inside the list
        detected = {round((cy - y0) / PITCH) for cy, _ in found_here}
        last = round((found_here[-1][0] - y0) / PITCH)
        extra = [(round(y0 + k * PITCH), 33.0) for k in range(last + 2) if k not in detected
                 and LIST_TOP + 36 < y0 + k * PITCH < LIST_BOTTOM - 36]
        for cy, r in sorted(found_here + extra):
            # number rows by position, so a logo the scan misses cannot shift the names after it
            idx = first + round((cy - y0) / PITCH)
            if idx < len(names) and idx not in found:
                cut(im, cy, r).save(os.path.join(OUT, f'{idx:02d}.png'))
                found[idx] = names[idx]
    mapping = {names[i]: f'logos-local/{i:02d}.png' for i in sorted(found)}
    json.dump(mapping, open(os.path.join(OUT, 'logos.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    # contact sheet for a visual check of the mapping (local only, git-ignored folder)
    sheet = Image.new('RGB', (10 * 100, 4 * 110), BG)
    for i in range(len(names)):
        x, y = (i % 10) * 100 + 5, (i // 10) * 110 + 5
        p = os.path.join(OUT, f'{i:02d}.png')
        if os.path.exists(p):
            sheet.paste(Image.open(p), (x, y), Image.open(p))
        ImageDraw.Draw(sheet).text((x, y + 92), f'{i:02d}', fill=(255, 255, 0))
    sheet.save(os.path.join(OUT, 'contact-sheet.png'))
    print(f'{len(found)} of {len(names)} agencies have a local logo; missing:', [f'{i:02d}' for i in range(len(names)) if i not in found])


if __name__ == '__main__':
    main()
