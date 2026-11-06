# Male cut-out model v2 — rigid parts only (translate / rotate / uniform scale; no warping, no stretching).
#   body   = the sheet's full-character example (head, glasses, hair, shirt body, trousers, shoes), with its own
#            sleeves cut off along the drawn shoulder seam and the hands-in-pockets removed (pockets re-painted
#            from the surrounding trouser fabric)
#   arms   = the sheet's upper-arm parts (sleeve + upper arm, rotate as one: the sleeve follows the arm)
#            → forearm parts (cut at the wrist) → swappable hand parts
# Units: px of the ×4 sheet; "sheet" coordinates are on the original 1448 × 1086 image.
import json, math, numpy as np, cv2
from PIL import Image, ImageFilter

S = 4
META = json.load(open('parts/parts.json'))
FIG_O = META['figure']['origin_sheet']
def fig(x, y): return ((x - FIG_O[0]) * S, (y - FIG_O[1]) * S)            # sheet → figure px
def L(n): return np.array(Image.open(f'parts/{n}.png').convert('RGBA'))

# ------------------------------------------------------------------ body
def make_body():
    a = L('figure'); H, W = a.shape[:2]; rgb = a[..., :3].copy(); al0 = a[..., 3].copy()
    sy = lambda y: (y - FIG_O[1]) * S; sx = lambda x: (x - FIG_O[0]) * S
    # trouser outer edges just below the pockets, measured from the alpha
    row = al0[int(sy(648))] > 128; xs = np.where(row)[0]; xl, xr = xs.min(), xs.max()
    print('trouser edges at y648 (sheet x):', xl / S + FIG_O[0], xr / S + FIG_O[0])
    # left/right boundary of the kept body, per row: the shirt seam from the shoulder to the hem, then a straight
    # hip line out to the trouser edge; below that the original silhouette
    dark = (rgb.max(2) < 150) & (al0 > 128); edgeL, edgeR = {}, {}
    for y in range(int(sy(648)), int(sy(820))):
        xs = np.where(dark[y])[0]
        if len(xs): edgeL[y], edgeR[y] = xs.min() - 4, xs.max() + 5
    from scipy.ndimage import median_filter
    ys_ = sorted(edgeL); eL = median_filter(np.array([edgeL[y] for y in ys_], float), 61); eR = median_filter(np.array([edgeR[y] for y in ys_], float), 61)
    edgeL = dict(zip(ys_, eL)); edgeR = dict(zip(ys_, eR))
    y0_ = int(sy(648)); xl, xr = edgeL[y0_], edgeR[y0_]
    def bound(y):
        if y in edgeL: return edgeL[y], edgeR[y]
        if y < sy(362) or y > sy(648): return 0, W
        if y <= sy(586): return sx(149), sx(266)
        u = (y - sy(586)) / (sy(648) - sy(586)); return sx(149) + (xl - sx(149)) * u, sx(266) + (xr - sx(266)) * u
    keep = np.zeros((H, W), bool)
    for y in range(H):
        l, r = bound(y); keep[y, max(0, int(round(l))):min(W, int(round(r)))] = True
    al = np.where(keep, al0, 0).astype(np.uint8)
    # inside the hip zone everything is trouser fabric: repaint skin / hand outlines there
    f = rgb.astype(int); fabric = (f.max(2) < 120)
    zone = keep & (np.mgrid[0:H, 0:W][0] > sy(560)) & (np.mgrid[0:H, 0:W][0] < sy(650))
    bad = zone & ~fabric
    bad = cv2.dilate(bad.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & zone
    hip = zone & (al0 < 200); al = np.where(hip, 255, al).astype(np.uint8); bad |= hip   # fill the notch where the wrist was
    known = keep & (al > 200) & ~bad
    q = 2; small = cv2.resize(rgb, (W // q, H // q), interpolation=cv2.INTER_AREA)
    m = cv2.resize((~known).astype(np.uint8) * 255, (W // q, H // q), interpolation=cv2.INTER_NEAREST)
    fill = cv2.resize(cv2.inpaint(small, m, 11, cv2.INPAINT_TELEA), (W, H), interpolation=cv2.INTER_CUBIC).astype(float)
    fill += np.random.default_rng(3).normal(0, 4, fill.shape)
    rgb = np.where(bad[..., None], np.clip(fill, 0, 255), rgb).astype(np.uint8)
    # outline along the new cut edges (where the kept silhouette is narrower than the original)
    sil = (al > 128).astype(np.uint8); edge = sil - cv2.erode(sil, np.ones((3, 3), np.uint8))
    orig_edge = cv2.dilate(((al0 > 128).astype(np.uint8) - cv2.erode((al0 > 128).astype(np.uint8), np.ones((3, 3), np.uint8))), np.ones((9, 9), np.uint8))
    new_edge = (edge > 0) & (orig_edge == 0)
    line = cv2.GaussianBlur(cv2.dilate(new_edge.astype(np.uint8) * 255, np.ones((7, 7), np.uint8)), (0, 0), 1.2).astype(float)[..., None] / 255
    ink = np.array([52, 36, 34], float); rgb = (rgb * (1 - line * .9) + ink * line * .9).astype(np.uint8)
    low = int(sy(800)); op = cv2.morphologyEx(al[low:], cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))); al[low:] = op
    nl, lab, st, _ = cv2.connectedComponentsWithStats((al > 40).astype(np.uint8)); li = 1 + int(np.argmax(st[1:, 4]))
    al = np.where(lab == li, al, 0).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, al]), 'RGBA').save('parts/body.png')
    print('body', W, H, 'repainted', int(bad.sum()))

def ends(a):
    al = a[..., 3] > 100; ys, xs = np.where(al); h = al.shape[0]
    top = xs[ys < ys.min() + h * .04].mean(); bot = xs[ys > ys.max() - h * .04].mean()
    return (top, ys.min()), (bot, ys.max())

def make_arms():
    for side in 'LR':
        f = L(f'fore_{side}'); h = f.shape[0]; cutY = int(h * .74)                # the fist starts at ~74 % of the part
        g = f[:cutY].copy(); fade = np.linspace(1, 0, 18)[:, None]; g[-18:, :, 3] = (g[-18:, :, 3] * fade).astype(np.uint8)
        Image.fromarray(g, 'RGBA').save(f'parts/forearm_{side}.png')
    piv = {}
    for n in ['arm_upper_L', 'arm_upper_R', 'forearm_L', 'forearm_R']:
        a = L(n); (tx, ty), (bx, by) = ends(a); piv[n] = {'top': [float(tx), float(ty)], 'bottom': [float(bx), float(by)], 'size': [a.shape[1], a.shape[0]]}
    # wrists of the hand parts: relaxed hand = cuff at the top; open hand = palm base at the bottom
    for n, end in [('hand_relax', 'top'), ('hand_open', 'bottom'), ('hand_point', 'bottom')]:
        a = L(n); (tx, ty), (bx, by) = ends(a); piv[n] = {'wrist': [float(tx), float(ty)] if end == 'top' else [float(bx), float(by)], 'size': [a.shape[1], a.shape[0]]}
    json.dump(piv, open('parts/pivots.json', 'w'), indent=1); print(json.dumps(piv))

if __name__ == '__main__':
    make_body(); make_arms()
