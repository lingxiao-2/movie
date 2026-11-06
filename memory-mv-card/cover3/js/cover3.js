// 3-second cover transition test. The cover (src/cover.png) is ONE untouched image used as a rigid board:
//  mode A — the whole board swings open about its left edge (rigid rotation + perspective projection only)
//  mode B — the whole board slides away to the upper left (translation + slight rotation + scale only)
import { seg, ss, eio, eo, ei, clamp, lerp } from '/core/lib.js';
const MODE = new URLSearchParams(location.search).get('mode') || 'A';
let W, H, G, COVER, INNER;
const im = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + s)); i.src = s; });
export async function load(w, h, g) { W = w; H = h; G = g; COVER = await im('src/cover.png'); INNER = await im('src/inner.png'); }
function tri(g, img, s0, s1, s2, d0, d1, d2) {   // exact affine map of one image triangle (no per-pixel warping)
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const mx = (d0[0] + d1[0] + d2[0]) / 3, my = (d0[1] + d1[1] + d2[1]) / 3, gr = q => { const ex = q[0] - mx, ey = q[1] - my, l = Math.hypot(ex, ey) || 1; return [q[0] + ex / l * .8, q[1] + ey / l * .8]; };
  const q0 = gr(d0), q1 = gr(d1), q2 = gr(d2);
  g.save(); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.lineTo(...q2); g.closePath(); g.clip();
  g.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]); g.drawImage(img, 0, 0); g.restore();
}
// the inner page, with a gentle push in after the reveal
function inner(g, t) { const u = eio(seg(t, 1.6, 3.0)), s = 1 + .06 * u, w = W * s, h = H * s; g.drawImage(INNER, (W - w) / 2, (H - h) * .45, w, h); }
// a soft band of light sweeping across the whole cover (a light overlay — the cover pixels are untouched)
function sweep(g, t, a0, a1) { const u = seg(t, a0, a1); if (u <= 0 || u >= 1) return; const x = lerp(-W * .4, W * 1.4, eio(u));
  const gr = g.createLinearGradient(x - 260, 0, x + 260, H * .5); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(.5, `rgba(255,248,230,${.22 * Math.sin(Math.PI * u)})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
function vignette(g) { const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(40,15,35,0)'); v.addColorStop(1, 'rgba(40,15,35,.28)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }

function modeA(g, t) {
  const th = Math.PI / 2 * eio(seg(t, .85, 2.2));                // 0 → 90°: past 90° the board is beyond the left edge of frame
  if (th > 0) inner(g, t);
  if (th > 0) { const sh = Math.sin(th) * (1 - seg(t, 1.9, 2.3)), gr = g.createLinearGradient(0, 0, W * .9, 0); gr.addColorStop(0, `rgba(60,20,40,${.5 * sh})`); gr.addColorStop(1, 'rgba(60,20,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (th < Math.PI / 2 - .002) {
    const F = W * 2.6, ct = Math.cos(th), st = Math.sin(th), cx = W / 2, cy = H / 2;
    const P = (x, y) => { const z = x * st, f = F / (F - z); return [cx + (x * ct - cx) * f, cy + (y - cy) * f]; };
    const N = 160, iw = COVER.width, ih = COVER.height;
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, x0 = u0 * W, x1 = u1 * W;
      const A0 = P(x0, 0), A1 = P(x1, 0), B0 = P(x0, H), B1 = P(x1, H);
      tri(g, COVER, [u0 * iw, 0], [u1 * iw, 0], [u0 * iw, ih], A0, A1, B0); tri(g, COVER, [u1 * iw, 0], [u1 * iw, ih], [u0 * iw, ih], A1, B1, B0); }
    // light falling off as the board turns, and the board's paper edge
    const E0 = P(W, 0), E1 = P(W, H);
    g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(...E0); g.lineTo(...E1); g.lineTo(0, H); g.closePath(); g.fillStyle = `rgba(40,15,35,${.35 * (1 - ct)})`; g.fill();
    g.strokeStyle = `rgba(255,247,238,${.9 * st})`; g.lineWidth = 6 + 10 * st; g.beginPath(); g.moveTo(...E0); g.lineTo(...E1); g.stroke(); g.restore();
    if (t < .85) sweep(g, t, .1, .85);
  }
}
function modeB(g, t) {
  const u = seg(t, .85, 2.25), e = eio(u);
  if (u > 0) inner(g, t);
  if (u < 1) {
    const dx = -W * .95 * e, dy = -H * .55 * e, rot = -7 * ei(u) * Math.PI / 180, s = 1 - .12 * e, lift = Math.sin(Math.PI * Math.min(1, u * 1.6));
    g.save(); g.translate(W / 2 + dx, H / 2 + dy); g.rotate(rot); g.scale(s, s);
    g.shadowColor = `rgba(50,15,35,${.55 * lift})`; g.shadowBlur = 60 * lift; g.shadowOffsetX = 30 * lift; g.shadowOffsetY = 40 * lift;
    g.drawImage(COVER, -W / 2, -H / 2, W, H); g.restore();
    if (t < .85) sweep(g, t, .1, .85);
  }
}
export function frame(t) {
  const g = G; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#2a1428'; g.fillRect(0, 0, W, H);
  (MODE === 'B' ? modeB : modeA)(g, t); vignette(g);
  if (t < .3) { g.fillStyle = `rgba(20,10,22,${1 - ss(t / .3)})`; g.fillRect(0, 0, W, H); }
}
