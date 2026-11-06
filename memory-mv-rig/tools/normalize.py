# Prepare cut parts for the rig (rigid operations only — rotation, trimming, removing stray pixels; never warping):
#  * arm capsules drawn diagonally on the sheet → rotated so their long axis is vertical (rig/…_v.png)
#  * T-shirt: the bits of static arm painted inside the sleeves are removed (the rigged arms replace them)
#  * head: the two painted eyes are located (for the blink patches) → parts/head_eyes.json
import json, numpy as np, cv2
from PIL import Image
def load(n): return np.array(Image.open(f'parts/{n}.png').convert('RGBA'))
def save(n, a): Image.fromarray(a, 'RGBA').save(f'parts/{n}.png')
def trim(a):
    ys, xs = np.where(a[..., 3] > 8); return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
def upright(n):
    a = load(n); ys, xs = np.where(a[..., 3] > 128); P = np.c_[xs, ys].astype(float); c = P.mean(0)
    w, v = np.linalg.eigh(np.cov((P - c).T)); ax = v[:, np.argmax(w)]; ang = np.degrees(np.arctan2(ax[1], ax[0]))
    rot = 90 - ang                                # make the long axis vertical
    h, wd = a.shape[:2]; D = int(np.hypot(h, wd)) + 4
    pad = np.zeros((D, D, 4), np.uint8); pad[(D - h) // 2:(D - h) // 2 + h, (D - wd) // 2:(D - wd) // 2 + wd] = a
    M = cv2.getRotationMatrix2D((D / 2, D / 2), -rot, 1.0)
    r = cv2.warpAffine(pad, M, (D, D), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))
    save(n + '_v', trim(r)); print(n, 'rotated', round(rot, 1))
for n in ['m_arm_upper', 'm_arm_fore', 'f_arm_upper', 'f_arm_fore']: upright(n)

# T-shirt: remove skin-coloured pixels below the sleeves (static arm stubs) in the lower outer corners
for n in ['m_torso_tee', 'm_torso_tee_cam']:
    a = load(n); h, w = a.shape[:2]; f = a[..., :3].astype(int)
    skin = (f[..., 0] > 200) & (f[..., 1] > 160) & (f[..., 0] - f[..., 2] > 25) & (a[..., 3] > 0)
    yy, xx = np.mgrid[0:h, 0:w]; zone = (yy > h * .55) & ((xx < w * .2) | (xx > w * .8))
    kill = cv2.dilate((skin & zone).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    a[..., 3] = np.where(kill & zone, 0, a[..., 3]); save(n, trim(a)); print(n, 'arm stubs removed', int((kill & zone).sum()))

# head: the two painted eyes = the two biggest dark clusters in the middle band of the face
out = {}
for n in ['m_head_base', 'f_head_base']:
    a = load(n); h, w = a.shape[:2]; g = a[..., :3].mean(2)
    dark = ((g < 140) & (a[..., 3] > 0)).astype(np.uint8); dark[:int(h * .42)] = 0; dark[int(h * .78):] = 0
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    nl, lab, st, cen = cv2.connectedComponentsWithStats(dark)
    idx = sorted(range(1, nl), key=lambda i: -st[i, cv2.CC_STAT_AREA])[:2]
    eyes = sorted([[int(v) for v in st[i, :4]] for i in idx], key=lambda b: b[0])
    # skin colour from the cheek just below each eye
    skin = [int(v) for v in np.median(a[int(h * .72):int(h * .78), int(w * .35):int(w * .65), :3].reshape(-1, 3), 0)]
    out[n] = {'eyes': eyes, 'skin': skin, 'size': [w, h]}; print(n, out[n])
json.dump(out, open('parts/head_eyes.json', 'w'), indent=1)
