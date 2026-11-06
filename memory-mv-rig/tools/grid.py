# grid overlay for picking coordinates: grid.py in out [x0 y0 x1 y1] [step]
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGB'); box = tuple(map(int, sys.argv[3:7])) if len(sys.argv) > 6 else (0, 0, im.width, im.height)
st = int(sys.argv[7]) if len(sys.argv) > 7 else 50
im = im.crop(box); s = max(1, 1100 // im.width) if im.width < 1100 else 1; im = im.resize((im.width * s, im.height * s), Image.NEAREST); d = ImageDraw.Draw(im)
for x in range((box[0] // st + 1) * st, box[2], st): X = (x - box[0]) * s; d.line([(X, 0), (X, im.height)], fill=(255, 255, 0) if x % (st * 2) == 0 else (0, 255, 255), width=1); d.text((X + 2, 2), str(x), fill=(255, 0, 0))
for y in range((box[1] // st + 1) * st, box[3], st): Y = (y - box[1]) * s; d.line([(0, Y), (im.width, Y)], fill=(255, 255, 0) if y % (st * 2) == 0 else (0, 255, 255), width=1); d.text((2, Y + 2), str(y), fill=(255, 0, 0))
im.save(sys.argv[2])
