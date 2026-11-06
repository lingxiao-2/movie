#!/bin/sh
# act1–6 → 2400 px tall working plates (allows ~2× push-ins at 1080p); act78 strip at full ×4
PY=${PY:-python3}; W=${W:?weights}; cd "$(dirname "$0")/.."
for a in act1 act2 act3 act4 act5 act6; do $PY -I tools/upscale.py "$W" assets/src/$a.png assets/up/$a.png 2400; done
$PY -I tools/upscale.py "$W" assets/src/act78.png assets/up/act78.png 3764
