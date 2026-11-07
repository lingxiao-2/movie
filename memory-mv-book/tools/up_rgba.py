# Real-ESRGAN anime x4 on RGB; alpha (if any) resized with Lanczos. usage: up_rgba.py weights in out
import sys, os, numpy as np, torch
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from esrgan import RRDBNet
w, src, dst = sys.argv[1:4]
net = RRDBNet(); sd = torch.load(w, map_location='cpu'); net.load_state_dict(sd.get('params_ema', sd)); net.eval(); torch.set_num_threads(4)
img = Image.open(src); rgba = img.convert('RGBA'); im = np.asarray(rgba.convert('RGB'), np.float32) / 255; h, wd, _ = im.shape
T, O = 192, 12; out = np.zeros((h * 4, wd * 4, 3), np.float32)
for y in range(0, h, T):
    for x in range(0, wd, T):
        y0, x0, y1, x1 = max(0, y - O), max(0, x - O), min(h, y + T + O), min(wd, x + T + O)
        with torch.no_grad(): r = net(torch.from_numpy(im[y0:y1, x0:x1]).permute(2, 0, 1)[None]).clamp(0, 1)[0].permute(1, 2, 0).numpy()
        yy, xx = (y - y0) * 4, (x - x0) * 4; hh, ww = min(T, h - y) * 4, min(T, wd - x) * 4
        out[y * 4:y * 4 + hh, x * 4:x * 4 + ww] = r[yy:yy + hh, xx:xx + ww]
o = Image.fromarray((out * 255 + .5).astype(np.uint8))
if img.mode == 'RGBA': o.putalpha(rgba.split()[3].resize(o.size, Image.LANCZOS))
o.save(dst); print(dst, o.size)
