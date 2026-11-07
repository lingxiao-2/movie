# Remotion compatibility probe

This folder holds only a 3-frame probe. It is not the MV project.

It uses the V02 PNG files from the old project unchanged:
- copy `bg_gate.png`, `bg_mall.png`, `m_norm.png` and `f_norm.png` from `../../memory-mv-book/cut/v02/` into `public/`;
- then run `npm i && npm run still`.

Result (verified 2026-11-07):
- Remotion 4.0.541 downloaded its own chrome-headless-shell on first run.
- It rendered 3 frames at 1920×1080:
  - the paper stands rotate about their bottom hinge with CSS 3D perspective;
  - the next page falls from its top edge.
