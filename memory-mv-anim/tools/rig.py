# 2D puppet rigs for the user's illustrations (no redrawing): each scene is split into layers, each layer gets
# a triangle mesh, and the mesh is driven by ARAP (libigl, as-rigid-as-possible) from rigid "bone" groups —
# head, hand+prop, hair, body — that follow keyframed transforms with easing. Pinned regions keep bodies attached.
# Output: rig/<name>.json (rest mesh + per-frame vertices at 24 fps) + cropped RGBA layer textures.
# Coordinates in SPEC are ORIGINAL image px of the scene's own plate (act8: strip y − 506).
# usage: python rig.py <name> [<name> …]   (names in SPEC)
import sys, os, json, math, numpy as np, cv2, igl
from PIL import Image
from scipy.spatial import Delaunay

FPS = 24
K16 = 2400 / 941
def eio(u): u = min(1, max(0, u)); return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2

# ---------------------------------------------------------------- motion helpers
def keys(*K):
    """keyframes (t, dx, dy, deg) in local seconds/original px; eased in-out between keys, held outside"""
    K = sorted(K)
    def f(u):
        if u <= K[0][0]: return K[0][1:]
        if u >= K[-1][0]: return K[-1][1:]
        i = 0
        while u > K[i + 1][0]: i += 1
        a, b = K[i], K[i + 1]; e = eio((u - a[0]) / (b[0] - a[0]))
        return tuple(a[j] + (b[j] - a[j]) * e for j in (1, 2, 3))
    return f
def osc(dx=0, dy=0, deg=0, period=3.0, phase=0, start=-1e9, end=1e9, ramp=.6, abs_=False):
    def f(u):
        w = min(1, max(0, (u - start) / ramp)) * min(1, max(0, (end - u) / ramp))
        s = math.sin(2 * math.pi * u / period + phase); s = abs(s) if abs_ else s
        return dx * s * w, dy * s * w, deg * s * w
    return f
def add(*fs):
    def f(u):
        r = [0, 0, 0]
        for g in fs:
            v = g(u); r = [r[i] + v[i] for i in range(3)]
        return tuple(r)
    return f
def breathe(amp=2.0, period=3.4, phase=0): return osc(dy=amp, period=period, phase=phase)

# ---------------------------------------------------------------- scenes
# layer: poly (orig coords; None = the rest of the fg), z, groups [(name, region poly, pivot, motion)],
#        pin: list of region polys (identity), fill: hole region poly (content behind other layers), tone
R = lambda x0, y0, x1, y1: [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
SPEC = {}

# ---- act 1: the quarrel on the phones — both bow their heads; his phone hand stops and lowers the phone; hers too
SPEC['act1'] = dict(src='layers', scene='act1', t0=0, t1=6.525, step=56, blinks=[[3.7, [0, 1]], [5.75, [2, 3]]], layers=[
  dict(name='him', poly=[(0, 0), (950, 0), (655, 941), (0, 941)], z=1, eyes=[0, 1], pin=[R(0, 840, 700, 941), R(0, 0, 20, 941)], groups=[
    ('head', R(120, 30, 735, 520), (430, 560), add(keys((0, 0, 0, 0), (1.2, 0, 0, 0), (3.2, -4, 11, -2.2), (4.6, -3, 9, -1.6), (6.5, -5, 13, -2.6)), breathe(1.6))),
    ('phone', R(455, 545, 705, 770), (560, 760), keys((0, 0, 0, 0), (1.0, 0, -4, -1), (2.6, -6, 44, 11), (6.5, -6, 46, 11.5)))]),
  dict(name='her', poly=None, z=2, eyes=[2, 3], pin=[R(700, 860, 1672, 941), R(1650, 0, 1672, 941)], groups=[
    ('head', R(860, 120, 1480, 560), (1180, 640), add(keys((0, 0, 0, 0), (2.0, 0, 0, 0), (4.0, 3, 12, 2.2), (6.5, 4, 14, 2.6)), breathe(1.4, 3.1, 1))),
    ('hands', R(1080, 520, 1290, 715), (1180, 720), keys((0, 0, 0, 0), (1.6, 0, 0, 0), (3.2, 2, 30, -6), (6.5, 2, 32, -6.5))),
    ('hairR', R(1420, 330, 1600, 760), (1480, 330), osc(dx=3, period=3.6, start=0))])])

# ---- act 2: he decides — the small him lowers his phone; the main him lifts his head and raises the helmet
SPEC['act2'] = dict(src='layers', scene='act2', t0=6.525, t1=12.934, step=56, blinks=[[11.25, [0, 1]], [12.45, [0, 1]]], layers=[
  dict(name='small', poly=R(0, 90, 590, 640), z=1, pin=[R(0, 600, 590, 640), R(0, 90, 15, 640)], groups=[
    ('head', R(180, 100, 560, 400), (390, 430), add(keys((0, 0, 0, 0), (.7, 0, 0, 0), (1.9, 0, 7, -3), (6.4, 0, 7, -3)), breathe(1.2))),
    ('phone', R(380, 330, 520, 540), (420, 540), keys((0, 0, 0, 0), (1.1, 0, 0, 0), (2.3, 4, 24, 9), (6.4, 4, 24, 9)))]),
  dict(name='main', poly=None, z=2, eyes=[0, 1], pin=[R(560, 920, 1350, 941)], groups=[
    ('head', R(560, 50, 1100, 560), (860, 640), add(keys((0, 0, 0, 0), (3.5, 0, 6, 1.5), (4.7, -4, -12, -4), (6.4, -5, -14, -4.5)), breathe(1.5))),
    ('helmet', R(600, 560, 1290, 941), (930, 941), keys((0, 0, 0, 0), (3.9, 0, 5, 0), (5.3, 6, -46, -3), (6.4, 6, -50, -3.2)))])])

# ---- act 3: the ride — rider's torso and helmet ride the bumps; backpack sways; the bike stays put (hands pinned)
SPEC['act3'] = dict(src='layers', scene='act3', t0=12.934, t1=21.455, step=60, layers=[
  dict(name='rider', poly=None, z=1, pin=[R(0, 520, 1672, 941), R(760, 380, 960, 520)], groups=[
    ('torso', R(380, 230, 760, 520), (560, 560), osc(dy=4, deg=1.0, period=.9)),
    ('helmet', R(580, 40, 900, 345), (720, 360), add(osc(dy=5, deg=1.6, period=.9, phase=.5), keys((0, 0, 0, 0), (3.0, 0, 0, 0), (4.2, 8, 0, 2.5), (6.0, 8, 0, 2.5), (7.0, 0, 0, 0)))),
    ('pack', R(320, 210, 590, 440), (500, 230), osc(dx=4, dy=3, deg=2.2, period=.9, phase=1.1))])])

# ---- act 4: talking it through — his open hand gestures and his head nods as he speaks; she tilts toward him
SPEC['act4'] = dict(src='layers', scene='act4', t0=21.455, t1=27.841, step=56, layers=[
  dict(name='him', poly=[(0, 0), (905, 0), (905, 941), (0, 941)], z=1, pin=[R(0, 880, 905, 941), R(0, 0, 15, 941)], groups=[
    ('head', R(330, 50, 880, 520), (560, 560), add(keys((0, 0, 0, 0), (1.0, 6, 2, 1), (3.0, 12, 4, 1.5), (6.4, 10, 2, .8)), osc(dy=3, deg=1.6, period=1.15, start=.4, end=4.2))),
    ('hand', R(590, 610, 850, 770), (600, 780), add(keys((0, 0, 0, 0), (.6, -4, -18, -6), (1.4, 0, 6, 2), (2.2, -2, -14, -5), (3.0, 0, 4, 1), (6.4, 0, 0, 0)), osc(dy=3, period=1.3, start=3.4)))]),
  dict(name='her', poly=None, z=2, pin=[R(905, 880, 1672, 941), R(1655, 0, 1672, 941)], groups=[
    ('head', R(960, 150, 1520, 620), (1230, 700), add(keys((0, 0, 0, 0), (2.4, 0, 0, 0), (4.4, -10, 6, 2.6), (6.4, -12, 7, 3)), breathe(1.6, 2.6))),
    ('hands', R(1000, 420, 1230, 620), (1100, 640), keys((0, 0, 0, 0), (3.2, 0, 0, 0), (5.0, -8, 16, -4), (6.4, -10, 18, -4.5))),
    ('hair', R(1300, 420, 1672, 900), (1400, 420), osc(dx=4, period=3.2))])])

# ---- act 5: the confession — he offers the roses and scarf (arm extends), leans in and nods; she leans in, hands forward
G5 = [(612, 440), (625, 350), (660, 305), (760, 286), (860, 312), (960, 328), (1015, 372), (1064, 425), (1064, 520), (1046, 600), (1002, 665), (1006, 760), (996, 860), (966, 941), (470, 941), (430, 840), (438, 720), (468, 640), (518, 588), (575, 560), (600, 500)]
SPEC['act5'] = dict(src='layers', scene='act5', t0=27.841, t1=38.499, step=54, blinks=[[32.75, [0, 1]], [36.8, [0, 1]]], layers=[
  dict(name='gift', poly=G5, z=3, sleeve=dict(region=R(430, 830, 720, 941), bottom=.3), groups=[
    ('gift', [(612, 300), (1070, 300), (1070, 941), (720, 941), (720, 830), (430, 830), (430, 560)], (760, 640),
     add(keys((0, 0, 0, 0), (2.1, 0, 0, 0), (2.5, -14, 8, 1.2), (3.6, 50, -26, -3.2), (4.1, 74, -22, -4.5), (10.6, 74, -22, -4.5)), osc(dy=3, deg=.6, period=2.4, start=4.4)))]),
  dict(name='him', poly=[(0, 0), (905, 0), (905, 941), (0, 941)], z=1, fill=dict(region=G5, clip=R(0, 540, 540, 941)), tone=True, pin=[R(0, 900, 905, 941), R(0, 0, 25, 941)], groups=[
    ('head', R(90, 0, 640, 440), (430, 470), add(keys((0, 0, 0, 0), (2.1, 0, 0, 0), (2.5, -5, 3, -1.5), (4.0, 24, -6, 2.2), (4.8, 24, 2, -1.2), (5.6, 24, -4, 1.6), (10.6, 22, -3, 1.2)), breathe(1.5)))]),
  dict(name='her', poly=None, z=2, eyes=[0, 1], fill=dict(region=G5, clip=R(930, 0, 1672, 941)), pin=[R(905, 900, 1672, 941), R(1650, 0, 1672, 941)], groups=[
    ('head', [(1060, 0), (1672, 0), (1672, 430), (1060, 430)], (1330, 600), add(keys((0, 0, 0, 0), (4.0, 0, 0, 0), (5.4, -28, 8, 3.2), (10.6, -26, 7, 2.8)), breathe(1.3, 2.9))),
    ('hands', R(1140, 392, 1315, 545), (1330, 600), keys((0, 0, 0, 0), (4.0, 0, 0, 0), (5.6, -50, 24, 3.2), (10.6, -48, 22, 2.8))),
    ('hair', R(1450, 450, 1672, 900), (1500, 450), osc(dx=4, period=3.4))])])

# ---- act 6: everyday life — five panels, each with its own small action (plate only, no matte: whole panel mesh)
def panel(name, win, t0, t1, groups, pins):
    SPEC[name] = dict(src='plate', scene='act6', t0=t0, t1=t1, step=34, layers=[dict(name='p', poly=R(*win), z=1, pin=pins + [R(win[0], win[1], win[2], win[1] + 6), R(win[0], win[3] - 6, win[2], win[3]), R(win[0], win[1], win[0] + 6, win[3]), R(win[2] - 6, win[1], win[2], win[3])], groups=groups)])
panel('act6a', (5, 540, 500, 860), 38.499, 39.776, [   # drinks: both lean in to sip
  ('his', R(60, 560, 300, 700), (200, 760), keys((0, 0, 0, 0), (.5, 4, 5, 2), (1.27, 2, 3, 1))),
  ('her', R(300, 560, 470, 700), (380, 760), keys((0, 0, 0, 0), (.3, 0, 0, 0), (.8, -4, 4, -2), (1.27, -3, 3, -1.5)))], [R(5, 760, 500, 860)])
panel('act6b', (600, 50, 1105, 345), 39.776, 41.053, [  # dinner: he reaches over with his chopsticks, she lifts hers, laughing
  ('arm', R(640, 195, 840, 300), (660, 300), keys((0, 0, 0, 0), (.7, 22, -10, -3), (1.27, 18, -8, -2.5))),
  ('herhand', R(850, 190, 980, 280), (900, 300), keys((0, 0, 0, 0), (.4, 0, 0, 0), (.9, -4, -10, 2), (1.27, -3, -8, 1.5))),
  ('herhead', R(920, 80, 1100, 220), (1000, 260), osc(dy=3, deg=1.5, period=.6))], [])
panel('act6c', (1135, 40, 1640, 330), 41.053, 42.33, [  # the photo: camera raised and steadied, she turns her head toward him
  ('cam', R(1260, 120, 1400, 240), (1300, 260), keys((0, 0, 0, 0), (.45, 0, -8, -2), (.75, 0, -6, -1.5), (.82, 0, -3, -1), (1.27, 0, -6, -1.5))),
  ('her', R(1440, 90, 1640, 330), (1520, 330), keys((0, 0, 0, 0), (.5, 0, 0, 0), (1.1, -8, 2, -3), (1.27, -8, 2, -3)))], [])
panel('act6d', (515, 545, 1035, 885), 42.33, 43.607, [  # the film: she nestles onto his shoulder; he tilts toward her
  ('her', R(760, 620, 960, 790), (900, 820), keys((0, 0, 0, 0), (.9, -8, 7, -4), (1.27, -8, 7, -4))),
  ('his', R(600, 545, 790, 720), (700, 760), keys((0, 0, 0, 0), (.3, 0, 0, 0), (1.0, 4, 3, 2.2), (1.27, 4, 3, 2.2)))], [R(515, 820, 1035, 885)])
panel('act6e', (110, 100, 570, 380), 43.607, 44.443, [  # the kiss: he leans in, she leans to him, eyes closed, smiling
  ('his', R(160, 100, 420, 330), (300, 380), keys((0, 0, 0, 0), (.6, 9, 6, 2.2), (.84, 10, 6, 2.4))),
  ('her', R(400, 120, 570, 330), (480, 380), keys((0, 0, 0, 0), (.6, -6, 3, -2), (.84, -7, 3, -2.2)))], [R(110, 330, 570, 380)])

# ---- act 7: Weihai — selfie arm bobs as he holds the camera; they lean their heads together; her hair in the sea wind
SPEC['act7'] = dict(src='layers', scene='act7', t0=44.443, t1=51.27, step=60, blinks=[[46.3, [0, 1]], [49.0, [0, 1]]], layers=[
  dict(name='him', poly=[(0, 0), (800, 0), (795, 120), (770, 175), (748, 230), (738, 330), (702, 362), (700, 494), (0, 494)], z=2, eyes=[0, 1], pin=[R(0, 480, 760, 494)], groups=[
    ('head', R(420, 10, 760, 330), (600, 380), add(keys((0, 0, 0, 0), (.8, 0, 0, 0), (2.0, 10, 4, 2.4), (6.8, 10, 4, 2.4)), osc(dy=3, period=1.6, start=2.4))),
    ('arm', R(90, 300, 440, 494), (430, 340), add(keys((0, 0, 0, 0), (1.0, -4, -6, -2), (2.0, 0, 0, 0)), osc(dy=4, deg=1.2, period=1.8, start=2.0)))]),
  dict(name='her', poly=None, z=1, pin=[R(700, 470, 1110, 494)], groups=[
    ('head', R(730, 110, 1010, 440), (860, 470), add(keys((0, 0, 0, 0), (.8, 0, 0, 0), (2.0, -9, 4, -2.6), (6.8, -9, 4, -2.6)), breathe(1.2, 2.7))),
    ('hair', R(930, 240, 1110, 480), (960, 240), osc(dx=5, deg=1.2, period=2.2))])])

# ---- act 8: walking on — hand in hand: a walking bob and sway, hair and skirt in the wind, slowly receding
WALK = 1.1
def walker(phase, amp):
    def f(u):
        s = math.sin(2 * math.pi * u / WALK + phase); return .8 * s * amp / 3, -amp * abs(s), 1.6 * s
    return f
def recede(u): e = eio(min(1, max(0, u / 7.0))); return 0, 0, 0
SPEC['act8'] = dict(src='layers', scene='act8', t0=51.27, t1=59.04, step=50, layers=[
  dict(name='him', poly=[(0, 0), (568, 0), (568, 380), (600, 435), (0, 435)], z=1, pin=[R(250, 420, 600, 435)], groups=[
    ('body', R(330, 0, 570, 400), (450, 435), walker(0, 5.5))]),
  dict(name='her', poly=None, z=2, pin=[R(540, 420, 820, 435)], groups=[
    ('body', R(570, 60, 760, 300), (680, 435), walker(math.pi / 2, 5.0)),
    ('hair', R(600, 150, 830, 340), (700, 150), osc(dx=6, deg=1.5, period=2.0)),
    ('skirt', R(590, 330, 790, 430), (690, 330), osc(dx=3, period=1.1, phase=1))])])

# ---------------------------------------------------------------- engine
def poly_mask(shape, pts, k):
    m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.round(np.array(pts, float) * k).astype(np.int32)], 1); return m.astype(bool)
def in_poly(P, pts, k): return np.array([cv2.pointPolygonTest((np.array(pts, float) * k).astype(np.float32), (float(x), float(y)), False) >= 0 for x, y in P])
def rot(p, c, th): s, co = math.sin(th), math.cos(th); d = p - c; return c + np.stack([d[:, 0] * co - d[:, 1] * s, d[:, 0] * s + d[:, 1] * co], 1)

def load_scene(sp):
    s = sp['scene']
    if sp['src'] == 'plate':
        rgb = np.array(Image.open(f'assets/up/{s}.png').convert('RGB')); A = np.full(rgb.shape[:2], 255, np.uint8); k = rgb.shape[0] / 941
    else:
        fg = np.array(Image.open(f'assets/layers/{s}_fg.png')); rgb, A = fg[..., :3].copy(), fg[..., 3]
        k = 4.0 if s in ('act7', 'act8') else K16
    return rgb, A, k

def build_mesh(alpha, step):
    region = cv2.dilate((alpha > 12).astype(np.uint8), np.ones((9, 9), np.uint8)); h, w = region.shape
    ys, xs = np.mgrid[0:h + step:step, 0:w + step:step]; pts = np.c_[np.minimum(xs.ravel(), w - 1), np.minimum(ys.ravel(), h - 1)]
    ok = cv2.dilate(region, np.ones((step | 1, step | 1), np.uint8))[pts[:, 1], pts[:, 0]] > 0
    V = pts[ok].astype(np.float64); F = Delaunay(V).simplices
    c = V[F].mean(1).astype(int); F = F[region[np.clip(c[:, 1], 0, h - 1), np.clip(c[:, 0], 0, w - 1)] > 0]
    used = np.unique(F); remap = -np.ones(len(V), int); remap[used] = np.arange(len(used))
    return V[used], remap[F].astype(np.int64)

def fill_hole(c, a, hole, tone):
    H, W = a.shape; q = 4
    src = cv2.resize(c, (W // q, H // q), interpolation=cv2.INTER_AREA); known = cv2.resize((a > 200).astype(np.uint8) * 255, (W // q, H // q), interpolation=cv2.INTER_NEAREST)
    f = cv2.inpaint(src, 255 - known, 7, cv2.INPAINT_TELEA); f = cv2.resize(cv2.GaussianBlur(f, (0, 0), 2), (W, H), interpolation=cv2.INTER_CUBIC)
    if tone: med = np.median(c[a > 200].reshape(-1, 3), 0); f = (f * .35 + med * .65).astype(np.uint8)
    hole = hole & (a < 200); c = np.where(hole[..., None], f, c)
    a = np.maximum(a, cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 3) * 255).astype(np.uint8); return c, a

def run(name):
    sp = SPEC[name]; rgb, A, k = load_scene(sp); H, W = A.shape
    frames = np.arange(sp['t0'], sp['t1'] + 1e-6, 1 / FPS); taken = np.zeros(A.shape, bool)
    blinks = json.load(open(f'assets/layers/{sp["scene"]}_blink.json')) if os.path.exists(f'assets/layers/{sp["scene"]}_blink.json') else []
    out = {'name': name, 'scene': sp['scene'], 't0': sp['t0'], 'fps': FPS, 'n': len(frames), 'layers': []}
    os.makedirs('rig', exist_ok=True)
    # explicit polygons first, the "rest" layer takes what is left
    order = sorted(sp['layers'], key=lambda L: L['poly'] is None)
    for L in order:
        m = (A > 0) & ~taken
        if L['poly'] is not None: m &= poly_mask(A.shape, L['poly'], k)
        taken |= m
        a = np.where(m, A, 0).astype(np.uint8); c = rgb.copy()
        if 'fill' in L: c, a = fill_hole(c, a, poly_mask(A.shape, L['fill']['region'], k) & poly_mask(A.shape, L['fill']['clip'], k), L.get('tone', False))
        ys, xs = np.where(a > 0); x0, y0, x1, y1 = max(0, xs.min() - 4), max(0, ys.min() - 4), min(W, xs.max() + 5), min(H, ys.max() + 5)
        tex = f'{name}_{L["name"]}'
        Image.fromarray(np.dstack([c[y0:y1, x0:x1], a[y0:y1, x0:x1]]), 'RGBA').save(f'rig/{tex}.png')
        alts = {}
        if L.get('eyes') and blinks and sp.get('blinks'):
            for st in ('half', 'closed'):
                im = Image.fromarray(np.dstack([c, a]), 'RGBA')
                for e in blinks:
                    if e['i'] in L['eyes']: im.alpha_composite(Image.open(f'assets/layers/{sp["scene"]}_eye{e["i"]}_{st}.png'), (e['x'], e['y']))
                im.crop((x0, y0, x1, y1)).save(f'rig/{tex}_{st}.png'); alts[st] = 1
        V, F = build_mesh(a, int(sp['step'] * k / K16))
        handles = []; used = np.zeros(len(V), bool)
        for (gname, reg, piv, mot) in L.get('groups', []):
            idx = np.where(in_poly(V, reg, k) & ~used)[0]; used[idx] = True
            pv = np.array(piv, float) * k
            def fn(u, R, pv=pv, mot=mot): dx, dy, deg = mot(u); return rot(R, pv, math.radians(deg)) + [dx * k, dy * k]
            if len(idx): handles.append((idx, fn))
        if 'sleeve' in L:   # the sleeve end at the frame edge follows the hand only partly: the arm stretches
            sv = in_poly(V, L['sleeve']['region'], k) & (V[:, 1] > H - 30) & ~used; idx = np.where(sv)[0]; used[idx] = True
            gm = L['groups'][0][3]; frac = L['sleeve']['bottom']
            handles.append((idx, lambda u, R, gm=gm, frac=frac: R + [gm(u)[0] * k * frac, 0]))
        pin = np.zeros(len(V), bool)
        for reg in L.get('pin', []): pin |= in_poly(V, reg, k)
        pin &= ~used
        if pin.any(): handles.append((np.where(pin)[0], lambda u, R: R))
        # islands of the mesh that no handle reaches would make ARAP singular: pin them in place
        from scipy.sparse import coo_matrix
        from scipy.sparse.csgraph import connected_components
        e = np.r_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]; ncomp, lab = connected_components(coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(len(V), len(V))), directed=False)
        hset = np.zeros(len(V), bool)
        for h in handles: hset[h[0]] = True
        free = [c for c in range(ncomp) if not hset[lab == c].any()]
        if free: idx = np.where(np.isin(lab, free))[0]; handles.append((idx, lambda u, R: R))
        b = np.concatenate([h[0] for h in handles]).astype(np.int32)
        d = igl.ARAPData(); d.max_iter = 10; igl.arap_precomputation(V, F, 2, b, d)
        Us, U = [], V.copy()
        for t in frames:
            u = t - sp['t0']; bc = np.concatenate([fn(u, V[idx]) for idx, fn in handles]); U = igl.arap_solve(bc, d, U); Us.append(U.round(1))
        disp = np.max([np.abs(u - V).max() for u in Us]) / k
        out['layers'].append({'tex': tex, 'ox': int(x0), 'oy': int(y0), 'V': V.round(1).tolist(), 'F': F.tolist(), 'U': [u.tolist() for u in Us], 'z': L['z'], 'alt': list(alts), 'blinks': sp.get('blinks', []) if alts else []})
        print(f'  {tex}: {len(V)} verts {len(F)} tris, groups {[g[0] for g in L.get("groups", [])]}, max move {disp:.0f}px')
    json.dump(out, open(f'rig/{name}.json', 'w'), separators=(',', ':'))
    print(name, 'frames', len(frames))

if __name__ == '__main__':
    for n in sys.argv[1:] or list(SPEC): run(n)
