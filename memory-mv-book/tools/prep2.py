# Round-2 page prep (fixed-camera pop-up book). Never overwrites earlier files.
#  dorm: remove the drawn inner-monologue text inside the bubble (strokes only, refilled from the bubble's own paper)
#  map:  remove the "约1小时" pill (+ the drawn route and the bike, refilled with the map's own paper texture)
#  lift stickers (rembg) laid exactly over their painted originals: map Jinan/Taian cards, dorm helmet
import json, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from rembg import new_session, remove
SESS = new_session('isnet-general-use')
def L(p): return np.asarray(Image.open(p).convert('RGB'))
def grain_fill(im, hole, k, blur=2):
    H, W = hole.shape; q = 2
    low = cv2.inpaint(cv2.resize(im, (W // q, H // q), interpolation=cv2.INTER_AREA), cv2.resize(hole * 255, (W // q, H // q), interpolation=cv2.INTER_NEAREST), 9, cv2.INPAINT_TELEA)
    low = cv2.resize(cv2.GaussianBlur(low, (0, 0), blur), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    hi = im.astype(np.float32) - cv2.GaussianBlur(im.astype(np.float32), (0, 0), 6); ring = (cv2.dilate(hole, np.ones((61, 61), np.uint8)) > 0) & (hole == 0)
    g = np.std(hi[ring], 0) * np.random.default_rng(1).standard_normal(hi.shape) * .8
    a = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 2)[..., None]
    return np.clip(im * (1 - a) + (low + g) * a, 0, 255).astype(np.uint8)
# ---- dorm text
im = L('pc/up/act2_dorm.png'); k = im.shape[0] / 941
x0, y0, x1, y1 = [int(v * k) for v in (1070, 478, 1500, 640)]
reg = im[y0:y1, x0:x1].astype(int); lum = reg.mean(2); bg = np.median(lum)
hsv = cv2.cvtColor(im[y0:y1, x0:x1], cv2.COLOR_RGB2HSV).astype(int)
ink = (lum < bg - 28) | ((hsv[..., 1] > 70) & (lum < bg - 4))
ink = cv2.dilate(ink.astype(np.uint8), np.ones((9, 9), np.uint8))
hole = np.zeros(im.shape[:2], np.uint8); hole[y0:y1, x0:x1] = ink
Image.fromarray(grain_fill(im, hole, k)).save('cut/act2_dorm_clean2.png'); print('dorm text removed px', int(ink.sum()))
# ---- map: start from the earlier texture-matched clean map (bike + route removed), then remove the time pill
im = L('pc/cut/act3_map_clean.png'); k = im.shape[0] / 941
hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV).astype(int); pink = (((hsv[..., 0] < 12) | (hsv[..., 0] > 160)) & (hsv[..., 1] > 40))
hole = np.zeros(im.shape[:2], np.uint8); hole[int(560 * k):int(660 * k), int(485 * k):int(775 * k)] = 1
hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
Image.fromarray(grain_fill(im, hole, k, 3)).save('cut/act3_map_clean2.png'); print('map cleaned')
# ---- lift stickers
LIFT = {'act3_map': {'jinan': (100, 28, 570, 380), 'taian': (1105, 455, 1615, 775)}, 'act2_dorm': {'helmet': (620, 620, 1025, 925)}}
meta = {}
for pn, d in LIFT.items():
    im = L(f'pc/up/{pn}.png'); k = im.shape[0] / 941; meta[pn] = {}
    for n, b in d.items():
        X0, Y0, X1, Y1 = [int(v * k) for v in b]; a = np.asarray(remove(Image.fromarray(im[Y0:Y1, X0:X1]), session=SESS, only_mask=True, post_process_mask=True)) > 100
        a = ndi.binary_fill_holes(a); lab, nn = ndi.label(a); sz = ndi.sum(a, lab, range(1, nn + 1)); a = lab == (1 + int(np.argmax(sz)))
        al = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.0); ys, xs = np.where(al > .02); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        Image.fromarray(np.dstack([im[Y0:Y1, X0:X1], (al * 255).astype(np.uint8)])[by0:by1, bx0:bx1], 'RGBA').save(f'cut/lift_{pn}_{n}.png')
        x, y, w, h = (X0 + bx0) / k, (Y0 + by0) / k, (bx1 - bx0) / k, (by1 - by0) / k
        meta[pn][n] = {'x': x, 'y': y, 'w': w, 'h': h, 'px': x + w / 2, 'py': y + h}; print('lift', pn, n, int(w), int(h))
json.dump(meta, open('cut/lift.json', 'w'), indent=1)
