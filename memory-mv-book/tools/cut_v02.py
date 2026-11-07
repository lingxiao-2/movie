# Cut the V02 supplement sheet (src/sheet_v02b.png, 1672x941) into clean pieces.
# Stickers: die-cut silhouette = everything enclosed by the sticker's own outline (flood fill from the crop border),
#           cut straight above the caption pill that overlaps the sticker's base (the base becomes the paper stand edge).
# Backgrounds: inner rectangle above the caption pill, trimmed to 16:9.
import json, sys, numpy as np, cv2
from PIL import Image
SRC = np.array(Image.open('src/sheet_v02b.png').convert('RGB')).astype(np.int16)
BG = np.array([252, 246, 251])
# name: crop box (sheet px), base cut y (sheet px; stand edge, just above the caption pill)
STK = {
  'm_norm':  ((585, 4, 812, 300), None),
  'm_surp':  ((828, 4, 1064, 300), None),
  'f_norm':  ((1062, 14, 1336, 300), None),
  'bouquet': ((1340, 0, 1666, 300), None),
  'pair':    ((508, 336, 836, 596), None),
  'm_low':   ((1280, 342, 1462, 596), None),
  'm_firm':  ((1462, 342, 1668, 596), None),
  'rider':   ((486, 634, 772, 905), None),
  'city':    ((760, 632, 1184, 768), None),
  'road':    ((782, 772, 1170, 900), None),
}
def pill_top(box):
    # the caption pill: a wide run of cream (pill fill) rows with tan outline near the crop bottom; find first row
    # from the bottom of the full panel where pill-coloured pixels span > 35 % of the width
    x0, y0, x1, y1 = box; a = SRC[y0:y1 + 60, x0:x1]
    cream = (np.abs(a - np.array([251, 240, 222])).sum(2) < 22)
    frac = cream.mean(1); rows = np.where(frac > .35)[0]
    return rows
def sticker(name, box):
    x0, y0, x1, y1 = box; a = SRC[y0:y1, x0:x1]; h, w = a.shape[:2]
    d = np.abs(a - BG).sum(2); m = (d > 16).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    # flood fill the background from the crop border; the sticker is everything not reached
    ff = np.pad(m, 1); ff2 = ff.copy(); mask = np.zeros((h + 4, w + 4), np.uint8)
    cv2.floodFill(ff2, mask, (0, 0), 2)
    inside = (ff2[1:-1, 1:-1] != 2).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inside); i = 1 + int(np.argmax(st[1:, 4]))
    sil = (lab == i).astype(np.uint8)
    sil = cv2.morphologyEx(sil, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return sil
out = {}
for k, (box, _) in STK.items():
    sil = sticker(k, box); x0, y0, x1, y1 = box
    Image.fromarray(sil * 255).save(f'cut/v02/m_{k}.png')
    ys, xs = np.where(sil); out[k] = dict(box=box, bbox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])
    print(k, out[k])
json.dump(out, open('cut/v02/masks.json', 'w'), indent=1)

# ---------------------------------------------------------------- final pieces (run with "final" after the x4 upscale)
CUTY = {'m_norm': 270, 'm_surp': 270, 'f_norm': 260, 'bouquet': 278, 'pair': 238, 'm_low': 233, 'm_firm': 231, 'rider': 252}
KEEP_EXTRA = {'m_surp', 'pair', 'm_firm', 'm_low'}        # expression marks ("!!", sparkle lines) drawn beside the sticker
# backgrounds: inner rect above the caption pill, trimmed to 16:9 (sheet px)
def r169(x0, y0, x1, y1, cx=None):
    h = y1 - y0; w = round(h * 16 / 9); cx = (x0 + x1) / 2 if cx is None else cx; a = round(cx - w / 2); a = max(x0, min(x1 - w, a)); return (a, y0, a + w, y1)
BGS = {'bg_gate': r169(16, 14, 565, 276, 300), 'bg_mall': r169(16, 347, 493, 573), 'bg_dorm': r169(843, 350, 1269, 573),
       'bg_ride': r169(16, 644, 476, 878)}
def final():
    U = Image.open('up/sheet_v02b.png').convert('RGB'); S = 4; meta = {}
    for k, (box, _) in STK.items():
        x0, y0, x1, y1 = box; a = SRC[y0:y1, x0:x1]; h, w = a.shape[:2]
        sil = np.array(Image.open(f'cut/v02/m_{k}.png')) > 0
        if k in CUTY: sil[CUTY[k]:] = False
        if k in KEEP_EXTRA:                     # small separate marks fully above the cut, not touching the border
            d = np.abs(a - BG).sum(2); m = (d > 40).astype(np.uint8); m = cv2.dilate(m, np.ones((3, 3), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(m)
            for i in range(1, n):
                X, Y, Wd, Hh, ar = st[i]
                if 60 < ar < 4000 and X > 0 and Y > 0 and X + Wd < w and Y + Hh < CUTY.get(k, h) and not (sil[lab == i]).any():
                    sil |= cv2.dilate((lab == i).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
        al = cv2.resize(sil.astype(np.float32), (w * S, h * S), interpolation=cv2.INTER_LINEAR)
        al = cv2.GaussianBlur(al, (0, 0), 1.6); al = np.clip((al - .5) * 3 + .5, 0, 1)
        if k in CUTY: al[CUTY[k] * S - 1:] = 0
        if k not in KEEP_EXTRA:                 # drop stray bits (panel edges) not joined to the sticker
            n, lab, st, _ = cv2.connectedComponentsWithStats((al > .02).astype(np.uint8)); i = 1 + int(np.argmax(st[1:, 4])); al = np.where(lab == i, al, 0)
        rgb = np.array(U.crop((x0 * S, y0 * S, x1 * S, y1 * S)))
        ys, xs = np.where(al > .02); bx = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        o = np.dstack([rgb, (al * 255).astype(np.uint8)])[bx[1]:bx[3], bx[0]:bx[2]]
        Image.fromarray(o, 'RGBA').save(f'cut/v02/{k}.png'); meta[k] = {'size': [o.shape[1], o.shape[0]], 'flat_base': k in CUTY}
        print(k, o.shape)
    for k, b in BGS.items():
        im = U.crop(tuple(v * S for v in b)).resize((1672 * 2, 941 * 2), Image.LANCZOS); im.save(f'cut/v02/{k}.png'); meta[k] = {'src_box': b}; print(k, b)
    json.dump(meta, open('cut/v02/pieces.json', 'w'), indent=1)
if len(sys.argv) > 1 and sys.argv[1] == 'final': final()
