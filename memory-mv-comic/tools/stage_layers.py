# Paper-theater layers for the act 5 supplements: characters (+ what they hold) as a cut-paper card with an
# off-white paper edge, and the scene behind them with the characters inpainted out. Rigid use only.
import sys, numpy as np, cv2
from PIL import Image
from rembg import new_session, remove
sess = new_session('isnet-anime')
for n in sys.argv[1:]:
    im = Image.open(f'plates/{n}.png').convert('RGB'); W, H = im.size
    m = remove(im.resize((W // 3, H // 3), Image.LANCZOS), session=sess, only_mask=True, post_process_mask=True)
    m = np.asarray(m.resize((W, H), Image.LANCZOS), np.float32) / 255
    m = cv2.GaussianBlur(m, (0, 0), 1.2); rgb = np.asarray(im)
    # paper card: original pixels inside, a ~7 px off-white paper rim outside, slight cream tint toward the rim
    core = (m > .5).astype(np.uint8)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(core); big = 1 + np.argsort(-st[1:, 4])[:2]
    keep = np.isin(lab, big); m = np.where(cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0, m, 0); core = (m > .5).astype(np.uint8)
    if n == 'act5A':   # building fragments that the matte glued to the card (original 1672×941 px)
        kx = W / 1672; f = rgb.astype(int).mean(2)
        for x0, y0, x1, y1, bright in [(740, 120, 840, 318, 0), (985, 200, 1105, 352, 0), (1525, 140, 1672, 360, 165), (520, 0, 720, 150, 150), (1612, 120, 1672, 400, 0)]:
            sl = (slice(int(y0 * kx), int(y1 * kx)), slice(int(x0 * kx), int(x1 * kx)))
            if bright: m[sl] = np.where(f[sl] > bright, 0, m[sl])
            else: m[sl] = 0
        m = cv2.GaussianBlur(m, (0, 0), 1.0); core = (m > .5).astype(np.uint8)
        nl, lab, st, _ = cv2.connectedComponentsWithStats(core); big = 1 + np.argsort(-st[1:, 4])[:2]; keep = np.isin(lab, big)
        m = np.where(keep, m, 0); core = keep.astype(np.uint8)
    # paper card: original pixels inside, a ~7 px off-white paper rim outside, slight cream tint toward the rim
    core = (m > .5).astype(np.uint8)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(core); big = 1 + np.argsort(-st[1:, 4])[:2]
    keep = np.isin(lab, big); m = np.where(cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0, m, 0); core = (m > .5).astype(np.uint8)
    if n == 'act5A':   # building fragments above the bouquet / beside her hair (sheet-measured, original 1672×941 px)
        kx = W / 1672
        for x0, y0, x1, y1 in [(430, 0, 640, 320), (560, 0, 760, 120), (880, 60, 1000, 300)]:
            reg = np.zeros_like(core); reg[int(y0 * kx):int(y1 * kx), int(x0 * kx):int(x1 * kx)] = 1
            lab2 = cv2.connectedComponents((core & reg).astype(np.uint8))[1]
            for c in range(1, lab2.max() + 1):
                cc = lab2 == c
                if cc.sum() < 0.004 * core.size: m[cc] = 0
        core = (m > .5).astype(np.uint8)
    rim = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
    rim = cv2.GaussianBlur(rim.astype(np.float32), (0, 0), 1.4)
    paper = np.array([253, 248, 240], np.float32)
    out = paper * (1 - m[..., None]) + rgb * m[..., None]
    a = np.clip(np.maximum(m, rim), 0, 1)
    Image.fromarray(np.dstack([out, a * 255]).astype(np.uint8), 'RGBA').save(f'stage5/{n}_fg.png')
    # back panel: the painting itself; behind the couple a very soft blur of the same painting (no inpaint smears)
    soft = cv2.GaussianBlur(rgb.astype(np.float32), (0, 0), 60)
    k = cv2.GaussianBlur((cv2.dilate(core, np.ones((61, 61), np.uint8)) > 0).astype(np.float32), (0, 0), 30)[..., None]
    Image.fromarray((rgb * (1 - k) + soft * k).astype(np.uint8)).save(f'stage5/{n}_bg.png')
    print(n, 'fg cover %.1f%%' % (100 * core.mean()))
