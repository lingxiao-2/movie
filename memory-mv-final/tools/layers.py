# Split each upscaled scene into layers for 2.5D animation:
#   <act>_fg.png  characters (+ what the matte model calls foreground), RGBA
#   <act>_bg.png  the scene with the characters inpainted out (only revealed by a few px of parallax)
#   <act>_blink.json + <act>_eyeN_{half,closed}.png  eyelid patches painted from the eye's own colours
# usage: python layers.py act1 [act2 …]      (reads assets/up/, writes assets/layers/)
import sys, os, json, numpy as np, cv2
from PIL import Image, ImageFilter
from rembg import new_session, remove

ORIG_H = 941
# eyes on the ORIGINAL 1672 × 941 images: (cx, cy, rx, ry, tilt°); measured on zoomed grids
EYES = {
  'act1': [(426, 428, 40, 23, 0), (566, 427, 34, 21, 0), (1260, 453, 40, 18, -6), (1136, 481, 35, 19, -4)],
  'act2': [(882, 410, 38, 26, 0), (999, 407, 18, 24, 0)],
  'act5': [(1217, 344, 13, 26, -8), (1325, 366, 35, 28, -6)],
  'act7': [(576, 218, 23, 17, 0), (676, 244, 22, 17, 0), (862, 288, 21, 21, 0), (781, 312, 20, 21, 0)],
}
WHEELS = {'act3': [(920, 790, 182)]}   # (cx, cy, r) on the original; lower half only (fork/caliper sit above the hub)
MODEL = {'act3': 'isnet-general-use', 'act7': 'isnet-anime', 'act8': 'isnet-anime'}
SRC = {'act7': ('act78', (0, 0, 1672, 494)), 'act8': ('act78', (0, 506, 1672, 941))}

def load(act):
    if act in SRC:
        name, (x0, y0, x1, y1) = SRC[act]; im = Image.open(f'assets/up/{name}.png').convert('RGB'); k = im.height / ORIG_H
        return im.crop((round(x0 * k), round(y0 * k), round(x1 * k), round(y1 * k))), k, (x0, y0)
    im = Image.open(f'assets/up/{act}.png').convert('RGB'); return im, im.height / ORIG_H, (0, 0)

def layers(act):
    im, k, off = load(act); W, H = im.size
    small = im.resize((W // 3, H // 3), Image.LANCZOS)
    sess = new_session(MODEL.get(act, 'isnet-anime'))
    m = remove(small, session=sess, only_mask=True, post_process_mask=True)
    m = np.asarray(m.resize((W, H), Image.LANCZOS), np.float32) / 255
    m = cv2.GaussianBlur(m, (0, 0), 1.2)
    rgb = np.asarray(im).copy()
    for (cx, cy, r) in WHEELS.get(act, []):     # spinning front wheel: strong rotational blur on its lower half
        cx, cy, r = cx * k, cy * k, r * k; R = int(r + 8); x0, y0 = int(cx - R), int(cy - R)
        crop = Image.fromarray(rgb).crop((x0, y0, x0 + 2 * R, y0 + 2 * R))
        st = np.mean([np.asarray(crop.rotate(a, resample=Image.BICUBIC, center=(R, R)), np.float32) for a in np.linspace(-14, 14, 21)], 0)
        yy, xx = np.mgrid[0:2 * R, 0:2 * R]; dy, dx = yy - R, xx - R; rr = np.hypot(dx, dy)
        mm = ((rr > r * .2) & (rr < r * .98) & (dy > r * .1)).astype(np.float32); mm = cv2.GaussianBlur(mm, (0, 0), r * .06)[..., None]
        h_, w_ = rgb[y0:y0 + 2 * R, x0:x0 + 2 * R].shape[:2]
        rgb[y0:y0 + h_, x0:x0 + w_] = (rgb[y0:y0 + h_, x0:x0 + w_] * (1 - mm[:h_, :w_]) + st[:h_, :w_] * mm[:h_, :w_]).astype(np.uint8)
    im = Image.fromarray(rgb)
    fg = np.dstack([np.asarray(im), (np.clip(m, 0, 1) * 255).astype(np.uint8)])
    Image.fromarray(fg, 'RGBA').save(f'assets/layers/{act}_fg.png')
    # background: inpaint a dilated hole at quarter size, then put back the original outside it
    hole = (cv2.dilate((m > .25).astype(np.uint8), np.ones((31, 31), np.uint8)) > 0).astype(np.uint8)
    q = 4; sm = cv2.resize(np.asarray(im), (W // q, H // q), interpolation=cv2.INTER_AREA); hm = cv2.resize(hole * 255, (W // q, H // q), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(sm, hm, 9, cv2.INPAINT_TELEA); fill = cv2.GaussianBlur(fill, (0, 0), 3)
    fill = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC)
    a = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 6)[..., None]
    bg = (np.asarray(im, np.float32) * (1 - a) + fill.astype(np.float32) * a).astype(np.uint8)
    Image.fromarray(bg).save(f'assets/layers/{act}_bg.png', optimize=False)
    print(act, 'fg/bg', W, H, 'fg cover %.1f%%' % (100 * (m > .5).mean()))
    return im, k, off

def blinks(act, im, k, off):
    if act not in EYES: return
    A = np.asarray(im, np.float32); out = []
    for i, (cx, cy, rx, ry, tilt) in enumerate(EYES[act]):
        cx, cy, rx, ry = (cx - off[0]) * k, (cy - off[1]) * k, rx * k, ry * k
        pad = int(max(rx, ry) * .6) + 6
        x0, y0, x1, y1 = int(cx - rx - pad), int(cy - ry - pad), int(cx + rx + pad), int(cy + ry + pad)
        patch = A[y0:y1, x0:x1].copy(); h, w = patch.shape[:2]
        # skin: median of a band under the eye; lash colour: darkest 3% inside the eye
        band = A[int(cy + ry * 1.15):int(cy + ry * 1.6), int(cx - rx * .6):int(cx + rx * .6)].reshape(-1, 3)
        skin = np.median(band, 0) if len(band) else np.array([240, 200, 180.])
        inside = A[int(cy - ry * .8):int(cy + ry * .8), int(cx - rx * .8):int(cx + rx * .8)].reshape(-1, 3)
        lash = np.percentile(inside, 3, axis=0) * .9
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32); X, Y = xx - (cx - x0), yy - (cy - y0)
        t = np.deg2rad(tilt); Xr, Yr = X * np.cos(t) + Y * np.sin(t), -X * np.sin(t) + Y * np.cos(t)
        for name, close in (('half', .55), ('closed', 1.0)):
            # the lid covers the eye from the top down to `close`; skin shaded slightly darker toward the lash
            ell = (Xr / (rx * 1.12)) ** 2 + (Yr / (ry * 1.18)) ** 2
            lidline = -ry * 1.18 + close * ry * 1.18 * 1.55          # y of the lid edge (eye coords)
            cover = ((ell < 1) & (Yr < lidline)).astype(np.float32)
            cover = cv2.GaussianBlur(cover, (0, 0), max(1., rx * .05))
            shade = np.clip((Yr + ry * 1.18) / (ry * 2.4), 0, 1)[..., None]
            col = skin * (1 - .10 * shade)
            img = patch * (1 - cover[..., None]) + col * cover[..., None]
            # lash line along the lid edge, thicker in the middle, a little flick at the outer corner
            edge_y = lidline + (1 - (Xr / (rx * 1.05)) ** 2).clip(0) * (ry * .18 if close == 1 else 0)
            d = np.abs(Yr - edge_y); thick = max(1.6, ry * .16) * (1 - (Xr / (rx * 1.1)) ** 2).clip(0) ** .5
            ln = (d < thick).astype(np.float32) * ((Xr / (rx * 1.08)) ** 2 < 1)
            ln = cv2.GaussianBlur(ln, (0, 0), .9)
            img = img * (1 - ln[..., None]) + lash * ln[..., None]
            alpha = np.clip(np.maximum(cover, ln) * 1.0, 0, 1)
            alpha = cv2.GaussianBlur(alpha, (0, 0), .8)
            rgba = np.dstack([np.clip(img, 0, 255), alpha * 255]).astype(np.uint8)
            Image.fromarray(rgba, 'RGBA').save(f'assets/layers/{act}_eye{i}_{name}.png')
        out.append({'i': i, 'x': x0, 'y': y0, 'w': w, 'h': h})
    json.dump(out, open(f'assets/layers/{act}_blink.json', 'w'))
    print(act, 'blinks', len(out))

if __name__ == '__main__':
    os.makedirs('assets/layers', exist_ok=True)
    for act in sys.argv[1:]:
        im, k, off = layers(act); blinks(act, im, k, off)
