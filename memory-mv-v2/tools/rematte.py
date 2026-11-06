# Re-matte upscaled crops with another rembg model: python rematte.py <model> <name>...
import sys
from PIL import Image, ImageFilter
from rembg import new_session, remove
m = sys.argv[1]; sess = new_session(m)
for k in sys.argv[2:]:
    big = Image.open(f'assets/cut/{k}_rgb.png').convert('RGB')
    a = remove(big, session=sess, post_process_mask=True, only_mask=True).filter(ImageFilter.GaussianBlur(.8))
    res = big.convert('RGBA'); res.putalpha(a); res.save(f'assets/cut/{k}.{m}.png'); print(k, m)
