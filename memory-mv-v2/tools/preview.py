import sys
from PIL import Image
files = sys.argv[2:]; tiles = []
for f in files:
    im = Image.open(f).convert('RGBA'); s = 420 / max(im.width, im.height); im = im.resize((int(im.width * s), int(im.height * s)))
    bg = Image.new('RGB', (440, 440), (70, 130, 80)); bg.paste(im, ((440 - im.width) // 2, (440 - im.height) // 2), im); tiles.append(bg)
out = Image.new('RGB', (440 * min(5, len(tiles)), 440 * ((len(tiles) + 4) // 5)))
for i, t in enumerate(tiles): out.paste(t, ((i % 5) * 440, (i // 5) * 440))
out.save(sys.argv[1])
