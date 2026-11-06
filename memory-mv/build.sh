#!/bin/sh
# Rebuild 把回忆拼好给你.mp4 from source. Needs the Lemo-Opuscar library (LIB) with core deps installed.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
NAME="把回忆拼好给你"
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -f "$HERE/assets/song.mp3" ] || { echo "put the DJ audio at assets/song.mp3 and the photos in assets/ref/"; exit 1; }
cd "$LIB"
node core/render/still.mjs "$HERE" 0 --size 1080x1920 --q 'sheet=1' --out "$HERE/out" && mv "$HERE/out/t_0.jpg" "$HERE/model_sheet.jpg"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/assets/song.mp3" -ar 48000 -ac 2 "$HERE/out/mix.wav"     # the original audio, untouched in time
LEMO_COLOR=bt709 sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/$NAME.srt"
node core/render/still.mjs "$HERE" 33.2 --size 1080x1920 --out "$HERE/out" && cp "$HERE/out/t_33.2.jpg" "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
