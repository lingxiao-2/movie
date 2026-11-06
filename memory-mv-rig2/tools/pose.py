# Assemble the male model in a pose (rigid parts only) → RGBA image. Used for the static check and the animation.
import json, math, numpy as np, cv2
from PIL import Image
S = 4; META = json.load(open('parts/parts.json')); PIV = json.load(open('parts/pivots.json')); FO = META['figure']['origin_sheet']
F = lambda x, y: np.array([(x - FO[0]) * S, (y - FO[1]) * S])            # sheet → figure px
def load(n): return Image.open(f'parts/{n}.png').convert('RGBA')

def split_head():
    b = np.array(load('body')); H, W = b.shape[:2]
    # erase the speck left of the left shoe
    x0, y0 = F(40, 828); x1, y1 = F(76, 870); b[int(y0):int(y1), int(x0):int(x1), 3] = 0
    cut = int(F(0, 352)[1]); over = int(F(0, 366)[1])
    head = b.copy(); head[over:, :, 3] = 0
    fade = np.linspace(1, 0, over - cut)[:, None]; head[cut:over, :, 3] = (head[cut:over, :, 3] * fade).astype(np.uint8)   # soft lower edge over the neck
    body = b.copy(); body[:int(F(0, 330)[1]), :, 3] = 0                                                             # neck stays on the body
    # the body keeps the neck only: remove hair/ears that hang below the cut line from the body layer
    hairish = (body[..., :3].astype(int).max(2) < 110) & (np.mgrid[0:H, 0:W][0] < F(0, 372)[1]); body[..., 3] = np.where(hairish & (np.mgrid[0:H, 0:W][0] < F(0, 366)[1]), 0, body[..., 3])
    Image.fromarray(head, 'RGBA').save('parts/head_layer.png'); Image.fromarray(body, 'RGBA').save('parts/body_layer.png')

ARM_K = {'upper': 1.3, 'fore': .85, 'hand': .85}
UPPER_CROP = .75
def M(tx, ty, deg=0, s=1):                       # 3×3: translate · rotate · scale
    r = math.radians(deg); c, sn = math.cos(r), math.sin(r)
    return np.array([[c * s, -sn * s, tx], [sn * s, c * s, ty], [0, 0, 1]])
def paste(canvas, img, A):
    Ai = np.linalg.inv(A); w, h = canvas.size
    t = img.transform((w, h), Image.AFFINE, tuple(Ai[:2].ravel()), resample=Image.BICUBIC)
    canvas.alpha_composite(t)

CACHE = {}
def part(n, crop=None):
    k = (n, crop)
    if k not in CACHE:
        im = load(n)
        if crop: im = im.crop((0, 0, im.width, int(im.height * crop)))
        CACHE[k] = im
    return CACHE[k]

# joints (sheet coords): shoulders at the top of each seam, neck under the chin
SH = {'L': (148, 402), 'R': (267, 402)}; NECK = (205, 360)
def render(pose, pad=(700, 500, 700, 120)):
    body, head = part('body_layer'), part('head_layer')
    W, H = body.width + pad[0] + pad[2], body.height + pad[1] + pad[3]
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); O = np.array([pad[0], pad[1]])
    root = M(*(O + pose.get('root', (0, 0))))
    paste(cv, body, root)
    n = F(*NECK); h = pose.get('head', {})
    paste(cv, head, root @ M(n[0] + h.get('x', 0), n[1] + h.get('y', 0), h.get('r', 0)) @ M(-n[0], -n[1]))
    for side in 'LR':
        a = pose.get(side, {})
        up = part(f'arm_upper_{side}', UPPER_CROP); pv = PIV[f'arm_upper_{side}']; ku = ARM_K['upper']
        cap = np.array([pv['top'][0], pv['top'][1] + up.width * .42])           # centre of the round sleeve cap
        A_sh = root @ M(*F(*SH[side]), a.get('sh', 0)) @ M(0, 0, 0, ku) @ M(-cap[0], -cap[1])
        elbow_local = np.array([pv['bottom'][0] if False else up.width / 2, up.height - 30, 1])
        fo = part(f'forearm_{side}'); pf = PIV[f'forearm_{side}']; kf = ARM_K['fore']
        E = A_sh @ elbow_local
        # rotation of the upper arm in world space (for chaining the forearm)
        ang = math.degrees(math.atan2(A_sh[1, 0], A_sh[0, 0]))
        A_fo = M(E[0], E[1], ang + a.get('el', 0)) @ M(0, 0, 0, kf) @ M(-pf['top'][0], -(pf['top'][1] + 22))
        Wr = A_fo @ np.array([pf['bottom'][0], pf['bottom'][1] - 6, 1])
        hn = a.get('hand', 'hand_relax'); hi = part(hn); ph = PIV[hn]; kh = ARM_K['hand']
        flip = (side == 'R') == (hn == 'hand_relax')        # relaxed hand drawn for the viewer-right arm? mirror the other
        A_h = M(Wr[0], Wr[1], ang + a.get('el', 0) + a.get('wr', 0) + (180 if hn != 'hand_relax' else 0)) @ M(0, 0, 0, kh)
        if flip: A_h = A_h @ np.array([[-1, 0, 0], [0, 1, 0], [0, 0, 1]])
        A_h = A_h @ M(-ph['wrist'][0], -ph['wrist'][1])
        paste(cv, up, A_sh) if a.get('behind') else None
        paste(cv, fo, A_fo); paste(cv, hi, A_h)
        if not a.get('behind'): paste(cv, up, A_sh)
    return cv

def outline(img, px=14, col=(255, 250, 242)):
    a = np.array(img)[..., 3]; d = cv2.dilate((a > 30).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (px * 2 + 1, px * 2 + 1)))
    d = cv2.GaussianBlur(d, (0, 0), 1.5); base = Image.new('RGBA', img.size, col + (0,)); base.putalpha(Image.fromarray(d)); base.alpha_composite(img); return base

POSES = {
  'rest':     {'L': {'sh': 4, 'el': 6, 'wr': -28}, 'R': {'sh': -4, 'el': -6, 'wr': 28}},
  'one_up':   {'L': {'sh': 100, 'el': 82, 'wr': 0, 'hand': 'hand_open'}, 'R': {'sh': -4, 'el': -6, 'wr': 28}, 'head': {'y': -14, 'r': -2}},
  'arms_down':{'L': {'sh': 9, 'el': 2, 'wr': -32}, 'R': {'sh': -9, 'el': -2, 'wr': 32}},
}
if __name__ == '__main__':
    import sys
    split_head()
    out = []
    for name in sys.argv[1:] or POSES:
        im = outline(render(POSES[name])); im.save(f'preview/pose_{name}.png'); out.append(im); print(name, im.size)
    W = sum(i.width for i in out) // 3; H = out[0].height // 3
    sheet = Image.new('RGB', (W, H), (243, 232, 222))
    x = 0
    for im in out:
        s = im.resize((im.width // 3, im.height // 3), Image.LANCZOS); sheet.paste(s, (x, 0), s); x += s.width
    sheet.save('preview/assembly.jpg', quality=92)
