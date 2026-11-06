# Layers for the anniversary-card opening (rigid use only). Original coords = 1672×941; plates = up/*.png (k = 2400/941).
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from rembg import new_session, remove
K = 2400 / 941; sess = new_session('isnet-general-use')
L = lambda n: np.asarray(Image.open(f'up/{n}.png').convert('RGB'))
def save(n, rgb, a): Image.fromarray(np.dstack([rgb, np.clip(a, 0, 255).astype(np.uint8)]), 'RGBA').save(f'layers/{n}.png')
def box_mask(shape, boxes):
    m = np.zeros(shape, np.uint8)
    for x0, y0, x1, y1 in boxes: m[int(y0):int(y1), int(x0):int(x1)] = 1
    return m
def matte(img, box):
    x0, y0, x1, y1 = [int(v * K) for v in box]; c = Image.fromarray(img[y0:y1, x0:x1])
    a = np.asarray(remove(c, session=sess, only_mask=True, post_process_mask=True))
    a = (ndi.binary_fill_holes(cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((21, 21), np.uint8)) > 128)).astype(np.uint8)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(a); a = (lab == 1 + np.argmax(st[1:, 4])).astype(np.float32)
    full = np.zeros(img.shape[:2], np.float32); full[y0:y1, x0:x1] = cv2.GaussianBlur(a, (0, 0), 1.2); return full

M, N = L('cover'), L('cover_noribbon'); H, W = M.shape[:2]
# 1) base card = ribbon-free cover with the MASTER's sport bike + helmet sticker on top (the master bike stays)
bike = matte(M, (1128, 405, 1580, 740)); base = (N * (1 - bike[..., None]) + M * bike[..., None]).astype(np.uint8)
Image.fromarray(base).save('layers/cover_base.png')
# 2) ribbon pieces = where the master differs from the ribbon-free cover, inside the ribbon zones
m0 = np.asarray(Image.open('src/cover.png').convert('RGB'), np.float32); n0 = np.asarray(Image.open('src/cover_noribbon.png').convert('RGB'), np.float32)
d = cv2.GaussianBlur(np.abs(m0 - n0).mean(2), (0, 0), 2)
zones = box_mask(d.shape, [(0, 0, 720, 941), (380, 0, 1060, 140), (560, 580, 1230, 941), (1440, 520, 1672, 720), (1250, 780, 1672, 941)])
zones[405:740, 1128:1440] = 0                                    # never take pixels from the bike sticker area
hsv = cv2.cvtColor(m0.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32); hue, sat = hsv[..., 0], hsv[..., 1]
satin = ((hue < 12) | (hue > 160)) & (sat > 55)                     # pink satin ribbon and the red wax seal
bk = cv2.resize(bike, (1672, 941)) > .1
r = ((d > 22) & (zones > 0) & satin & ~bk).astype(np.uint8)
r = cv2.morphologyEx(r, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))); r = ndi.binary_fill_holes(r).astype(np.uint8)
r = cv2.morphologyEx(r, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
nl, lab, st, _ = cv2.connectedComponentsWithStats(r); r = np.isin(lab, [i for i in range(1, nl) if st[i, 4] > 900]).astype(np.uint8)
seal = r * box_mask(r.shape, [(780, 605, 1000, 815)])
pieces = {'rib_L': r * box_mask(r.shape, [(0, 0, 720, 941), (380, 0, 1060, 140)]) * (1 - box_mask(r.shape, [(560, 580, 720, 941), (140, 560, 720, 941)])),
          'rib_B': r * box_mask(r.shape, [(560, 580, 1230, 941)]) * (1 - seal), 'seal': seal,
          'rib_R': r * box_mask(r.shape, [(1440, 520, 1672, 720), (1250, 780, 1672, 941)])}
for n, pm in pieces.items():
    a = cv2.GaussianBlur(cv2.resize(pm.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 1.5)
    save(n, M, a * 255); ys, xs = np.where(a > .5); print(n, 'px', int(pm.sum()), 'bbox', (xs.min() / K, ys.min() / K, xs.max() / K, ys.max() / K) if len(xs) else None)
# 3) inner page: pop-up stands cut out, holes behind them filled from the page
I = L('inner'); boxes = {'pop_couple': (548, 108, 1015, 525), 'pop_cats': (316, 448, 568, 652), 'pop_bike': (1082, 355, 1520, 692), 'pop_plaque': (425, 532, 1205, 888)}
hole = np.zeros((H, W), np.float32)
for n, b in boxes.items():
    a = matte(I, b); save(n, I, a * 255); hole = np.maximum(hole, a); ys, xs = np.where(a > .5); print(n, 'bottom', ys.max() / K)
hm = (cv2.dilate((hole > .2).astype(np.uint8), np.ones((25, 25), np.uint8)) * 255); q = 4
low = cv2.inpaint(cv2.resize(I, (W // q, H // q), interpolation=cv2.INTER_AREA), cv2.resize(hm, (W // q, H // q), interpolation=cv2.INTER_NEAREST), 11, cv2.INPAINT_TELEA)
low = cv2.resize(cv2.GaussianBlur(low, (0, 0), 6), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
# paper grain from an empty patch of the page, tiled with mirroring
px0, py0 = int(700 * K), int(640 * K); patch = N[py0:py0 + 300, px0:px0 + 300].astype(np.float32)
hi = patch - cv2.GaussianBlur(patch, (0, 0), 8); tile = np.concatenate([hi, hi[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
tex = np.tile(tile, (H // tile.shape[0] + 1, W // tile.shape[1] + 1, 1))[:H, :W]
fill = np.clip(low + tex, 0, 255)
k = cv2.GaussianBlur(hm.astype(np.float32) / 255, (0, 0), 10)[..., None]
Image.fromarray((I * (1 - k) + fill * k).astype(np.uint8)).save('layers/inner_page.png'); print('done')
