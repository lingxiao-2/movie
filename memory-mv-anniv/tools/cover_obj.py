# The approved cover card as ONE object: alpha only (card + its ribbons + bow + seal + charm), RGB untouched.
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
from rembg import new_session, remove
im = Image.open('card/src/cover.png').convert('RGB'); rgb = np.asarray(im); H, W = rgb.shape[:2]
card = np.zeros((H, W), np.uint8); cv2.fillPoly(card, [np.int32([(97, 100), (1545, 22), (1640, 800), (150, 893)])], 1)
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(int); satin = (((hsv[..., 0] < 12) | (hsv[..., 0] > 160)) & (hsv[..., 1] > 55)).astype(np.uint8)
m = np.asarray(remove(im, session=new_session('isnet-general-use'), only_mask=True, post_process_mask=True)) > 100
obj = card.astype(bool) | (m & cv2.dilate(satin, np.ones((5, 5), np.uint8)).astype(bool))
lab, n = ndi.label(obj); sizes = ndi.sum(obj, lab, range(1, n + 1)); obj = lab == (1 + int(np.argmax(sizes)))   # one connected object
obj = ndi.binary_fill_holes(cv2.morphologyEx(obj.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)))
a = cv2.GaussianBlur(obj.astype(np.float32), (0, 0), 1.0)
Image.fromarray(np.dstack([rgb, (a * 255).astype(np.uint8)]), 'RGBA').save('obj/cover_obj.png')
assert (np.asarray(Image.open('obj/cover_obj.png'))[..., :3] == rgb).all(); print('cover object saved; RGB identical to cover.png; coverage %.1f%%' % (100 * obj.mean()))
