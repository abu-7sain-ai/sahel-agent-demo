"""Measures layout and colours from the Sahel screenshots (576x1280, Android).

Reads screenshots/ (git-ignored, contains personal data) and prints ONLY geometry and colours:
no text, no values. CSS px = screenshot px / SCALE (576/390).
Run: python scripts/measure.py
"""
import os
from collections import Counter
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'screenshots')
SCALE = 576 / 390


def load(n):
    return Image.open(os.path.join(ROOT, f'sahel_{n:02d}.jpg')).convert('RGB')


def css(v):
    return round(v / SCALE, 1)


def hexc(c):
    return '#%02X%02X%02X' % tuple(c)


def mode(im, box):
    px = list(im.crop(box).get_flattened_data())
    # quantise to absorb JPEG noise, then return the mean of the most common bucket
    q = Counter((r // 4, g // 4, b // 4) for r, g, b in px).most_common(1)[0][0]
    sel = [p for p in px if (p[0] // 4, p[1] // 4, p[2] // 4) == q]
    return tuple(round(sum(c[i] for c in sel) / len(sel)) for i in range(3))


def dist(a, b):
    return sum(abs(x - y) for x, y in zip(a, b))


def runs(values, pred):
    """[start, end] index runs where pred(value) is true."""
    out, start = [], None
    for i, v in enumerate(values):
        if pred(v) and start is None:
            start = i
        elif not pred(v) and start is not None:
            out.append((start, i - 1)); start = None
    if start is not None:
        out.append((start, len(values) - 1))
    return out


def column(im, x, y0=0, y1=None):
    y1 = y1 or im.height
    return [im.getpixel((x, y)) for y in range(y0, y1)]


def row(im, y, x0=0, x1=None):
    x1 = x1 or im.width
    return [im.getpixel((x, y)) for x in range(x0, x1)]


def ink_bbox(im, box, bg, thr=60):
    """Bounding box of pixels that differ from bg (text/icon ink) inside box."""
    x0, y0, x1, y1 = box
    xs, ys = [], []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if dist(im.getpixel((x, y)), bg) > thr:
                xs.append(x); ys.append(y)
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def brightest(im, box, key):
    px = list(im.crop(box).get_flattened_data())
    return max(px, key=key)


def report():
    s = load(6)  # services list, top
    bg = mode(s, (200, 120, 400, 150))
    print('page background', hexc(bg))
    nav_bg = mode(s, (100, 1255, 300, 1265))
    print('bottom nav background', hexc(nav_bg))
    # nav top edge: first y from bottom upwards where colour changes from nav bg to list
    col = column(s, 300, 1100, 1280)
    for i, c in enumerate(col):
        if dist(c, nav_bg) < 12:
            print('bottom nav top y', 1100 + i, 'css', css(1100 + i), 'height css', css(1280 - (1100 + i))); break

    # search field: colour and bounds
    field = mode(s, (150, 180, 280, 195))
    print('search field', hexc(field))
    r = row(s, 187)
    fr = runs(r, lambda c: dist(c, field) < 14)
    big = max(fr, key=lambda t: t[1] - t[0])
    c = column(s, 200, 120, 240)
    fc = max(runs(c, lambda v: dist(v, field) < 14), key=lambda t: t[1] - t[0])
    print('search field x', big, 'y', (120 + fc[0], 120 + fc[1]), 'css: left', css(big[0]), 'right', css(576 - big[1]), 'top', css(120 + fc[0]), 'height', css(fc[1] - fc[0] + 1))

    # agency row dividers (look for slightly lighter lines on the bg)
    c = column(s, 60, 230, 1150)
    divs = [230 + a for a, b in runs(c, lambda v: 6 < dist(v, bg) < 60 and v[0] > bg[0])]
    divs = [d for i, d in enumerate(divs) if i == 0 or d - divs[i - 1] > 20]
    print('agency dividers y', divs)
    gaps = [b - a for a, b in zip(divs, divs[1:])]
    print('agency row pitch px', gaps, 'css', [css(g) for g in gaps])
    if divs:
        print('divider colour', hexc(s.getpixel((300, divs[1]))))
        dr = runs(row(s, divs[1]), lambda v: 6 < dist(v, bg) < 60)
        print('divider x span', dr[0][0], dr[-1][1], 'css left', css(dr[0][0]), 'right', css(576 - dr[-1][1]))

    # logo circle of 2nd agency row (between dividers 0 and 1)
    y = (divs[0] + divs[1]) // 2
    r = row(s, y, 470, 576)
    lr = runs(r, lambda v: dist(v, bg) > 40)
    print('logo x', 470 + lr[0][0], 470 + lr[-1][1], 'diameter css', css(lr[-1][1] - lr[0][0] + 1), 'right margin css', css(576 - (470 + lr[-1][1]) - 1))
    lc = runs(column(s, 470 + (lr[0][0] + lr[-1][1]) // 2, divs[0] + 2, divs[1] - 1), lambda v: dist(v, bg) > 40)
    print('logo y', divs[0] + 2 + lc[0][0], divs[0] + 2 + lc[-1][1], 'top offset css', css(lc[0][0] + 2))

    # agency name text box in row 2
    tb = ink_bbox(s, (60, divs[0] + 3, 490, divs[1] - 2), bg, 90)
    print('agency text bbox', tb, 'ink height css', css(tb[3] - tb[1] + 1), 'right edge css from screen right', css(576 - tb[2]))
    print('agency text colour', hexc(brightest(s, (tb[0], tb[1], tb[2], tb[3]), key=sum)))
    cb = ink_bbox(s, (10, divs[0] + 3, 50, divs[1] - 2), bg, 90)
    print('agency chevron bbox', cb, 'css x', css(cb[0]), 'w', css(cb[2] - cb[0] + 1), 'h', css(cb[3] - cb[1] + 1))

    # title and header icons
    tb = ink_bbox(s, (380, 50, 576, 115), bg, 90)
    print('title bbox', tb, 'css right', css(576 - tb[2]), 'top', css(tb[1]), 'ink h', css(tb[3] - tb[1] + 1), 'w', css(tb[2] - tb[0] + 1))
    ib = ink_bbox(s, (0, 50, 140, 115), bg, 90)
    print('header icons bbox', ib, 'css left', css(ib[0]), 'top', css(ib[1]), 'w', css(ib[2] - ib[0] + 1), 'h', css(ib[3] - ib[1] + 1))
    m1 = ink_bbox(s, (0, 50, 70, 115), bg, 90); m2 = ink_bbox(s, (80, 50, 140, 115), bg, 90)
    print('menu icon', m1, 'css', [css(v) for v in m1], '| megaphone', m2, 'css', [css(v) for v in m2])
    st = ink_bbox(s, (440, 5, 576, 40), bg, 90)
    print('clock bbox', st, 'css right', css(576 - st[2]), 'ink h', css(st[3] - st[1] + 1))
    sb = ink_bbox(s, (0, 5, 140, 40), bg, 60)
    print('status icons bbox', sb, 'css left', css(sb[0]), 'w', css(sb[2] - sb[0] + 1), 'h', css(sb[3] - sb[1] + 1))
    ph = ink_bbox(s, (290, 170, 500, 205), field, 50)
    print('search placeholder bbox', ph, 'ink h css', css(ph[3] - ph[1] + 1), 'colour', hexc(brightest(s, ph, key=sum)))
    si = ink_bbox(s, (495, 170, 530, 205), field, 50)
    print('search icon bbox', si, 'css', [css(v) for v in si])

    # bottom nav: icons + labels per tab, active colour, badge
    for name, box in [('بيانات', (480, 1160, 576, 1250)), ('خدمات', (340, 1160, 470, 1250)), ('إشعارات', (240, 1160, 340, 1250)), ('مواعيد', (110, 1160, 230, 1250)), ('بلّغ', (0, 1160, 100, 1250))]:
        b = ink_bbox(s, box, nav_bg, 70)
        print('nav', name, 'bbox', b, 'css centre x', css((b[0] + b[2]) / 2), 'top', css(b[1]))
    print('nav active colour', hexc(brightest(s, (380, 1170, 420, 1210), key=lambda c: c[2] - c[0])))
    print('nav inactive colour', hexc(brightest(s, (500, 1170, 540, 1210), key=sum)))
    bd = ink_bbox(s, (470, 1155, 505, 1185), nav_bg, 100)
    print('badge bbox', bd, 'css', [css(v) for v in bd], 'colour', hexc(brightest(s, bd, key=lambda c: c[0] - c[2])))
    lb = ink_bbox(s, (370, 1220, 440, 1245), nav_bg, 70)
    print('nav label ink h css', css(lb[3] - lb[1] + 1), 'top css', css(lb[1]))
    gb = ink_bbox(s, (150, 1262, 430, 1275), nav_bg, 60)
    print('gesture bar', gb)

    # categories (sahel_09) and services (sahel_10)
    c9 = load(9)
    bg9 = mode(c9, (200, 120, 400, 150))
    print('--- categories (09) bg', hexc(bg9))
    col = column(c9, 420, 290, 700)
    texts = runs(col, lambda v: v[2] > 150 and v[2] - v[0] > 60)
    print('blue text runs y', [(290 + a, 290 + b) for a, b in texts])
    print('category blue', hexc(brightest(c9, (380, 470, 540, 500), key=lambda c: c[2] - c[0] + c[2])))
    for y0, y1 in [(405, 445), (800, 840)]:
        b = ink_bbox(c9, (150, y0, 545, y1), bg9, 90)
        print('category text bbox', b, 'css right', css(576 - b[2]), 'ink h', css(b[3] - b[1] + 1))
    tri = ink_bbox(c9, (10, 405, 50, 445), bg9, 70)
    print('category triangle', tri, 'css', [css(v) for v in tri], 'colour', hexc(brightest(c9, tri, key=sum)))

    c10 = load(10)
    bg10 = mode(c10, (200, 120, 400, 150))
    c = column(c10, 60, 320, 1150)
    divs = [320 + a for a, b in runs(c, lambda v: 6 < dist(v, bg10) < 60 and v[0] > bg10[0])]
    divs = [d for i, d in enumerate(divs) if i == 0 or d - divs[i - 1] > 20]
    print('--- services (10) dividers', divs, 'pitch css', [css(b - a) for a, b in zip(divs, divs[1:])])
    dr = runs(row(c10, divs[1]), lambda v: 6 < dist(v, bg10) < 60)
    print('service divider x span', dr[0][0], dr[-1][1], 'css left', css(dr[0][0]), 'right', css(576 - dr[-1][1]))
    b = ink_bbox(c10, (100, divs[0] + 3, 560, divs[1] - 2), bg10, 90)
    print('service text bbox', b, 'css right', css(576 - b[2]), 'ink h', css(b[3] - b[1] + 1), 'colour', hexc(brightest(c10, b, key=sum)))
    cv = ink_bbox(c10, (0, divs[0] + 3, 60, divs[1] - 2), bg10, 90)
    print('service chevron', cv, 'css', [css(v) for v in cv])

    # data tab (01, unscrolled): avatar, search, view-mode row, rows, alert dot, help button
    d = load(1)
    bgd = mode(d, (200, 400, 400, 420))
    print('--- data (01) page bg', hexc(bgd))
    av = runs(row(d, 180, 400, 576), lambda c: dist(c, bgd) > 30)
    avc = runs(column(d, 500, 110, 250), lambda c: dist(c, bgd) > 30)
    print('avatar x', 400 + av[0][0], 400 + av[-1][1], 'diameter css', css(av[-1][1] - av[0][0] + 1), 'right css', css(576 - (400 + av[-1][1])), 'top css', css(110 + avc[0][0]))
    sf = (0x14, 0x14, 0x14)
    fr = runs(row(d, 262), lambda c: dist(c, sf) < 10)
    fc = runs(column(d, 200, 220, 320), lambda c: dist(c, sf) < 10)
    print('data search x', fr[0][0], fr[-1][1], 'css left', css(fr[0][0]), 'y', 220 + fc[0][0], 220 + fc[0][1], 'css top', css(220 + fc[0][0]), 'h', css(fc[0][1] - fc[0][0] + 1))
    print('view-mode icons x runs', runs(row(d, 356, 0, 100), lambda c: dist(c, bgd) > 40), 'blue', hexc(d.getpixel((72, 352))), 'grey', hexc(d.getpixel((35, 350))))
    divs = [300 + a for a, b in runs(column(d, 60, 300, 1150), lambda c: 6 < dist(c, bgd) < 60 and c[0] > bgd[0])]
    divs = [x for i, x in enumerate(divs) if i == 0 or x - divs[i - 1] > 20]
    print('data dividers', divs[:6], 'pitch css', [css(b - a) for a, b in zip(divs, divs[1:])][:5])
    rd = runs(row(d, 862, 40, 100), lambda c: c[0] > 150 and c[1] < 80)
    print('red dot x', 40 + rd[0][0], 40 + rd[0][1], 'css left', css(40 + rd[0][0]), 'size', css(rd[0][1] - rd[0][0] + 1), 'colour', hexc(d.getpixel((67, 862))))
    hb = runs(row(d, 1085, 0, 120), lambda c: dist(c, bgd) > 25)
    hc = runs(column(d, 54, 1030, 1150), lambda c: dist(c, bgd) > 25)
    print('help button x', hb[0], 'y', (1030 + hc[0][0], 1030 + hc[0][1]), 'css left', css(hb[0][0]), 'top', css(1030 + hc[0][0]), 'size', css(hb[0][1] - hb[0][0] + 1), 'colour', hexc(d.getpixel((40, 1100))))

    # data tab collapsed header (16): navy band, avatar, search
    h16 = load(16)
    head = h16.getpixel((300, 160))
    print('--- collapsed header (16) colour', hexc(head), 'search', hexc(h16.getpixel((200, 180))))
    hb = runs(column(h16, 10, 0, 300), lambda c: dist(c, head) < 12)
    print('header band y', hb[0], 'css bottom', css(hb[0][1] + 1))

    # data fields (19): sub-section rows, blue label, value boxes, dots
    f = load(19)
    bgf = mode(f, (200, 1060, 400, 1080))
    print('--- fields (19) sub-section dividers', [400 + a for a, b in runs(column(f, 100, 400, 560), lambda c: 6 < dist(c, bgf) < 60 and c[0] > bgf[0])])
    print('sub-section divider x span', runs(row(f, 487), lambda c: 6 < dist(c, bgf) < 60))
    box = runs(column(f, 250, 590, 860), lambda c: dist(c, bgf) > 25)
    print('value box border rows y', [(590 + a, 590 + b) for a, b in box], 'height css', css(box[1][1] - box[0][0] + 1), 'pitch css', css(box[2][0] - box[0][0]))
    bx = runs(row(f, 632), lambda c: dist(c, bgf) > 25)
    print('value box x', bx[0][0], bx[-1][1], 'css left', css(bx[0][0]), 'right inset', css(576 - bx[-1][1] - 1), 'border', hexc(f.getpixel((19, 632))))
    print('dots x', [(30 + a, 30 + b) for a, b in runs(row(f, 632, 30, 110), lambda c: dist(c, bgf) > 60)])
    yd = runs(row(f, 822, 70, 120), lambda c: c[0] > 180 and c[2] < 120)
    print('yellow dot in box x', 70 + yd[0][0], 70 + yd[0][1], 'css left', css(70 + yd[0][0]), 'colour', hexc(f.getpixel((92, 822))))
    lb = ink_bbox(f, (300, 560, 576, 600), bgf, 90)
    print('blue label bbox', lb, 'css right', css(576 - lb[2]), 'colour', hexc(brightest(f, lb, key=lambda c: c[2] - c[0])))


if __name__ == '__main__':
    report()
