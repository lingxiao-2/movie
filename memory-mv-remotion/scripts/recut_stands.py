# Re-cut the V02 paper stands so the alpha ends exactly on the artist's die-cut outline.
# The V02 sheet painted a soft lavender drop shadow around every sticker; the first cut (memory-mv-book/cut/v02)
# kept a ragged band of it. Here every cool, light pixel connected to the outside (= sheet background or its
# shadow) within 70 px of the old edge is removed; the warm white paper border and the red-brown outline stop it.
# Pixels are never repainted, only the alpha changes. Needs: numpy, pillow, opencv-python-headless.
# usage: python -I scripts/recut_stands.py <repo-root>
import sys, os, json, numpy as np, cv2
from PIL import Image
ROOT = sys.argv[1]; SRC = os.path.join(ROOT, 'memory-mv-book/cut/v02'); DST = os.path.join(ROOT, 'memory-mv-remotion/build/stands')
os.makedirs(DST, exist_ok=True); report = {}
for k in ['m_norm', 'm_surp', 'f_norm', 'bouquet', 'pair', 'm_low', 'm_firm', 'rider']:
    a = np.array(Image.open(f'{SRC}/{k}.png').convert('RGBA')); rgb = a[..., :3].astype(int); a0 = a[..., 3]
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]; lum = (R * 3 + G * 6 + B) / 10
    if k in ('m_low', 'm_firm'):   # these two have a mauve die-cut line and a cool white border: only the lighter halo outside it goes
        cool = (B >= G + 2) & (lum > 195) & (lum < 250)
    else:
        cool = ((B >= R - 3) & (lum > 165)) | ((B >= G + 2) & (lum > 140))   # sheet background / its mauve-lavender shadow
    out0 = a0 < 24
    passable = (cool | out0).astype(np.uint8)
    n, lab = cv2.connectedComponents(passable, connectivity=4)
    touch = np.unique(lab[out0]); O = np.isin(lab, touch[touch > 0])
    dist = cv2.distanceTransform((~out0).astype(np.uint8), cv2.DIST_L2, 5)
    O &= dist <= 70
    M = (~O & ~out0).astype(np.uint8)
    M = cv2.morphologyEx(M, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(M, connectivity=8); big = 1 + int(np.argmax(st[1:, 4]))
    keep = np.zeros_like(M, bool)
    for i in range(1, n):
        if i == big or (st[i, 4] > 2500 and k in ('m_surp', 'pair', 'm_firm', 'm_low')): keep |= lab == i
    # fill pin-holes fully enclosed by the paper
    inv = (~keep).astype(np.uint8); n2, lab2 = cv2.connectedComponents(inv, connectivity=4)
    border = np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]])); keep |= ~np.isin(lab2, border)
    f = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 1.1); al = np.clip((f - .5) * 2.2 + .5, 0, 1)
    al = np.minimum(al * 255, a0.astype(np.float32)).astype(np.uint8)
    ys, xs = np.where(al > 3); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    o = np.dstack([a[..., :3], al])[y0:y1, x0:x1]
    # the flat base: the stand's bottom row is the hinge — make it a clean straight cut
    o[-2:, :, 3] = 0
    Image.fromarray(o, 'RGBA').save(f'{DST}/{k}.png')
    removed = int(((a0 > 128) & (al < 128)).sum())
    report[k] = {'size': [int(o.shape[1]), int(o.shape[0])], 'removed_px': removed, 'removed_pct': round(100 * removed / max(1, int((a0 > 128).sum())), 2)}
    print(k, report[k])
json.dump(report, open(f'{DST}/recut_report.json', 'w'), indent=1)
