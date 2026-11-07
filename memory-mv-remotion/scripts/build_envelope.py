# Independent envelope layers for the opening / ending, all from the user's own envelope drawings (sheet_parts):
#   from the OPEN envelope (memory-mv-book/cut/env_open.png):
#     lining.png   the gingham inside of the back panel (what is seen inside the opening)
#     pocket.png   the front pocket (side + bottom folds) — the card slides between lining and pocket
#     flap_in.png  inner face of the top flap (the original open flap, gingham), authored rotated 180° (CSS back face)
#     flap_out.png outer face of the same flap: the envelope's own folded paper (its bottom fold, flipped) cut to the
#                  exact silhouette of the flap, so both faces of the rigid flap coincide
#   from the CLOSED envelope (memory-mv-book/cut/env_closed.png):
#     bow.png      the pink bow + heart wax seal, segmented as one object
# Pixels are copied, never repainted. usage: python -I scripts/build_envelope.py <repo-root>
import sys, os, json, numpy as np, cv2
from PIL import Image
ROOT = sys.argv[1]; B = os.path.join(ROOT, 'memory-mv-book/cut'); OUT = os.path.join(ROOT, 'memory-mv-remotion/build/envelope'); os.makedirs(OUT, exist_ok=True)
op = np.array(Image.open(f'{B}/env_open.png').convert('RGBA')); H, W = op.shape[:2]
FOLD = 356                                                     # the fold line (top edge of the body), env_open px
def poly(pts, shape): m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); return m
def feather(m, s=1.2): return cv2.GaussianBlur(m.astype(np.float32), (0, 0), s)
def save(rgb, a, name, crop=None):
    o = np.dstack([rgb, np.clip(a, 0, 255).astype(np.uint8)])
    if crop: x0, y0, x1, y1 = crop; o = o[y0:y1, x0:x1]
    Image.fromarray(o, 'RGBA').save(f'{OUT}/{name}.png'); return o.shape
alpha = op[..., 3].astype(np.float32); rgb = op[..., :3]
# lining: the region inside the opening, bounded by the fold line and the inner edges of the side folds
lin = poly([(14, FOLD - 6), (938, FOLD - 6), (548, 600), (408, 600)], (H, W))
body = np.zeros((H, W), np.uint8); body[FOLD - 6:] = 255
save(rgb, np.minimum(alpha, feather(lin)), 'lining')
# pocket: the body minus the lining region (side + bottom folds, with their drawn edges)
pk = cv2.subtract(body, cv2.erode(lin, np.ones((5, 5), np.uint8)))
save(rgb, np.minimum(alpha, feather(pk)), 'pocket')
# flap silhouette = the original open flap (above the fold)
flap_sil = np.zeros((H, W), np.float32); flap_sil[:FOLD] = alpha[:FOLD]
inner = np.dstack([rgb[:FOLD], flap_sil[:FOLD].astype(np.uint8)])            # pointing up, gingham
Image.fromarray(np.ascontiguousarray(inner[::-1, ::-1]), 'RGBA').save(f'{OUT}/flap_in.png')   # authored rotated 180°
# outer face: the bottom fold (tip ~y585, base y~955) flipped vertically, fitted to the flap silhouette (hanging down)
y0, y1, x0, x1 = 580, 958, 8, 944
bf = rgb[y0:y1, x0:x1][::-1]                                  # flipped: base at top, tip at bottom
sil_down = flap_sil[:FOLD][::-1]                              # hanging-down silhouette
ys, xs = np.where(sil_down > 10); sx0, sx1, sy0, sy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
fit = cv2.resize(np.ascontiguousarray(bf), (sx1 - sx0, sy1 - sy0), interpolation=cv2.INTER_CUBIC)
outer = np.zeros((FOLD, W, 3), np.uint8); outer[sy0:sy1, sx0:sx1] = fit
# keep the flap's own paper rim: the outermost band of the silhouette takes the rim colour of the original flap edge
save(outer, sil_down, 'flap_out')
# bow + seal from the closed envelope: inside a loose hand-drawn region around the bow, every paper-coloured pixel
# connected to the region border is paper; everything enclosed by the ribbon's drawn outline is bow
cl = np.array(Image.open(f'{B}/env_closed.png').convert('RGBA')); ca = cl[..., 3]
hsv = cv2.cvtColor(cl[..., :3], cv2.COLOR_RGB2HSV).astype(int); cr = cl[..., :3].astype(int)
roi = poly([(240, 330), (440, 300), (700, 300), (895, 335), (900, 540), (1135, 790), (1100, 830), (880, 735), (800, 745), (650, 545),
            (565, 575), (480, 545), (360, 765), (290, 715), (55, 830), (15, 805), (235, 545)], ca.shape)
lum = (cr[..., 0] * 3 + cr[..., 1] * 6 + cr[..., 2]) / 10
paper = (hsv[..., 1] < 48) & (lum > 205)                     # paper and the lace's cream
shade = (hsv[..., 1] < 75) & (lum > 172)                     # + the soft ribbon shadow drawn on the paper
passable = ((paper | (roi == 0)) & (ca > 0) | (ca == 0)).astype(np.uint8)
n, lab = cv2.connectedComponents(passable, connectivity=4)
outside = np.isin(lab, np.unique(lab[roi == 0]))
bow = (~outside & (roi > 0)).astype(np.uint8)
bow[:352, :445] = 0; bow[:352, 690:] = 0                       # lace line ends above the wings
bow = cv2.morphologyEx(bow, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
n, lab, st, _ = cv2.connectedComponentsWithStats(bow, connectivity=8); bow = (lab == lab[430, 565]).astype(np.uint8)
inv = (1 - bow).astype(np.uint8); n2, lab2 = cv2.connectedComponents(inv, connectivity=4)
border = np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]])); bow = (bow | (~np.isin(lab2, border))).astype(np.uint8)
# trim the drawn ribbon shadow: shadow-coloured pixels reachable from outside, at most 25 px deep
dist = cv2.distanceTransform(bow, cv2.DIST_L2, 5)
pas = ((shade & (bow > 0) & (dist < 25)) | (bow == 0)).astype(np.uint8)
n3, lab3 = cv2.connectedComponents(pas, connectivity=4); outer_lab = np.unique(lab3[bow == 0])
bow = (bow & ~np.isin(lab3, outer_lab)).astype(np.uint8)
bow = cv2.morphologyEx(bow, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
n, lab, st, _ = cv2.connectedComponentsWithStats(bow, connectivity=8); bow = (lab == lab[430, 565]).astype(np.uint8)
# final bow = wings + heart seal + the two inner tails (measured on the drawing); the long outer ribbons that wrap to the
# corners of the closed envelope are left out (they belong to that envelope's shape)
wings = poly([(248, 330), (885, 330), (885, 505), (700, 522), (565, 562), (430, 522), (248, 508)], ca.shape)
tails = cv2.bitwise_or(poly([(465, 485), (503, 515), (338, 746), (325, 681), (269, 686)], ca.shape),
                       poly([(640, 495), (686, 464), (893, 657), (837, 654), (836, 726)], ca.shape))
keep = cv2.bitwise_or(wings, tails)
bow = ((bow > 0) & (wings > 0)) | (cv2.erode(tails, np.ones((3, 3), np.uint8)) > 0)
bow[:352, :445] = 0; bow[:352, 690:] = 0
bow = bow.astype(np.uint8)
ys, xs = np.where(bow); bx = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
save(cl[..., :3], feather(bow * 255, 1.0), 'bow', bx)
meta = {'env_open_size': [W, H], 'fold': FOLD, 'flap_h': FOLD, 'bow_box_in_closed': bx, 'closed_size': [cl.shape[1], cl.shape[0]], 'seal_in_closed': [565, 430]}
json.dump(meta, open(f'{OUT}/envelope.json', 'w'), indent=1); print(meta)
# the complete approved inner page = base page + its four pop-up pieces, stacked (no repainting)
from PIL import Image as _I
C = os.path.join(ROOT, 'memory-mv-card/layers'); base = _I.open(f'{C}/inner_page.png').convert('RGBA')
for k in ['bike', 'couple', 'plaque', 'cats']: base.alpha_composite(_I.open(f'{C}/pop_{k}.png').convert('RGBA'))
base.convert('RGB').save(f'{OUT}/inner_full.png')
