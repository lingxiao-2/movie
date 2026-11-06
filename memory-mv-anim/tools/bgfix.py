# Row-wise background fill for horizon scenes (sea/sky): behind the characters, each row is continued by
# interpolating between the nearest known pixels left and right of the hole, plus a little grain.
import sys, numpy as np, cv2
from PIL import Image
for s in sys.argv[1:]:
    fg = np.array(Image.open(f'assets/layers/{s}_fg.png')); A = fg[..., 3]; src = np.array(Image.open(f'assets/layers/{s}_bg.png').convert('RGB')).astype(np.float32)
    orig = fg[..., :3].astype(np.float32)
    hole = cv2.dilate((A > 20).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    out = orig.copy(); H, W = hole.shape
    for y in range(H):
        row = hole[y]
        if not row.any(): continue
        xs = np.where(~row)[0]
        if len(xs) < 2: out[y] = src[y]; continue
        for c in range(3): out[y, :, c] = np.where(row, np.interp(np.arange(W), xs, orig[y, xs, c]), orig[y, :, c])
    sm = cv2.GaussianBlur(out, (0, 0), 3)
    out = np.where(hole[..., None], sm + np.random.default_rng(1).normal(0, 2.5, out.shape), orig)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f'bgfix/{s}_bg.png'); print(s)
