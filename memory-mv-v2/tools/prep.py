# Prepare sheet cut-outs for the shot: polaroid matte for the helmet photo, spinning-wheel blur for the rider.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
C = 'assets/cut/'
# 1. the helmet polaroid (white photo card on the sheet's beige paper): keep the card, drop the sheet
im = Image.open(C + 'helmet_rgb.png').convert('RGB'); a = np.asarray(im, np.float32)
bg = np.median(np.concatenate([a[:20, :20].reshape(-1, 3), a[-20:, -20:].reshape(-1, 3), a[:20, -20:].reshape(-1, 3), a[-20:, :20].reshape(-1, 3)]), 0)
d = np.linalg.norm(a - bg, axis=2); fg = d > 22
lab, n = ndi.label(fg); big = lab == (np.bincount(lab.ravel())[1:].argmax() + 1)
big = ndi.binary_fill_holes(ndi.binary_closing(big, iterations=6)); big = ndi.binary_opening(big, iterations=3)
al = ndi.gaussian_filter(big.astype(np.float32), 1.2)
out = im.convert('RGBA'); out.putalpha(Image.fromarray((al * 255).astype(np.uint8))); out.save(C + 'helmet_card.png'); print('helmet_card', out.size)
# 1b. a clean polaroid: the photo area of that card in a new paper frame
ph = im.crop((70, 60, 760, 770)); W, H = ph.width + 90, ph.height + 190
card = Image.new('RGBA', (W, H), (252, 249, 241, 255)); card.paste(ph, (45, 45))
g = np.asarray(card, np.float32); n = ndi.gaussian_filter(np.random.default_rng(3).standard_normal(g.shape[:2]), 1.2)[..., None] * 4
g[..., :3] = np.clip(g[..., :3] + n, 0, 255); card = Image.fromarray(g.astype(np.uint8), 'RGBA'); card.save(C + 'helmet_polaroid.png'); print('helmet_polaroid', card.size)
# 2. rider with motion-blurred lower tyres (fork and exhaust sit above the hub, so only the lower half spins)
r0 = Image.open(C + 'rider.isnet-general-use.png').convert('RGBA'); r = Image.new('RGBA', (r0.width, r0.height + 40)); r.paste(r0, (0, 0)); R = np.asarray(r, np.float32)
acc = R.copy()
for (cx, cy, rad) in [(240, 850, 150), (1030, 860, 165)]:
    box = (cx - rad - 4, cy - rad - 4, cx + rad + 4, cy + rad + 4); crop = r.crop(box)
    stack = np.mean([np.asarray(crop.rotate(ang, resample=Image.BICUBIC, center=(rad + 4, rad + 4)), np.float32) for ang in np.linspace(-9, 9, 13)], 0)
    hh = ww = 2 * rad + 8; yy, xx = np.mgrid[0:hh, 0:ww]; dy, dx = yy - (rad + 4), xx - (rad + 4); rr = np.hypot(dx, dy)
    m = ((rr > rad * .3) & (rr < rad * .97) & (dy > rad * .12)).astype(np.float32); m = ndi.gaussian_filter(m, 6)[..., None]
    y0, x0 = box[1], box[0]; region = acc[y0:y0 + hh, x0:x0 + ww]; region[:] = region * (1 - m) + stack * m
Image.fromarray(np.clip(acc[:r0.height], 0, 255).astype(np.uint8), 'RGBA').save(C + 'rider_spin.png'); print('rider_spin')
