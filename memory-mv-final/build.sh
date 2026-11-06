#!/bin/sh
# Rebuild 把回忆拼好给你.mp4 (1920×1080, 24 fps). Needs: the Lemo-Opuscar library (LIB, core deps installed),
# a Python env with torch + rembg + opencv (PY), the Real-ESRGAN anime 6B weights (W), and the user's files in assets/src + assets/song.mp3.
set -e
LIB=${LIB:-/root/lemo-opuscar}; HERE=$(cd "$(dirname "$0")" && pwd); NAME="把回忆拼好给你"; PY=${PY:-python3}
cd "$HERE"
if [ ! -f assets/up/act78.png ]; then PY=$PY W=${W:?set W to RealESRGAN_x4plus_anime_6B.pth} sh tools/upscale_all.sh; fi
if [ ! -f assets/layers/act8_fg.png ]; then $PY -I tools/layers.py act1 act2 act3 act4 act5 act7 act8; fi
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/assets/song.mp3" -ar 48000 -ac 2 "$HERE/out/mix.wav"        # the original audio, untouched in time
LEMO_COLOR=bt709 sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/$NAME.srt"
node core/render/still.mjs "$HERE" 31.2 --size 1920x1080 --out "$HERE/out" && cp "$HERE/out/t_31.2.jpg" "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
