# Cut the elements out of the character sheet: crop → Real-ESRGAN anime ×4 → isnet-anime matte → RGBA PNG.
# usage: python cutout.py <sheet.png> <weights anime6B.pth> <out dir>
import sys, numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image, ImageFilter
from rembg import new_session, remove

class RDB(nn.Module):
    def __init__(s, f=64, g=32):
        super().__init__()
        s.conv1 = nn.Conv2d(f, g, 3, 1, 1); s.conv2 = nn.Conv2d(f + g, g, 3, 1, 1); s.conv3 = nn.Conv2d(f + 2 * g, g, 3, 1, 1)
        s.conv4 = nn.Conv2d(f + 3 * g, g, 3, 1, 1); s.conv5 = nn.Conv2d(f + 4 * g, f, 3, 1, 1); s.l = nn.LeakyReLU(.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1))); x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1)))
        x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1))); return s.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * .2 + x
class RRDB(nn.Module):
    def __init__(s, f=64): super().__init__(); s.rdb1, s.rdb2, s.rdb3 = RDB(f), RDB(f), RDB(f)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * .2 + x
class RRDBNet(nn.Module):
    def __init__(s, nb=6, f=64):
        super().__init__()
        s.conv_first = nn.Conv2d(3, f, 3, 1, 1); s.body = nn.Sequential(*[RRDB(f) for _ in range(nb)]); s.conv_body = nn.Conv2d(f, f, 3, 1, 1)
        s.conv_up1 = nn.Conv2d(f, f, 3, 1, 1); s.conv_up2 = nn.Conv2d(f, f, 3, 1, 1); s.conv_hr = nn.Conv2d(f, f, 3, 1, 1); s.conv_last = nn.Conv2d(f, 3, 3, 1, 1); s.l = nn.LeakyReLU(.2, True)
    def forward(s, x):
        fe = s.conv_first(x); fe = fe + s.conv_body(s.body(fe))
        fe = s.l(s.conv_up1(F.interpolate(fe, scale_factor=2, mode='nearest'))); fe = s.l(s.conv_up2(F.interpolate(fe, scale_factor=2, mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(fe)))

sheet, wts, out = sys.argv[1:4]
net = RRDBNet(); sd = torch.load(wts, map_location='cpu'); net.load_state_dict(sd.get('params_ema', sd.get('params', sd)), strict=True); net.eval()
torch.set_num_threads(4)
def up4(img):
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255.).permute(2, 0, 1)[None]
    with torch.no_grad(): y = net(x).clamp(0, 1)[0].permute(1, 2, 0).numpy()
    return Image.fromarray((y * 255 + .5).astype(np.uint8))
sess = new_session('isnet-anime')
S = Image.open(sheet).convert('RGB')
BOX = {  # (x0, y0, x1, y1) on the 1188 × 1324 sheet
  'rider': (70, 1060, 380, 1310), 'helmet': (440, 1075, 660, 1300), 'moto': (825, 815, 1180, 1015),
  'him_down': (550, 800, 672, 918), 'her_flat': (548, 922, 672, 1040), 'him_side': (712, 85, 812, 378),
  'him_front': (492, 85, 600, 378), 'her_front': (590, 85, 700, 378),
}
only = sys.argv[4:] or list(BOX)
for k in only:
    crop = S.crop(BOX[k]); big = up4(crop); big.save(f'{out}/{k}_rgb.png')
    rgba = remove(big, session=sess, post_process_mask=True)
    a = rgba.split()[3].filter(ImageFilter.GaussianBlur(.8))
    res = big.convert('RGBA'); res.putalpha(a); res.save(f'{out}/{k}.png'); print(k, res.size)
