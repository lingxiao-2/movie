# Cut the new male sheet (×4 upscale). Reuses the paper-distance matte from the first rig attempt.
import sys, json, numpy as np, cv2
from PIL import Image
sys.path.insert(0, '/home/user/movie/memory-mv-rig/tools'); from cutparts import matte, peel
S = 4
BOX = {  # original 1448×1086 sheet px
  'figure': (25, 45, 345, 905), 'arm_upper_L': (690, 590, 762, 732), 'arm_upper_R': (778, 590, 852, 732),
  'fore_L': (868, 592, 938, 736), 'fore_R': (948, 592, 1020, 736),
  'hand_relax': (1072, 582, 1134, 645), 'hand_open': (1155, 580, 1222, 645), 'hand_point': (1245, 580, 1308, 645), 'hand_hold': (1335, 580, 1395, 645),
  'eye_closed_L': (732, 452, 838, 500), 'eye_closed_R': (884, 452, 990, 500), 'mouth_smile': (1085, 455, 1160, 490), 'mouth_open': (1195, 440, 1280, 500),
}
sheet = Image.open('src/male_sheet_x4.png').convert('RGB'); meta = {}
for n, (x0, y0, x1, y1) in BOX.items():
    crop = np.asarray(sheet.crop((x0 * S, y0 * S, x1 * S, y1 * S))); a = matte(crop); a = peel(crop, a)
    nl, lab, st, _ = cv2.connectedComponentsWithStats((a > 40).astype(np.uint8)); li = 1 + int(np.argmax(st[1:, 4]))
    keep = [i for i in range(1, nl) if i == li or st[i, 4] > st[li, 4] * .08]
    a = np.where(np.isin(lab, keep), a, 0).astype(np.uint8); a = cv2.GaussianBlur(a, (0, 0), .8)
    ys, xs = np.where(a > 8); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(np.dstack([crop, a])[by0:by1, bx0:bx1], 'RGBA').save(f'parts/{n}.png')
    meta[n] = {'origin_sheet': [x0 + bx0 / S, y0 + by0 / S], 'size': [int(bx1 - bx0), int(by1 - by0)]}; print(n, meta[n])
json.dump(meta, open('parts/parts.json', 'w'), indent=1)
