# Cut independent pieces from the user's RGBA sheets using their OWN alpha (no re-matting).
# A piece = the connected alpha component(s) inside a region (original 1672x941 coords); checks: hole ratio,
# green-screen residue. Output: cut/<name>.png + cut/pieces.json {name: {x,y,w,h} in original px}
import json, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
REG = {
 'sheet_wechat': {
   'phoneL': (95, 60, 590, 745), 'phoneR': (1080, 55, 1600, 750),
   'g1': (600, 60, 1100, 140), 'w1': (520, 160, 1000, 245), 'g2': (610, 280, 1120, 365), 'w2': (545, 385, 1010, 480),
   'heartline': (555, 495, 1110, 610), 'broken': (640, 615, 1020, 790), 'scribble': (450, 770, 640, 880),
   'dots': (690, 780, 900, 920), 'bolt': (10, 0, 150, 120), 'anger': (1510, 10, 1660, 130), 'note': (10, 760, 440, 900), 'tape': (1170, 735, 1660, 900),
 },
 'sheet_polaroids': {f'pol{r}{c}': (10 + c * 412, 15 + r * 300, 422 + c * 412, 325 + r * 300) for r in range(3) for c in range(4)},
 'sheet_parts': {'env_closed': (25, 30, 315, 300), 'env_open': (318, 30, 562, 300), 'night_stage': (1220, 0, 1630, 320), 'couple_mem': (10, 315, 485, 550)},
}
out = {}
for sheet, regs in REG.items():
    im = Image.open(f'up/{sheet}.png').convert('RGBA'); A = np.asarray(im); k = im.height / 941
    for name, (x0, y0, x1, y1) in regs.items():
        X0, Y0, X1, Y1 = [int(v * k) for v in (x0, y0, x1, y1)]; c = A[Y0:Y1, X0:X1].copy(); a = c[..., 3]
        m = a > 128; lab, n = ndi.label(m)
        if n == 0: print('!! empty', name); continue
        sz = ndi.sum(m, lab, range(1, n + 1)); keep = [i + 1 for i, s in enumerate(sz) if s > sz.max() * (.25 if sheet == 'sheet_polaroids' else .08)]
        if name in ('phoneL', 'phoneR', 'g1', 'g2', 'w1', 'w2', 'note', 'dots', 'scribble'): keep = [int(np.argmax(sz)) + 1]
        km = np.isin(lab, keep); km = ndi.binary_fill_holes(km)
        soft = cv2.dilate(km.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        a2 = np.where(soft, a, 0); a2 = np.where(km, np.maximum(a2, 255), a2).astype(np.uint8)     # interior fully opaque
        holes = (km & (a < 128)).sum() / max(1, km.sum())
        rgb = c[..., :3].astype(int); green = ((rgb[..., 1] > rgb[..., 0] + 40) & (rgb[..., 1] > rgb[..., 2] + 40) & (a2 > 30)).sum() / max(1, km.sum())
        ys, xs = np.where(a2 > 8); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        c[..., 3] = a2; Image.fromarray(c[by0:by1, bx0:bx1], 'RGBA').save(f'cut/{name}.png')
        out[name] = {'x': (X0 + bx0) / k, 'y': (Y0 + by0) / k, 'w': (bx1 - bx0) / k, 'h': (by1 - by0) / k}
        print(f'{name:12s} {bx1-bx0:5d}x{by1-by0:<5d} holes {holes*100:4.1f}%  green {green*100:4.2f}%')
json.dump(out, open('cut/pieces.json', 'w'), indent=1)
