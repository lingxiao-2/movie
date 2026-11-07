# Remove text that must not be on screen (or must appear later) from two approved plates, keeping the paper texture:
#  · act8_cake: the hand-written ending line on the note (it fades back in from the original plate at the end)
#  · act3_map : the 「约1小时」 pill (an invented travel time is not allowed)
# Fill = smooth colour (Telea inpaint at 1/4 res) + real paper grain quilted from clean blocks around the hole.
# Only the masked pixels change. usage: python -I scripts/clean_plates.py <repo-root>
import sys, os, numpy as np, cv2
ROOT = sys.argv[1]; SRC = os.path.join(ROOT, 'memory-mv-book/pc/up'); DST = os.path.join(ROOT, 'memory-mv-remotion/build/plates')
K = 4264 / 1672
def fill(img, mask, ring_box, seed):
    h, w = mask.shape; q = 4
    f = img.astype(np.float32); hp = f - cv2.GaussianBlur(f, (0, 0), 6)
    # smooth colour from paper-coloured pixels only (normalised convolution): no bleed from borders, trees or roads
    x0, y0, x1, y1 = ring_box; ref = np.median(f[y0:y1, x0:x1].reshape(-1, 3)[~(cv2.dilate(mask, np.ones((61, 61), np.uint8))[y0:y1, x0:x1].reshape(-1) > 0)], axis=0)
    valid = ((np.abs(f - ref).sum(2) < 40) & (cv2.dilate(mask, np.ones((61, 61), np.uint8)) == 0)).astype(np.float32)
    sm = lambda a: cv2.resize(cv2.GaussianBlur(cv2.resize(a, (w // q, h // q), interpolation=cv2.INTER_AREA), (0, 0), 22), (w, h), interpolation=cv2.INTER_CUBIC)
    low = sm(f * valid[..., None]) / np.maximum(sm(valid)[..., None], 1e-3)
    # candidate grain blocks: inside ring_box, outside the (dilated) hole, low edge energy
    B = 40; x0, y0, x1, y1 = ring_box; hole = cv2.dilate(mask, np.ones((25, 25), np.uint8)) > 0
    edge = cv2.GaussianBlur(np.abs(cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.CV_32F)), (0, 0), 3)
    cands = [(x, y) for y in range(y0, y1 - B, B // 2) for x in range(x0, x1 - B, B // 2) if not hole[y:y + B, x:x + B].any()]
    cands.sort(key=lambda p: edge[p[1]:p[1] + B, p[0]:p[0] + B].mean()); cands = cands[:max(8, len(cands) // 3)]
    rng = np.random.default_rng(seed); tex = np.zeros_like(f); wsum = np.zeros((h, w, 1), np.float32)
    win = np.outer(np.hanning(B), np.hanning(B)).astype(np.float32)[..., None] + 1e-3
    ys, xs = np.where(mask > 0); Y0, Y1, X0, X1 = ys.min() - B, ys.max() + B, xs.min() - B, xs.max() + B
    for y in range(max(0, Y0), min(h - B, Y1), B // 2):
        for x in range(max(0, X0), min(w - B, X1), B // 2):
            cx, cy = cands[rng.integers(len(cands))]; tex[y:y + B, x:x + B] += hp[cy:cy + B, cx:cx + B] * win; wsum[y:y + B, x:x + B] += win
    tex = tex / np.maximum(wsum, 1e-3)
    out = np.clip(low + tex, 0, 255)
    a = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
    return (f * (1 - a) + out * a).astype(np.uint8)
# --- cake: ink strokes on the note
img = cv2.imread(f'{SRC}/act8_cake.png'); x0, y0, x1, y1 = [int(v * K) for v in (1305, 352, 1648, 516)]
reg = img[y0:y1, x0:x1].astype(np.float32); lum = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY).astype(np.float32)
paper = cv2.medianBlur(lum.astype(np.uint8), 41).astype(np.float32)
ink = ((paper - lum) > 12).astype(np.uint8) * 255; ink = cv2.dilate(ink, np.ones((9, 9), np.uint8))
mask = np.zeros(img.shape[:2], np.uint8); mask[y0:y1, x0:x1] = ink
rb = [int(v * K) for v in (1300, 360, 1652, 520)]
cv2.imwrite(f'{DST}/act8_cake_clean.png', fill(img, mask, rb, 3)); print('cake ink px', int((ink > 0).sum()))
# --- map: the travel-time pill (rounded box incl. its white border)
img = cv2.imread(f'{SRC}/act3_map.png'); mask = np.zeros(img.shape[:2], np.uint8)
bx0, by0, bx1, by1 = [int(v * K) for v in (497, 556, 760, 674)]; r = int(56 * K)
cv2.rectangle(mask, (bx0 + r, by0), (bx1 - r, by1), 255, -1); cv2.rectangle(mask, (bx0, by0 + r), (bx1, by1 - r), 255, -1)
for cx, cy in [(bx0 + r, by0 + r), (bx1 - r, by0 + r), (bx0 + r, by1 - r), (bx1 - r, by1 - r)]: cv2.circle(mask, (cx, cy), r, 255, -1)
rb = [int(v * K) for v in (330, 560, 1000, 760)]
cv2.imwrite(f'{DST}/act3_map_clean.png', fill(img, mask, rb, 5)); print('map pill px', int((mask > 0).sum()))
