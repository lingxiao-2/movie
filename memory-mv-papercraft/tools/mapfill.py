# Fill the gap the bike leaves on the map: low-frequency colour from a wide inpaint + real map-paper texture
# (high-pass) borrowed from a mirrored strip of the same map just below the gap. Route dashes are removed too.
import numpy as np, cv2
from PIL import Image
im = np.asarray(Image.open('up/act3_map.png').convert('RGB')).astype(np.float32); H, W = im.shape[:2]; k = H / 941
moto = np.asarray(Image.open('cut/act3_map_moto.png'))[..., 3] > 10
import json; m = json.load(open('cut/stickers.json'))['act3_map']['moto']; x0, y0 = int(m['x'] * k), int(m['y'] * k)
hole = np.zeros((H, W), np.uint8); hole[y0:y0 + moto.shape[0], x0:x0 + moto.shape[1]] = moto
hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
hsv = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(int); red = (((hsv[..., 0] < 8) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 90) & (hsv[..., 2] > 150))
zone = np.zeros_like(red); zone[int(330 * k):int(720 * k), int(200 * k):int(1170 * k)] = True; zone[int(560 * k):int(720 * k), int(1080 * k):int(1190 * k)] = False; zone[int(570 * k):int(650 * k), int(495 * k):int(760 * k)] = False
dash = cv2.dilate((red & zone).astype(np.uint8), np.ones((9, 9), np.uint8))
allh = np.maximum(hole, dash)
q = 6; low = cv2.inpaint(cv2.resize(im.astype(np.uint8), (W // q, H // q), interpolation=cv2.INTER_AREA), cv2.resize(allh * 255, (W // q, H // q), interpolation=cv2.INTER_NEAREST), 15, cv2.INPAINT_TELEA)
low = cv2.resize(cv2.GaussianBlur(low.astype(np.float32), (0, 0), 3), (W, H), interpolation=cv2.INTER_CUBIC)
hi = im - cv2.GaussianBlur(im, (0, 0), 10)
ys, xs = np.where(hole > 0); by0, by1 = ys.min(), ys.max(); bh = by1 - by0
src = hi[by1:by1 + bh][::-1] if by1 + bh <= H else np.concatenate([hi[by1:H], hi[by1:H][::-1]])[:bh][::-1]
tex = np.zeros_like(hi); n = min(bh, src.shape[0]); tex[by0:by0 + n] = src[:n] * .9
tex = np.where(dash[..., None] > 0, hi * 0 + np.random.default_rng(2).normal(0, 3, hi.shape), tex)
a = cv2.GaussianBlur(allh.astype(np.float32), (0, 0), 6)[..., None]
out = np.clip(im * (1 - a) + (low + tex) * a, 0, 255).astype(np.uint8)
Image.fromarray(out).save('cut/act3_map_clean.png'); print('ok')
