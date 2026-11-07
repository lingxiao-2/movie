# Pre-scale every stand to its exact on-screen size (Lanczos, straight alpha) so the browser draws it 1:1 and an
# upright stand is exactly as sharp as the source art. usage: python -I scripts/prescale.py <repo-root>
import sys, os, json
from PIL import Image
ROOT = sys.argv[1]; HERE = os.path.join(ROOT, 'memory-mv-remotion'); A = json.load(open(os.path.join(HERE, 'data/assets.json')))
sizes = {}
for grp, items in A.items():
    if grp.startswith('_'): continue
    for k, v in items.items():
        s = v.get('display_scale')
        if not s: continue
        src = os.path.join(ROOT, v['master']); im = Image.open(src).convert('RGBA')
        w, h = round(im.width * s), round(im.height * s)
        # resize in premultiplied space so the white paper edge does not pick up dark fringe from transparent pixels
        pm = im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
        out = os.path.join(HERE, 'build/display', grp, k + '.png'); os.makedirs(os.path.dirname(out), exist_ok=True); pm.save(out)
        sizes[f'{grp}/{k}'] = [w, h]; print(grp, k, w, h)
json.dump(sizes, open(os.path.join(HERE, 'src/sizes.json'), 'w'), indent=1)
