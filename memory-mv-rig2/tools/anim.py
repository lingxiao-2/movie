# 5-second male test: stand → lift head → raise arm → wave → lower arm. Rigid parts only. → test/frames/*.png
import sys, os, math, numpy as np
from PIL import Image, ImageFilter
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(__file__)); import pose as P
FPS, DUR, W, H = 24, 5.0, 1920, 1080
def eio(u): u = min(1, max(0, u)); return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
def K(*k):
    def f(t):
        if t <= k[0][0]: return k[0][1]
        for (a, va), (b, vb) in zip(k, k[1:]):
            if t <= b: return va + (vb - va) * eio((t - a) / (b - a))
        return k[-1][1]
    return f
sh = K((0, 4), (1.55, 4), (1.75, -2), (2.35, 100), (3.85, 100), (4.45, 4))            # small dip (anticipation) then up
el = K((0, 6), (1.75, 6), (2.35, 82), (3.85, 82), (4.45, 6))
wr = K((0, -28), (1.8, -28), (2.2, 0), (3.85, 0), (4.3, -28))
hy = K((0, 0), (.9, 0), (1.45, -14), (4.0, -14), (4.6, 0)); hr = K((0, 0), (.9, 0), (1.45, -2.2), (4.0, -2.2), (4.6, 0))
def pose(t):
    wave = math.sin((t - 2.45) * 2 * math.pi / .52) * min(1, max(0, (t - 2.4) / .15), max(0, (3.85 - t) / .15)) if 2.4 < t < 3.85 else 0
    breath = math.sin(t * 2 * math.pi / 3.2) * 3
    return {'root': (0, breath), 'head': {'y': hy(t) - breath * .3, 'r': hr(t)},
            'L': {'sh': sh(t), 'el': el(t) + 16 * wave, 'wr': wr(t) + 8 * wave, 'hand': 'hand_open' if sh(t) > 55 else 'hand_relax'},
            'R': {'sh': -4, 'el': -6, 'wr': 28}}
BG = None
def bg():
    y = np.linspace(0, 1, H)[:, None, None]; x = np.linspace(-1, 1, W)[None, :, None]
    c = np.array([247, 236, 226]) * (1 - y * .06) - (x ** 2) * 10
    rng = np.random.default_rng(1); c = c + rng.normal(0, 2.2, (H, W, 1))
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert('RGBA')
def frame(i):
    global BG
    if BG is None: BG = bg()
    t = i / FPS; im = P.outline(P.render(pose(t)))
    # camera: medium shot head→knees, a slow push in (scale from figure px to screen)
    s = .47 + .03 * eio(t / DUR); cx = 1330 - 40 * eio(t / DUR); top = 420 + 40 * eio(t / DUR)
    small = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    out = BG.copy()
    sh_ = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.alpha_composite(small, (int(W / 2 - cx * s), int(-top * s)))
    out.convert('RGB').save(f'test/frames/f{i:04d}.png'); return i
if __name__ == '__main__':
    os.makedirs('test/frames', exist_ok=True)
    with Pool(4) as p: p.map(frame, range(int(FPS * DUR)), chunksize=4)
