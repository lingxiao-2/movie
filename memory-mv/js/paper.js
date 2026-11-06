// Cut-paper finish, grain and small drawing helpers (Canvas 2D).
import { mulberry } from '/core/lib.js';

export const INK = '#3b2a22';          // dark-brown ink, never black
export const BORDER = '#fbf6ea';       // off-white paper border
export const EDGE = '#a39684';         // grey cardboard edge

export function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// shared grain tile
let GRAIN = null;
export function grain() {
  if (GRAIN) return GRAIN;
  const c = mk(256, 256), g = c.getContext('2d'), d = g.createImageData(256, 256), r = mulberry(7);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (r() - .5) * 70 + (r() < .02 ? (r() - .5) * 120 : 0);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  // fibres
  g.globalAlpha = .18; g.lineWidth = .7;
  for (let i = 0; i < 90; i++) { const x = r() * 256, y = r() * 256, a = r() * 6.28, l = 6 + r() * 16; g.strokeStyle = r() < .5 ? '#fff' : '#555'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  GRAIN = c; return c;
}

function silhouette(src, color) {
  const c = mk(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function dilate(g, sil, x, y, r, n = 20) {
  for (let ring = 1; ring >= .5; ring -= .5) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.drawImage(sil, x + Math.cos(a) * r * ring, y + Math.sin(a) * r * ring); }
  g.drawImage(sil, x, y);
}

// art canvas → card canvas with off-white border, grey card edge (thickness, offset down) and grain.
// returns {c, pad}: the card is art translated by pad.
export function finish(art, { border = 9, edge = 4, grainA = .10, borderColor = BORDER } = {}) {
  const pad = Math.ceil(border + edge + 2), c = mk(art.width + pad * 2, art.height + pad * 2), g = c.getContext('2d');
  dilate(g, silhouette(art, EDGE), pad, pad + edge, border);
  dilate(g, silhouette(art, borderColor), pad, pad, border);
  g.drawImage(art, pad, pad);
  // grain, masked to the card, blended in
  const gr = mk(c.width, c.height), gg = gr.getContext('2d');
  gg.fillStyle = gg.createPattern(grain(), 'repeat'); gg.fillRect(0, 0, c.width, c.height);
  gg.globalCompositeOperation = 'destination-in'; gg.drawImage(c, 0, 0);
  g.globalAlpha = grainA; g.globalCompositeOperation = 'overlay'; g.drawImage(gr, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { c, pad };
}

// soft shadow version of a card (black silhouette, blurred)
export function shadowOf(card, blur = 6) {
  const p = blur * 2, c = mk(card.width + p * 2, card.height + p * 2), g = c.getContext('2d');
  g.filter = `blur(${blur}px)`; g.drawImage(silhouette(card, '#2a1d14'), p, p); g.filter = 'none';
  return { c, p };
}

// wobbly path helpers
export function blob(g, cx, cy, rx, ry, seed = 1, wob = .04, n = 28) {
  const r = mulberry(seed); const ph = [r() * 6, r() * 6, r() * 6];
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, k = 1 + wob * (Math.sin(a * 2 + ph[0]) * .6 + Math.sin(a * 3 + ph[1]) * .3 + Math.sin(a * 5 + ph[2]) * .2);
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
export function fillStroke(g, fill, lw = 5, stroke = INK) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
// one hard crescent of shade inside the current shape: fill shade, refill base shifted
export function crescent(g, pathFn, base, shade, dx, dy) {
  g.save(); pathFn(); g.clip(); pathFn(); g.fillStyle = shade; g.fill();
  g.translate(dx, dy); pathFn(); g.fillStyle = base; g.fill(); g.restore();
}
export function limb(g, pts, w, fill, lw = 5) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
  g.strokeStyle = INK; g.lineWidth = w + lw * 2; g.stroke();
  g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
// 2-bone IK: shoulder s, target t, lengths a b, bend sign → elbow point
export function ik(s, t, a, b, bend) {
  let dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy); const dd = Math.min(Math.max(d, Math.abs(a - b) + 1), a + b - .5);
  const ang = Math.atan2(dy, dx), cosA = (a * a + dd * dd - b * b) / (2 * a * dd), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const e = [s[0] + Math.cos(ang + bend * A) * a, s[1] + Math.sin(ang + bend * A) * a];
  const h = [s[0] + Math.cos(ang) * dd, s[1] + Math.sin(ang) * dd];
  return { e, h: d > dd ? h : t };
}
