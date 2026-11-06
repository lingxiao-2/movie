#!/bin/sh
# Rebuild the animated version. Needs: Lemo-Opuscar library (LIB), a Python env (PY) with torch, rembg, opencv,
# libigl; the final project's assets (assets → ../memory-mv-final/assets, with up/ and layers/ built there).
set -e
LIB=${LIB:-/root/lemo-opuscar}; HERE=$(cd "$(dirname "$0")" && pwd); NAME="把回忆拼好给你_动画升级版"; PY=${PY:-python3}
cd "$HERE"
[ -f assets/layers/act8_fg.png ] || { echo "build ../memory-mv-final first (its build.sh makes assets/up and assets/layers)"; exit 1; }
$PY -I tools/bgfix.py act8 && $PY -I -c "import numpy as np; from PIL import Image; Image.fromarray(np.array(Image.open('assets/layers/act7_fg.png'))[..., :3]).save('bgfix/act7_bg.png')"
$PY -I tools/rig.py                                   # ARAP puppet rigs for every shot → rig/
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-3} --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/assets/song.mp3" -ar 48000 -ac 2 "$HERE/out/mix.wav"
LEMO_COLOR=bt709 sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/$NAME.srt"
node core/render/still.mjs "$HERE" 31.9 --size 1920x1080 --out "$HERE/out" && cp "$HERE/out/t_31.9.jpg" "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
