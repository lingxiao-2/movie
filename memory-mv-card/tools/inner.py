# Inner page preview: the user's approved pop-up panel (upscaled), with the retro bike + helmet replaced by the
# sport bike + white helmet stickers cut from the approved cover. Cut-and-place only; nothing redrawn.
import numpy as np, cv2
from PIL import Image
from rembg import new_session, remove
cov = Image.open('src/cover_x4.png').convert('RGB'); kc = cov.width / 1672
pan = Image.open('src/ref_inner_x4.png').convert('RGBA'); kp = pan.width / 834
# remove the retro bike's leftovers that stick out around the new sticker (mirrors, bars, tail light)
P = np.asarray(pan.convert('RGB')).copy(); M = np.zeros(P.shape[:2], np.uint8)
for x0, y0, x1, y1 in [(2470, 570, 2575, 712), (2640, 610, 2775, 770), (3120, 850, 3230, 1050)]: M[y0:y1, x0:x1] = 255
P = cv2.inpaint(P, M, 15, cv2.INPAINT_TELEA); pan = Image.fromarray(P).convert('RGBA')
# 1. sticker group from the cover (bike + helmet), matte = cream sticker border vs pink card paper
box = (1132, 410, 1572, 732); crop = cov.crop(tuple(int(v * kc) for v in box))
m = np.asarray(remove(crop, session=new_session('isnet-general-use'), only_mask=True, post_process_mask=True))
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
from scipy import ndimage as ndi
m = (ndi.binary_fill_holes(m > 128) * 255).astype(np.uint8); m = cv2.GaussianBlur(m, (0, 0), 1.2)
st = crop.convert('RGBA'); st.putalpha(Image.fromarray(m)); st.save('parts/cover_bike_helmet.png')
# 2. cover the panel's retro bike + helmet: place the group a little larger than their area, with a soft shadow
tx0, ty0, tx1 = 532, 166, 800                       # target box in panel px (834-wide)
w = int((tx1 - tx0) * kp); h = int(st.height * w / st.width)
s2 = st.resize((w, h), Image.LANCZOS)
sh = Image.new('RGBA', s2.size, (60, 20, 30, 0)); a = np.asarray(s2)[..., 3].astype(np.float32)
sh.putalpha(Image.fromarray(cv2.GaussianBlur(a * .45, (0, 0), 14).astype(np.uint8)))
# the cover's couple-photo stamp as a second keepsake photo (also hides the leftover handlebar)
sb = (1146, 36, 1536, 356); sc = cov.crop(tuple(int(v * kc) for v in sb))
sm = np.asarray(remove(sc, session=new_session('isnet-general-use'), only_mask=True, post_process_mask=True))
sm = (ndi.binary_fill_holes(cv2.morphologyEx(sm, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8)) > 128) * 255).astype(np.uint8)
stp = sc.convert('RGBA'); stp.putalpha(Image.fromarray(cv2.GaussianBlur(sm, (0, 0), 1.2))); stp.save('parts/cover_stamp.png')
sw = int(190 * kp); stp = stp.resize((sw, int(stp.height * sw / stp.width)), Image.LANCZOS).rotate(-7, expand=True, resample=Image.BICUBIC)
ss_ = Image.new('RGBA', stp.size, (60, 20, 30, 0)); ss_.putalpha(Image.fromarray(cv2.GaussianBlur(np.asarray(stp)[..., 3].astype(np.float32) * .4, (0, 0), 12).astype(np.uint8)))
pan.alpha_composite(ss_, (int(588 * kp) + 10, int(62 * kp) + 14)); pan.alpha_composite(stp, (int(588 * kp), int(62 * kp)))
x, y = int(tx0 * kp), int(ty0 * kp)
pan.alpha_composite(sh, (x + 10, y + 16)); pan.alpha_composite(s2, (x, y))
pan.convert('RGB').save('preview/inner_preview.png'); print('inner', pan.size, 'sticker', s2.size)
