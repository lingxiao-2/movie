# Prepare paper-craft layers from the user's finished illustrations (props/stickers only — never characters' bodies).
#  * sticker: cut a white-bordered sticker (rembg) → cut/<plate>_<name>.png (+ pivot); the plate gets a clean copy
#    with that spot filled from its own surroundings (soft inpaint + the plate's paper grain) → cut/<plate>_clean.png
#  * polaroids: each polaroid of the collage rectified (rigid rotation) to an upright card → cut/pol_XX.png
import sys, os, json, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from rembg import new_session, remove
SESS = new_session('isnet-general-use')
def plate(n):
    p = f'up/{n}.png' if os.path.exists(f'up/{n}.png') else f'src/{n}.png'
    im = np.asarray(Image.open(p).convert('RGB')); return im, im.shape[0] / 941
STK = {   # plate: [(name, box x0 y0 x1 y1 on the 1672×941 original, pivot 'b'ottom/'c'entre)]
  'act1_phones': [('bubL', (612, 268, 712, 355), 'b'), ('bubR', (1008, 345, 1108, 420), 'b')],
  'act1_split': [('bubL', (640, 405, 775, 485), 'b'), ('heart', (780, 290, 900, 445), 'c'), ('bubR', (855, 465, 985, 560), 'b'), ('scribble', (10, 310, 178, 475), 'c')],
  'act2_dorm': [('think', (700, 65, 1315, 450), 'b'), ('words', (980, 465, 1540, 605), 'b')],
  'act3_ride': [('think', (965, 15, 1520, 395), 'b')],
  'act3_map': [('moto', (585, 140, 1025, 570), 'b'), ('time', (500, 575, 755, 645), 'c')],
  'act4_gate': [('h1', (1295, 190, 1395, 280), 'c'), ('h2', (1380, 345, 1460, 415), 'c'), ('marks', (840, 210, 925, 310), 'c')],
  'act4_mall': [('h1', (1295, 210, 1395, 295), 'c'), ('h2', (1355, 295, 1435, 370), 'c'), ('marks', (815, 155, 905, 285), 'c')],
  'act5_gift': [('tag', (1205, 55, 1595, 305), 'c'), ('heart', (860, 135, 990, 250), 'c'), ('pol', (1375, 555, 1672, 870), 'c')],
  'act8_cake': [('year', (60, 215, 375, 335), 'c'), ('words', (1265, 375, 1615, 565), 'c')],
}
def cut_sticker(im, k, box):
    x0, y0, x1, y1 = [int(v * k) for v in box]; crop = Image.fromarray(im[y0:y1, x0:x1])
    a = np.asarray(remove(crop, session=SESS, only_mask=True, post_process_mask=True))
    a = ndi.binary_fill_holes(cv2.morphologyEx((a > 100).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)))
    lab, n = ndi.label(a)
    if n > 1:   # keep the big component and anything sizeable (multi-part stickers like heart + marks)
        sz = ndi.sum(a, lab, range(1, n + 1)); a = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > sz.max() * .12])
    full = np.zeros(im.shape[:2], np.float32); full[y0:y1, x0:x1] = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.0)
    return full
def clean(im, mask, k):
    H, W = mask.shape; hole = (cv2.dilate((mask > .1).astype(np.uint8), np.ones((int(9 * k) | 1,) * 2, np.uint8)) * 255)
    q = 2; low = cv2.inpaint(cv2.resize(im, (W // q, H // q), interpolation=cv2.INTER_AREA), cv2.resize(hole, (W // q, H // q), interpolation=cv2.INTER_NEAREST), 9, cv2.INPAINT_TELEA)
    low = cv2.resize(cv2.GaussianBlur(low, (0, 0), 2), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    hi = im.astype(np.float32) - cv2.GaussianBlur(im.astype(np.float32), (0, 0), 6)       # the plate's own grain, borrowed from just outside the hole
    ring = cv2.dilate(hole, np.ones((61, 61), np.uint8)) > 0
    grain = np.zeros_like(hi); grain[:] = np.std(hi[ring & (hole == 0)], 0) * np.random.default_rng(1).standard_normal(hi.shape) * .8
    a = cv2.GaussianBlur(hole.astype(np.float32) / 255, (0, 0), 3)[..., None]
    return np.clip(im * (1 - a) + (low + grain) * a, 0, 255).astype(np.uint8)
def do_stickers():
    meta = {}
    for pn, lst in STK.items():
        im, k = plate(pn); allm = np.zeros(im.shape[:2], np.float32); meta[pn] = {}
        for name, box, piv in lst:
            m = cut_sticker(im, k, box); allm = np.maximum(allm, m)
            ys, xs = np.where(m > .02); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            Image.fromarray(np.dstack([im[y0:y1, x0:x1], (m[y0:y1, x0:x1] * 255).astype(np.uint8)]), 'RGBA').save(f'cut/{pn}_{name}.png')
            px, py = ((x0 + x1) / 2, y1 if piv == 'b' else (y0 + y1) / 2)
            meta[pn][name] = {'x': float(x0 / k), 'y': float(y0 / k), 'w': float((x1 - x0) / k), 'h': float((y1 - y0) / k), 'px': float(px / k), 'py': float(py / k)}
        if pn == 'act3_map':   # the drawn route: hide it, it is redrawn growing along the same path
            hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV).astype(int); red = (((hsv[..., 0] < 8) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 90) & (hsv[..., 2] > 150))
            zone = np.zeros_like(red); zone[int(330 * k):int(720 * k), int(200 * k):int(1170 * k)] = True
            zone[int(560 * k):int(720 * k), int(1080 * k):int(1190 * k)] = False                            # keep the Taian pin
            zone[int(570 * k):int(650 * k), int(495 * k):int(760 * k)] = False                              # and the time tag
            allm = np.maximum(allm, cv2.dilate((red & zone).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32))
        Image.fromarray(clean(im, allm, k)).save(f'cut/{pn}_clean.png'); print(pn, list(meta[pn]))
    json.dump(meta, open('cut/stickers.json', 'w'), indent=1)
POL = [  # collage (1536×1024) quads TL TR BR BL + caption
  ('eat', [(46, 44), (390, 38), (404, 298), (54, 304)]), ('weihai', [(394, 20), (840, 36), (830, 304), (388, 296)]),
  ('train', [(846, 18), (1172, 8), (1196, 298), (858, 306)]), ('park', [(1176, 40), (1532, 62), (1514, 364), (1158, 342)]),
  ('medicine', [(10, 304), (416, 298), (426, 596), (16, 602)]), ('shot', [(400, 302), (752, 290), (772, 590), (412, 602)]),
  ('gift', [(792, 308), (1162, 330), (1142, 632), (770, 612)]), ('mood', [(1148, 356), (1532, 370), (1526, 642), (1140, 632)]),
  ('movie', [(14, 604), (346, 620), (330, 902), (4, 886)]), ('noodle', [(344, 626), (662, 604), (672, 916), (356, 936)]),
  ('study', [(664, 604), (976, 664), (956, 946), (644, 892)]), ('night', [(944, 650), (1202, 660), (1196, 932), (940, 926)]),
  ('city', [(1204, 642), (1532, 620), (1534, 942), (1210, 946)]),
]
def do_polaroids():
    col = np.asarray(Image.open('up/act6_polaroids.png' if os.path.exists('up/act6_polaroids.png') else 'src/act6_polaroids.png').convert('RGB')); k = col.shape[0] / 1024
    for name, q in POL:
        q = np.float32(q) * k; c = q.mean(0); q = c + (q - c) * .955                        # inset: drop overlapping neighbours at the rim
        w = int(np.hypot(*(q[1] - q[0]))); h = int(np.hypot(*(q[3] - q[0])))
        M = cv2.getPerspectiveTransform(q, np.float32([(0, 0), (w, 0), (w, h), (0, h)]))
        Image.fromarray(cv2.warpPerspective(col, M, (w, h), flags=cv2.INTER_CUBIC)).save(f'cut/pol_{name}.png'); print('pol', name, w, h)
if __name__ == '__main__':
    os.makedirs('cut', exist_ok=True)
    if 'stk' in sys.argv: do_stickers()
    if 'pol' in sys.argv: do_polaroids()
