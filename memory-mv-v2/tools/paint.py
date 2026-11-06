# Watercolour paper-cut painter: renders the V2 scenery as layered PNGs (offline, numpy).
# Transparent watercolour model: paint multiplies the paper; pigment pools at edges; granulation; pencil line.
# usage: python paint.py <out dir>
import sys, os, math, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
R = np.random.default_rng(7)

def noise(h, w, scale, seed, oct=3):
    r = np.random.default_rng(seed); acc = np.zeros((h, w), np.float32); amp = 1; tot = 0
    for o in range(oct):
        s = max(1, scale / (2 ** o)); n = ndi.gaussian_filter(r.standard_normal((h, w)).astype(np.float32), s)
        n /= (n.std() + 1e-6); acc += n * amp; tot += amp; amp *= .5
    return acc / tot

def paper(h, w, tone=(250, 245, 233), seed=1):
    base = np.ones((h, w, 3), np.float32) * np.array(tone, np.float32) / 255
    fib = noise(h, w, 1.2, seed, 2) * .018 + noise(h, w, 18, seed + 1, 2) * .02
    return np.clip(base * (1 + fib[..., None]), 0, 1)

def mask_from(h, w, draw_fn, ss=1):
    im = Image.new('L', (w * ss, h * ss), 0); d = ImageDraw.Draw(im); draw_fn(d, ss)
    if ss > 1: im = im.resize((w, h), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255

def wobble(m, seed, amt=6, scale=14):
    # distort the edge: blur the mask and threshold against noise
    b = ndi.gaussian_filter(m, amt * .6); n = noise(*m.shape, scale, seed, 2) * .18
    return np.clip((b - .5 + n) * 6 + .5, 0, 1)

def wash(img, m, color, density=.75, seed=0, edge=.45, gran=.10, bloom=.18, wob=5):
    """transparent watercolour layer of `color` (rgb 0-255) over img inside mask m"""
    if wob: m = wobble(m, seed, wob)
    c = np.array(color, np.float32) / 255
    soft = ndi.gaussian_filter(m, 6)
    edgek = np.clip(m - soft, 0, 1) * 2.2                               # pigment pooled at the edge
    dens = density * (1 + noise(*m.shape, 40, seed + 3, 3) * bloom) + edgek * edge
    dens += noise(*m.shape, .8, seed + 5, 1) * gran * density             # granulation
    a = np.clip(dens, 0, 1.2) * m
    absorb = (1 - c)[None, None, :] * a[..., None]
    return img * np.clip(1 - absorb, 0, 1)

def pencil(img, m, color=(92, 62, 48), width=1.6, alpha=.55, seed=0):
    e = np.clip(m - ndi.grey_erosion(m, size=(3, 3)), 0, 1)
    e = ndi.gaussian_filter(e, width * .5) * 2.4
    e *= (.65 + .35 * np.clip(noise(*m.shape, 6, seed, 1) + .5, 0, 1))
    c = np.array(color, np.float32) / 255
    a = np.clip(e * alpha, 0, 1)[..., None]
    return img * (1 - a) + c * a

def gradient(h, w, stops, vertical=True):
    t = np.linspace(0, 1, h if vertical else w)
    cols = np.zeros((len(t), 3), np.float32)
    for i in range(3): cols[:, i] = np.interp(t, [s[0] for s in stops], [s[1][i] / 255 for s in stops])
    return np.repeat(cols[:, None, :], w, 1) if vertical else np.repeat(cols[None, :, :], h, 0)

def cutout(img, m, border=10, seed=0, edge_tone=(236, 230, 216)):
    """paper piece: art inside m, an off-white cut border around it, alpha = cut shape"""
    shape = ndi.grey_dilation(m, footprint=disk(border)) if border else m
    shape = np.clip(ndi.gaussian_filter(wobble(shape, seed, 1.2, 30), .7), 0, 1)
    pap = paper(*m.shape, seed=seed + 9)
    inner = ndi.gaussian_filter(m, 1)[..., None]
    rgb = pap * (1 - inner) + img * inner
    # slight shading toward the cut edge (paper thickness)
    ring = np.clip(shape - ndi.gaussian_filter(shape, 3), 0, 1)[..., None]
    rgb = rgb * (1 - ring * .18) + np.array(edge_tone, np.float32) / 255 * ring * .18
    return rgb, shape

def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]; return (x * x + y * y) <= r * r

def save(name, rgb, alpha=None):
    a8 = (np.clip(rgb, 0, 1) * 255 + .5).astype(np.uint8)
    im = Image.fromarray(a8, 'RGB')
    if alpha is not None: im.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255 + .5).astype(np.uint8), 'L'))
    im.save(f'{OUT}/{name}.png'); print(name, im.size)

def trim(rgb, a, pad=4):
    ys, xs = np.where(a > .02); y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad, max(0, xs.min() - pad), xs.max() + pad
    return rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]

# ======================================================================================
# 1. backdrop: dusk/night sky of the argument spread (left cool, right a little warmer)
def backdrop_night():
    h, w = 1200, 1600
    img = gradient(h, w, [(0, (78, 92, 140)), (.6, (128, 132, 170)), (1, (196, 182, 196))])
    img = img * (1 + noise(h, w, 60, 11, 3)[..., None] * .05)
    pap = paper(h, w, seed=3); img = img * .55 + pap * .45 * img / np.maximum(img.mean(), .01) * img.mean()
    for i, (x, y, rx, ry) in enumerate([(320, 380, 300, 70), (1180, 300, 340, 80), (760, 560, 380, 60)]):
        m = mask_from(h, w, lambda d, s: d.ellipse([(x - rx) * s, (y - ry) * s, (x + rx) * s, (y + ry) * s], fill=255), 2)
        img = wash(img, m, (176, 168, 198), .35, seed=20 + i, wob=14)
    # moon
    m = mask_from(h, w, lambda d, s: d.ellipse([1180 * s, 120 * s, 1300 * s, 240 * s], fill=255), 2)
    glow = ndi.gaussian_filter(m, 60) * 1.8
    img = img + (np.array([1, .96, .82]) - img) * np.clip(glow, 0, .55)[..., None]
    img = img * (1 - m[..., None]) + np.array([1, .97, .86]) * m[..., None]
    img = wash(img, m, (240, 220, 170), .25, seed=31, wob=2)
    # stars
    for i in range(46):
        x, y = R.integers(40, w - 40), R.integers(30, h * .55); r = R.uniform(1.5, 3.6)
        m = mask_from(h, w, lambda d, s: d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=255), 2)
        img = img * (1 - m[..., None] * .9) + np.array([1, .97, .85]) * m[..., None] * .9
    save('bd_night', np.clip(img, 0, 1))

# 2. ground page: cream paper, two painted rugs under the phones
def ground_room():
    h, w = 1200, 1600
    img = paper(h, w, (246, 238, 222), seed=5)
    img = wash(img, np.ones((h, w), np.float32), (226, 214, 196), .25, seed=40, wob=0, edge=0)
    for (cx, cy, col, sd) in [(430, 560, (150, 176, 214), 41), (1170, 600, (232, 168, 182), 42)]:
        m = mask_from(h, w, lambda d, s: d.ellipse([(cx - 300) * s, (cy - 150) * s, (cx + 300) * s, (cy + 150) * s], fill=255), 2)
        img = wash(img, m, col, .55, seed=sd, wob=8)
        m2 = mask_from(h, w, lambda d, s: d.ellipse([(cx - 255) * s, (cy - 120) * s, (cx + 255) * s, (cy + 120) * s], outline=255, width=5 * s), 2)
        img = img * (1 - m2[..., None] * .7) + np.array([1, 1, 1]) * m2[..., None] * .7
    # faint floorboard pencil lines
    for y in range(80, h, 130):
        m = mask_from(h, w, lambda d, s: d.line([0, y * s, w * s, (y + 6) * s], fill=255, width=2 * s), 2)
        img = img * (1 - m[..., None] * .12)
    save('gr_room', np.clip(img, 0, 1))

# 3. phone body (paper card) with a transparent screen hole; screen content is composed in the page
def phone(name, body, accent):
    h, w = 1200, 640
    outer = mask_from(h, w, lambda d, s: d.rounded_rectangle([30 * s, 30 * s, (w - 30) * s, (h - 30) * s], 90 * s, fill=255), 2)
    screen = mask_from(h, w, lambda d, s: d.rounded_rectangle([66 * s, 120 * s, (w - 66) * s, (h - 110) * s], 46 * s, fill=255), 2)
    img = paper(h, w, seed=60)
    img = wash(img, outer, body, .85, seed=61, wob=2)
    sheen = mask_from(h, w, lambda d, s: d.polygon([(60 * s, 60 * s), (220 * s, 60 * s), (60 * s, 420 * s)], fill=255), 2)
    img = img + (1 - img) * (ndi.gaussian_filter(sheen, 30) * outer * .22)[..., None]
    img = pencil(img, outer, width=2.2, alpha=.7, seed=62)
    cam = mask_from(h, w, lambda d, s: d.rounded_rectangle([(w / 2 - 70) * s, 66 * s, (w / 2 + 70) * s, 92 * s], 13 * s, fill=255), 2)
    img = wash(img, cam, (40, 40, 52), .9, seed=63, wob=1)
    btn = mask_from(h, w, lambda d, s: d.rounded_rectangle([(w / 2 - 90) * s, (h - 78) * s, (w / 2 + 90) * s, (h - 62) * s], 8 * s, fill=255), 2)
    img = wash(img, btn, accent, .7, seed=64, wob=1)
    rgb, a = cutout(img, outer, 14, seed=65)
    a = a * (1 - screen)                                            # the screen is a hole
    img2 = pencil(rgb, screen, width=2, alpha=.6, seed=66)
    save(name, img2, a)
    # screen rect in image px, for the page
    return (66, 120, w - 66, h - 110)

# 4. chat bubbles
def bubble(name, col, kind):
    h, w = 300, 520
    def shape(d, s):
        d.rounded_rectangle([30 * s, 30 * s, (w - 30) * s, (h - 80) * s], 80 * s, fill=255)
        if kind == 'l': d.polygon([(90 * s, (h - 90) * s), (60 * s, (h - 28) * s), (170 * s, (h - 90) * s)], fill=255)
        else: d.polygon([((w - 90) * s, (h - 90) * s), ((w - 60) * s, (h - 28) * s), ((w - 170) * s, (h - 90) * s)], fill=255)
    m = mask_from(h, w, shape, 2)
    img = wash(paper(h, w, seed=70), m, col, .55, seed=71, wob=3)
    img = pencil(img, m, width=2, alpha=.55, seed=72)
    # "text" as soft pencil scribble lines (no invented words)
    for i, (x0, x1) in enumerate([(90, w - 110), (90, w - 220)]):
        y = 92 + i * 56
        lm = mask_from(h, w, lambda d, s: d.line([x0 * s, y * s, x1 * s, y * s], fill=255, width=14 * s), 2)
        img = wash(img, lm, (255, 255, 255), .0, wob=0) * (1 - lm[..., None] * .0) + 0
        img = img * (1 - lm[..., None] * .55) + np.array([1, 1, 1]) * lm[..., None] * .55
    rgb, a = cutout(img, m, 9, seed=73)
    save(name, rgb, a)
def bubble_dots(name):
    h, w = 220, 360
    m = mask_from(h, w, lambda d, s: d.rounded_rectangle([24 * s, 24 * s, (w - 24) * s, (h - 24) * s], 80 * s, fill=255), 2)
    img = wash(paper(h, w, seed=74), m, (214, 214, 224), .45, seed=75, wob=3)
    img = pencil(img, m, width=2, alpha=.5, seed=76)
    for i in range(3):
        x = 110 + i * 70; dm = mask_from(h, w, lambda d, s: d.ellipse([(x - 18) * s, 92 * s, (x + 18) * s, 128 * s], fill=255), 2)
        img = wash(img, dm, (110, 112, 132), .9, seed=77 + i, wob=1)
    rgb, a = cutout(img, m, 9, seed=79)
    save(name, rgb, a)

# 5. small props: a potted plant and a desk lamp, hanging paper stars
def plant(name, seed):
    h, w = 700, 520
    pot = mask_from(h, w, lambda d, s: d.polygon([(150 * s, 470 * s), (370 * s, 470 * s), (340 * s, 660 * s), (180 * s, 660 * s)], fill=255), 2)
    img = paper(h, w, seed=seed)
    img = wash(img, pot, (214, 150, 110), .75, seed=seed + 1, wob=2)
    leaves = np.zeros((h, w), np.float32)
    rr = np.random.default_rng(seed)
    for i in range(9):
        a = -math.pi / 2 + rr.uniform(-1.1, 1.1); L = rr.uniform(180, 330); x0, y0 = 260, 480
        x1, y1 = x0 + math.cos(a) * L, y0 + math.sin(a) * L
        lm = mask_from(h, w, lambda d, s: d.polygon([(x0 * s, y0 * s), ((x0 + x1) / 2 * s + 40 * s * math.sin(a), (y0 + y1) / 2 * s - 40 * s * math.cos(a)), (x1 * s, y1 * s), ((x0 + x1) / 2 * s - 40 * s * math.sin(a), (y0 + y1) / 2 * s + 40 * s * math.cos(a))], fill=255), 2)
        img = wash(img, lm, (96 + rr.integers(-20, 20), 158, 104), .7, seed=seed + 10 + i, wob=3)
        leaves = np.maximum(leaves, lm)
    m = np.maximum(pot, leaves)
    img = pencil(img, m, width=1.6, alpha=.5, seed=seed + 30)
    rgb, a = cutout(img, m, 10, seed=seed + 31)
    rgb, a = trim(rgb, a); save(name, rgb, a)
def lamp(name):
    h, w = 760, 520
    shade = mask_from(h, w, lambda d, s: d.polygon([(130 * s, 80 * s), (390 * s, 80 * s), (450 * s, 300 * s), (70 * s, 300 * s)], fill=255), 2)
    stem = mask_from(h, w, lambda d, s: d.rectangle([248 * s, 300 * s, 272 * s, 660 * s], fill=255), 2)
    base = mask_from(h, w, lambda d, s: d.ellipse([140 * s, 640 * s, 380 * s, 720 * s], fill=255), 2)
    img = paper(h, w, seed=80)
    img = wash(img, shade, (246, 214, 150), .65, seed=81, wob=3)
    img = wash(img, np.maximum(stem, base), (150, 128, 110), .75, seed=82, wob=1)
    m = np.maximum(np.maximum(shade, stem), base)
    img = pencil(img, m, width=1.6, alpha=.55, seed=83)
    rgb, a = cutout(img, m, 10, seed=84); rgb, a = trim(rgb, a); save(name, rgb, a)
def star(name, col, seed):
    h = w = 300
    pts = [(150 + math.cos(-math.pi / 2 + i * math.pi / 5) * (130 if i % 2 == 0 else 58), 160 + math.sin(-math.pi / 2 + i * math.pi / 5) * (130 if i % 2 == 0 else 58)) for i in range(10)]
    m = mask_from(h, w, lambda d, s: d.polygon([(x * s, y * s) for x, y in pts], fill=255), 2)
    img = wash(paper(h, w, seed=seed), m, col, .7, seed=seed + 1, wob=2)
    img = pencil(img, m, width=1.5, alpha=.5, seed=seed + 2)
    rgb, a = cutout(img, m, 8, seed=seed + 3); rgb, a = trim(rgb, a); save(name, rgb, a)

# ======================================================================================
# road spread
def backdrop_day():
    h, w = 1200, 1600
    img = gradient(h, w, [(0, (126, 176, 222)), (.55, (190, 216, 232)), (.8, (246, 222, 196)), (1, (250, 236, 214))])
    img = img * (1 + noise(h, w, 50, 90, 3)[..., None] * .035)
    for i, (x, y, rx, ry) in enumerate([(260, 200, 220, 60), (900, 140, 300, 70), (1380, 260, 200, 50), (600, 360, 260, 46)]):
        m = mask_from(h, w, lambda d, s: [d.ellipse([(x - rx + k * rx * .5) * s, (y - ry - (k % 2) * ry * .6) * s, (x + k * rx * .5) * s, (y + ry) * s], fill=255) for k in range(3)], 2)
        img = img + (1 - img) * (wobble(m, 91 + i, 10, 20) * .75)[..., None]
        img = wash(img, ndi.gaussian_filter(m, 3) * (1 - ndi.gaussian_filter(np.roll(m, -26, 0), 6)), (150, 168, 200), .25, seed=95 + i, wob=0)
    save('bd_day', np.clip(img * .85 + paper(h, w, seed=96) * .15, 0, 1))

def city(name, seed, col, hmin, hmax, n):
    h, w = 900, 2400
    rr = np.random.default_rng(seed); m = np.zeros((h, w), np.float32); img = paper(h, w, seed=seed)
    x = 0; wins = []
    while x < w:
        bw = rr.integers(110, 230); bh = rr.integers(hmin, hmax)
        bm = mask_from(h, w, lambda d, s: d.rectangle([x * s, (h - bh) * s, (x + bw) * s, h * s], fill=255), 1)
        c = tuple(int(v + rr.integers(-14, 14)) for v in col)
        img = wash(img, bm, c, .6, seed=int(rr.integers(1e6)), wob=2, edge=.3)
        for yy in range(h - bh + 30, h - 40, 56):
            for xx in range(x + 22, x + bw - 30, 44):
                if rr.random() < .7: wins.append((xx, yy))
        m = np.maximum(m, bm); x += bw + rr.integers(4, 26)
    wm = mask_from(h, w, lambda d, s: [d.rectangle([a * s, b * s, (a + 18) * s, (b + 24) * s], fill=255) for a, b in wins], 1)
    img = img * (1 - wm[..., None] * .3) + np.array([1, .98, .9]) * wm[..., None] * .3
    img = pencil(img, m, width=1.4, alpha=.4, seed=seed + 2)
    rgb, a = cutout(img, m, 10, seed=seed + 3); save(name, rgb, a)

def tree(name, seed, col):
    h, w = 900, 700
    rr = np.random.default_rng(seed); img = paper(h, w, seed=seed)
    trunk = mask_from(h, w, lambda d, s: d.polygon([(330 * s, 880 * s), (370 * s, 880 * s), (362 * s, 420 * s), (338 * s, 420 * s)], fill=255), 2)
    img = wash(img, trunk, (140, 104, 78), .8, seed=seed + 1, wob=2)
    canopy = np.zeros((h, w), np.float32)
    for i in range(7):
        cx, cy, r = 350 + rr.uniform(-170, 170), 330 + rr.uniform(-190, 120), rr.uniform(120, 190)
        cm = mask_from(h, w, lambda d, s: d.ellipse([(cx - r) * s, (cy - r * .9) * s, (cx + r) * s, (cy + r * .9) * s], fill=255), 2)
        canopy = np.maximum(canopy, cm)
    canopy = wobble(canopy, seed + 4, 8, 18)
    img = img * (1 - canopy[..., None]) + paper(h, w, seed=seed + 50) * canopy[..., None]
    img = wash(img, canopy, col, .7, seed=seed + 5, wob=0, bloom=.3)
    # darker underside, lighter dabs on top (two more glazes)
    under = canopy * np.clip((np.arange(h)[:, None] - 300) / 300, 0, 1)
    img = wash(img, under, tuple(int(c * .7) for c in col), .4, seed=seed + 6, wob=0, edge=0)
    for i in range(5):  # a few soft second glazes inside the canopy
        cx, cy, r = 350 + rr.uniform(-150, 150), 330 + rr.uniform(-140, 140), rr.uniform(90, 140)
        dm = mask_from(h, w, lambda d, s: d.ellipse([(cx - r) * s, (cy - r * .8) * s, (cx + r) * s, (cy + r * .8) * s], fill=255), 2) * canopy
        img = wash(img, ndi.gaussian_filter(dm, 18), tuple(int(c * .85) for c in col), .2, seed=seed + 60 + i, wob=0, edge=0)
    hl = canopy * np.clip((330 - np.arange(h)[:, None]) / 260, 0, 1) * np.clip((420 - np.arange(w)[None, :]) / 260, 0, 1)
    img = img + (1 - img) * (ndi.gaussian_filter(hl, 20) * .35)[..., None]
    m = np.maximum(trunk, canopy)
    img = pencil(img, m, width=1.6, alpha=.45, seed=seed + 7)
    rgb, a = cutout(img, m, 12, seed=seed + 8); rgb, a = trim(rgb, a); save(name, rgb, a)

def overpass(name):
    # from his riding photo: a concrete overpass on an ivy-covered pillar
    h, w = 1000, 2200
    img = paper(h, w, seed=120)
    deck = mask_from(h, w, lambda d, s: d.polygon([(0, 80 * s), (w * s, 140 * s), (w * s, 300 * s), (0, 250 * s)], fill=255), 2)
    under = mask_from(h, w, lambda d, s: d.polygon([(0, 250 * s), (w * s, 300 * s), (w * s, 350 * s), (0, 300 * s)], fill=255), 2)
    pil = mask_from(h, w, lambda d, s: d.polygon([(900 * s, 300 * s), (1180 * s, 310 * s), (1160 * s, 1000 * s), (920 * s, 1000 * s)], fill=255), 2)
    img = wash(img, deck, (214, 210, 202), .6, seed=121, wob=2)
    img = wash(img, under, (150, 146, 150), .75, seed=122, wob=2)
    img = wash(img, pil, (196, 192, 186), .6, seed=123, wob=2)
    rr = np.random.default_rng(124)
    ivy = np.zeros((h, w), np.float32)
    for i in range(260):
        x, y, r = rr.uniform(900, 1180), rr.uniform(320, 990), rr.uniform(14, 30)
        ivy = np.maximum(ivy, mask_from(h, w, lambda d, s: d.ellipse([(x - r) * s, (y - r * .8) * s, (x + r) * s, (y + r * .8) * s], fill=255), 1))
    ivy = ivy * np.clip((np.arange(h)[:, None] - 330) / 60, 0, 1)
    img = wash(img, ivy, (90, 150, 72), .75, seed=125, wob=2, bloom=.35)
    img = wash(img, ivy * (noise(h, w, 10, 126, 2) > .3), (60, 116, 52), .5, seed=127, wob=0)
    m = np.maximum.reduce([deck, under, pil])
    img = pencil(img, m, width=1.8, alpha=.5, seed=128)
    rgb, a = cutout(img, m, 12, seed=129); save(name, rgb, a)

def ground_road():
    h, w = 1200, 1600
    img = paper(h, w, (240, 238, 220), seed=130)
    grass = np.ones((h, w), np.float32)
    img = wash(img, grass, (160, 196, 128), .55, seed=131, wob=0, bloom=.3)
    road = mask_from(h, w, lambda d, s: d.rectangle([0, 520 * s, w * s, 900 * s], fill=255), 2)
    img = img * (1 - road[..., None]) + paper(h, w, (236, 232, 222), seed=132) * road[..., None]
    img = wash(img, road, (122, 120, 128), .65, seed=133, wob=0, bloom=.25, gran=.18)
    for y in (520, 900):
        cm = mask_from(h, w, lambda d, s: d.rectangle([0, (y - 10) * s, w * s, (y + 10) * s], fill=255), 2)
        img = img * (1 - cm[..., None] * .8) + np.array([.96, .95, .9]) * cm[..., None] * .8
    rr = np.random.default_rng(134)
    for i in range(220):
        x, y = rr.uniform(0, w), rr.choice([rr.uniform(20, 500), rr.uniform(920, 1180)])
        gm = mask_from(h, w, lambda d, s: d.line([x * s, y * s, (x + rr.uniform(-6, 6)) * s, (y - rr.uniform(14, 30)) * s], fill=255, width=3 * s), 2)
        img = img * (1 - gm[..., None] * .35) + np.array([.36, .52, .3]) * gm[..., None] * .35
    save('gr_road', np.clip(img, 0, 1))

def dash(name):
    h, w = 60, 420
    m = mask_from(h, w, lambda d, s: d.rounded_rectangle([20 * s, 14 * s, (w - 20) * s, (h - 14) * s], 12 * s, fill=255), 2)
    img = wash(paper(h, w, seed=140), m, (250, 248, 238), .1, seed=141, wob=1)
    save(name, img, wobble(m, 142, 1, 10))

def flowers(name, seed):
    h, w = 420, 700
    rr = np.random.default_rng(seed); img = paper(h, w, seed=seed); m = np.zeros((h, w), np.float32)
    bush = mask_from(h, w, lambda d, s: d.ellipse([60 * s, 160 * s, 640 * s, 460 * s], fill=255), 2)
    img = wash(img, bush, (110, 160, 96), .7, seed=seed + 1, wob=8, bloom=.3); m = np.maximum(m, wobble(bush, seed + 1, 8))
    for i in range(11):
        x, y, r = rr.uniform(110, 590), rr.uniform(140, 290), rr.uniform(30, 44)
        col = [(244, 150, 170), (252, 214, 120), (255, 250, 245), (236, 170, 200)][i % 4]
        fm = mask_from(h, w, lambda d, s: [d.ellipse([(x + math.cos(k * 1.256) * r * .7 - r * .55) * s, (y + math.sin(k * 1.256) * r * .7 - r * .55) * s, (x + math.cos(k * 1.256) * r * .7 + r * .55) * s, (y + math.sin(k * 1.256) * r * .7 + r * .55) * s], fill=255) for k in range(5)], 2)
        img = img * (1 - fm[..., None]) + paper(h, w, seed=seed + 70 + i) * fm[..., None]
        img = wash(img, fm, col, .65, seed=seed + 10 + i, wob=1); m = np.maximum(m, fm)
        cm = mask_from(h, w, lambda d, s: d.ellipse([(x - 8) * s, (y - 8) * s, (x + 8) * s, (y + 8) * s], fill=255), 2)
        img = wash(img, cm, (240, 180, 60), .9, seed=seed + 30 + i, wob=0)
    img = pencil(img, m, width=1.4, alpha=.4, seed=seed + 40)
    rgb, a = cutout(img, m, 9, seed=seed + 41); rgb, a = trim(rgb, a); save(name, rgb, a)

def lamppost(name):
    h, w = 1100, 300
    m = mask_from(h, w, lambda d, s: [d.rectangle([140 * s, 120 * s, 160 * s, 1080 * s], fill=255), d.rounded_rectangle([90 * s, 70 * s, 260 * s, 130 * s], 26 * s, fill=255)], 2)
    img = wash(paper(h, w, seed=150), m, (200, 198, 196), .6, seed=151, wob=1)
    img = pencil(img, m, width=1.4, alpha=.5, seed=152)
    rgb, a = cutout(img, m, 8, seed=153); rgb, a = trim(rgb, a); save(name, rgb, a)

if __name__ == '__main__':
    which = sys.argv[2:] or ['all']
    jobs = {
        'night': backdrop_night, 'room': ground_room,
        'phones': lambda: (phone('phone_him', (66, 74, 96), (120, 140, 180)), phone('phone_her', (238, 196, 206), (230, 150, 170))),
        'bubbles': lambda: (bubble('bub_l', (150, 186, 236), 'l'), bubble('bub_r', (246, 170, 190), 'r'), bubble_dots('bub_dots')),
        'props': lambda: (plant('plant_a', 200), plant('plant_b', 210), lamp('lamp'), star('star_gold', (250, 210, 110), 220), star('star_pale', (252, 236, 190), 230)),
        'day': backdrop_day, 'city': lambda: (city('city_far', 300, (170, 182, 210), 220, 520, 0), city('city_mid', 310, (214, 196, 186), 160, 360, 0)),
        'trees': lambda: (tree('tree_a', 400, (128, 178, 104)), tree('tree_b', 410, (150, 190, 110)), tree('tree_c', 420, (110, 160, 98))),
        'overpass': lambda: overpass('overpass'), 'road': ground_road, 'dash': lambda: dash('dash'), 'flowers': lambda: (flowers('flowers_a', 500), flowers('flowers_b', 510)), 'lamppost': lambda: lamppost('lamppost'),
    }
    for k, f in jobs.items():
        if 'all' in which or k in which: f()
