// A small 2.5D pop-up book engine in Canvas 2D: a pinhole camera, a desk, an open book (upright backdrop board
// + ground page), cut-paper cards that fold up about their base, cut-out shadows and a curling page leaf.
// World units: cm. X right, Y up, Z into the book. Ground page: X −20…20, Z 0…30. Gutter at Z = 30.
import { mk, grain, shadowOf } from './paper.js';
import { mulberry } from '/core/lib.js';

export const PW = 34, PD = 30, PH = 32;          // page half-width, depth, backdrop height
export let W = 1080, H = 1920;
export function setSize(w, h) { W = w; H = h; }

export const cam = { tx: 0, ty: 8, tz: 14, d: 60, pitch: 32, yaw: 0, f: 1750, roll: 0 };
let C = null, cp, sp, cy_, sy_;
export function setCam(c) {
  Object.assign(cam, c);
  const p = cam.pitch * Math.PI / 180, y = cam.yaw * Math.PI / 180;
  cp = Math.cos(p); sp = Math.sin(p); cy_ = Math.cos(y); sy_ = Math.sin(y);
  const fx = sy_ * cp, fy = -sp, fz = cy_ * cp;
  C = [cam.tx - fx * cam.d, cam.ty - fy * cam.d, cam.tz - fz * cam.d];
}
export function proj(X, Y, Z) {
  const dx = X - C[0], dy = Y - C[1], dz = Z - C[2];
  const x1 = dx * cy_ - dz * sy_, z1 = dx * sy_ + dz * cy_;
  const zc = -dy * sp + z1 * cp, yc = dy * cp + z1 * sp;
  const k = cam.f / Math.max(zc, .5);
  return [W / 2 + x1 * k, H / 2 - yc * k, zc, k];
}

// image src rect → parallelogram (p0 = image top-left, p1 = top-right, p2 = bottom-left)
export function mapImage(g, img, sx, sy, sw, sh, p0, p1, p2) {
  const a = (p1[0] - p0[0]) / sw, b = (p1[1] - p0[1]) / sw, c = (p2[0] - p0[0]) / sh, d = (p2[1] - p0[1]) / sh;
  if (!isFinite(a + b + c + d)) return;
  g.save(); g.transform(a, b, c, d, p0[0] - a * sx - c * sy, p0[1] - b * sx - d * sy);
  g.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh); g.restore();
}
// exact affine map of one triangle: image points s0 s1 s2 → screen points d0 d1 d2 (clip grown by ~0.7 px)
export function tri(g, img, s0, s1, s2, d0, d1, d2, bx, by, bw, bh) {
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den;
  const c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den;
  const d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  if (!isFinite(a + b + c + d)) return;
  const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, grow = q => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1; return [q[0] + dx / l * 1.1, q[1] + dy / l * 1.1]; };
  const q0 = grow(d0), q1 = grow(d1), q2 = grow(d2);
  g.save(); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.lineTo(q2[0], q2[1]); g.closePath(); g.clip();
  g.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]);
  g.drawImage(img, bx, by, bw, bh, bx, by, bw, bh); g.restore();
}
// image rect (sx, sy, sw, sh) → screen quad P0 (top-left), P1 (top-right), P2 (bottom-left), P3 (bottom-right)
export function quadImage(g, img, sx, sy, sw, sh, P0, P1, P2, P3) {
  const A = [sx, sy], B = [sx + sw, sy], Cc = [sx, sy + sh], D = [sx + sw, sy + sh];
  const bx = Math.max(0, Math.floor(sx)), by = Math.max(0, Math.floor(sy)), bw = Math.min(img.width - bx, Math.ceil(sw) + 1), bh = Math.min(img.height - by, Math.ceil(sh) + 1);
  tri(g, img, A, B, Cc, P0, P1, P2, bx, by, bw, bh); tri(g, img, B, D, Cc, P1, P3, P2, bx, by, bw, bh);
}
// a world quad given by a function (u, v ∈ 0..1) → world point, drawn from an image in strips along v
export function drawSurface(g, img, fn, strips = 20, cols = 1) {
  const iw = img.width, ih = img.height;
  for (let i = 0; i < strips; i++) for (let j = 0; j < cols; j++) {
    const v0 = i / strips, v1 = (i + 1) / strips, u0 = j / cols, u1 = (j + 1) / cols;
    const p0 = proj(...fn(u0, v0)), p1 = proj(...fn(u1, v0)), p2 = proj(...fn(u0, v1)), p3 = proj(...fn(u1, v1));
    if (Math.min(p0[2], p1[2], p2[2], p3[2]) < 2) continue;
    quadImage(g, img, u0 * iw, v0 * ih, (u1 - u0) * iw, (v1 - v0) * ih, p0, p1, p2, p3);
  }
}
export function poly(g, pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); }

// ---------------- the real world: desk + room ----------------
let DESK = null;
function deskTex() {
  if (DESK) return DESK;
  const c = mk(1024, 1024), g = c.getContext('2d'), r = mulberry(5);
  for (let i = 0; i < 8; i++) {
    const x = i * 128, base = [148 + r() * 20, 98 + r() * 14, 62 + r() * 10];
    g.fillStyle = `rgb(${base.map(Math.round)})`; g.fillRect(x, 0, 128, 1024);
    for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(${r() < .5 ? '70,40,20' : '200,150,100'},${.05 + r() * .12})`; g.lineWidth = 1 + r() * 3; g.beginPath(); const xx = x + r() * 128; g.moveTo(xx, 0); for (let y = 0; y <= 1024; y += 64) g.lineTo(xx + Math.sin(y * .01 + k) * 6 * r(), y); g.stroke(); }
    if (r() < .6) { const ky = r() * 1024, kx = x + 30 + r() * 60; g.strokeStyle = 'rgba(80,45,22,.25)'; g.lineWidth = 2; for (let q = 1; q < 5; q++) { g.beginPath(); g.ellipse(kx, ky, q * 5, q * 14, 0, 0, 7); g.stroke(); } }
    g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(x, 0, 3, 1024);
  }
  DESK = c; return c;
}
export function drawRoom(g, warm = .5) {
  // wall behind (soft, out of focus)
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, `rgb(${Math.round(200 + warm * 30)},${Math.round(196 + warm * 14)},${Math.round(190 - warm * 20)})`);
  gr.addColorStop(1, `rgb(${Math.round(120 + warm * 30)},${Math.round(100 + warm * 14)},${Math.round(84)})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // desk plane at Y = −2.2
  drawSurface(g, deskTex(), (u, v) => [-120 + u * 240, -2.2, -40 + (1 - v) * 220], 44, 8);
  // window light pooled on the desk
  const p = proj(-30, -2.2, 10), lg = g.createRadialGradient(p[0], p[1], 10, p[0], p[1], 1100);
  lg.addColorStop(0, `rgba(255,236,200,${.32 + warm * .1})`); lg.addColorStop(1, 'rgba(255,236,200,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
}

// ---------------- the book ----------------
const COVER = '#8d3b3b', COVER_D = '#5e2424';
export function drawBookBase(g, standing = true, coverCol = COVER) {
  // cover boards (cloth): ground board and backdrop board
  const cb = [proj(-PW - 2, -1.6, -1.6), proj(PW + 2, -1.6, -1.6), proj(PW + 2, -1.6, PD + .6), proj(-PW - 2, -1.6, PD + .6)];
  g.fillStyle = 'rgba(40,20,10,.35)'; poly(g, [proj(-PW - 2.5, -2.2, -2.4), proj(PW + 3.5, -2.2, -2.4), proj(PW + 4, -2.2, PD + 2), proj(-PW - 2, -2.2, PD + 2)]); g.fill(); // contact shadow
  poly(g, cb); g.fillStyle = coverCol; g.fill();
  // cover thickness front edge
  poly(g, [proj(-PW - 2, -1.6, -1.6), proj(PW + 2, -1.6, -1.6), proj(PW + 2, -2.2, -1.6), proj(-PW - 2, -2.2, -1.6)]); g.fillStyle = COVER_D; g.fill();
  // page block: front edge lines
  const top = 0, bot = -1.5;
  poly(g, [proj(-PW, top, 0), proj(PW, top, 0), proj(PW, bot, 0), proj(-PW, bot, 0)]); g.fillStyle = '#efe5d0'; g.fill();
  g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { const y = top + (bot - top) * i / 6; const a = proj(-PW, y, 0), b = proj(PW, y, 0); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // side edges
  poly(g, [proj(PW, top, 0), proj(PW, top, PD), proj(PW, bot, PD), proj(PW, bot, 0)]); g.fillStyle = '#e2d6bd'; g.fill();
  poly(g, [proj(-PW, top, 0), proj(-PW, top, PD), proj(-PW, bot, PD), proj(-PW, bot, 0)]); g.fillStyle = '#e2d6bd'; g.fill();
  if (!standing) return;
  // backdrop cover board
  poly(g, [proj(-PW - 2, -1.6, PD + .6), proj(PW + 2, -1.6, PD + .6), proj(PW + 2, PH + 1.6, PD + .9), proj(-PW - 2, PH + 1.6, PD + .9)]); g.fillStyle = coverCol; g.fill();
  poly(g, [proj(-PW, 0, PD + .3), proj(PW, 0, PD + .3), proj(PW, PH, PD + .45), proj(-PW, PH, PD + .45)]); g.fillStyle = '#e8dcc4'; g.fill();
}
// paper ground and backdrop from art canvases
export function drawBackdrop(g, art, blurPx = 0) {
  const b = blurred(art, blurPx); if (b !== art) { const c = mk(art.width, art.height); c.getContext('2d').drawImage(b.c, -b.p, -b.p); art = c; }
  mapImage(g, art, 0, 0, art.width, art.height, proj(-PW, PH, PD), proj(PW, PH, PD), proj(-PW, 0, PD));
}
export function drawGround(g, art) {
  drawSurface(g, art, (u, v) => [-PW + u * 2 * PW, 0, PD - v * PD], 24, 3);
  // gutter shade and front-edge light
  const a = proj(0, 0, PD), b = proj(0, 0, PD - 4);
  const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, 'rgba(60,40,20,.28)'); gr.addColorStop(1, 'rgba(60,40,20,0)');
  g.fillStyle = gr; poly(g, [proj(-PW, 0, PD), proj(PW, 0, PD), proj(PW, 0, PD - 4), proj(-PW, 0, PD - 4)]); g.fill();
  const c = proj(0, 0, PD), d = proj(0, 3, PD);
  const gr2 = g.createLinearGradient(c[0], c[1], d[0], d[1]); gr2.addColorStop(0, 'rgba(60,40,20,.25)'); gr2.addColorStop(1, 'rgba(60,40,20,0)');
  g.fillStyle = gr2; poly(g, [proj(-PW, 0, PD), proj(PW, 0, PD), proj(PW, 3, PD), proj(-PW, 3, PD)]); g.fill();
}

// ---------------- depth of field ----------------
const BLUR = new WeakMap();
export function blurred(img, px) {
  if (px < .6) return img; const lv = px < 1.5 ? 1 : px < 3 ? 2 : px < 5 ? 4 : px < 8 ? 6 : 9;
  let m = BLUR.get(img); if (!m) { m = {}; BLUR.set(img, m); }
  if (!m[lv]) { const p = lv * 2, c = mk(img.width + p * 2, img.height + p * 2), g = c.getContext('2d'); g.filter = `blur(${lv}px)`; g.drawImage(img, p, p); m[lv] = { c, p }; }
  return m[lv];
}
export const dof = { focus: 40, ap: 0 };   // blur px = ap × |zc − focus| / zc
export const blurAt = zc => dof.ap * Math.abs(zc - dof.focus) / Math.max(zc, 1);

// ---------------- cards ----------------
// card = { img: {c, pad}, X, Z, h (world height of the whole canvas), a (fold angle, deg; 90 = upright),
//          dir (+1 lies back / −1 lies toward reader), y0 (lift), rot (in-plane, rad), flip, alpha, shadow, sx (x squash) }
const SH = new WeakMap();
function corners(cd) {
  const { c } = cd.img, h = cd.h, w = h * c.width / c.height * (cd.sx ?? 1);
  const a = (cd.a ?? 90) * Math.PI / 180, dir = cd.dir ?? 1, r = cd.rot || 0;
  const u = [0, Math.sin(a), dir * Math.cos(a)], ex = [1, 0, 0];
  const e1 = ex.map((v, i) => v * Math.cos(r) + u[i] * Math.sin(r)), e2 = ex.map((v, i) => -v * Math.sin(r) + u[i] * Math.cos(r));
  const B = [cd.X, cd.y0 || 0, cd.Z];
  const BL = B.map((v, i) => v - e1[i] * w / 2), BR = B.map((v, i) => v + e1[i] * w / 2), TL = BL.map((v, i) => v + e2[i] * h), TR = BR.map((v, i) => v + e2[i] * h);
  return { BL, BR, TL, TR, w, h, a };
}
export function drawShadow(g, cd) {
  if (cd.shadow === false || (cd.alpha ?? 1) < .05) return;
  const { BL, BR, h, a } = corners(cd), lift = cd.y0 || 0;
  const s = Math.sin(a) * (cd.shadowLen ?? 1);
  if (s < .05) return;
  let sh = SH.get(cd.img); if (!sh) { sh = shadowOf(cd.img.c, 7); SH.set(cd.img, sh); }
  const off = [h * .32 * s + lift * .5, 0, h * .42 * s + lift * .6];
  const gBL = [BL[0] + lift * .4, 0, BL[2] + lift * .5], gBR = [BR[0] + lift * .4, 0, BR[2] + lift * .5];
  const l = cd.flip ? gBR : gBL, rr = cd.flip ? gBL : gBR;
  const TLs = [l[0] + off[0], 0, l[2] + off[2]], TRs = [rr[0] + off[0], 0, rr[2] + off[2]];
  const p0 = proj(...TLs), p1 = proj(...TRs), p2 = proj(...l);
  const k = sh.p / sh.c.width;
  g.save(); g.globalAlpha = .3 * (cd.alpha ?? 1) * (cd.shadowA ?? 1) * Math.max(0, 1 - lift / 25);
  // shadow canvas has padding p: expand the parallelogram accordingly
  const ux = [(p1[0] - p0[0]), (p1[1] - p0[1])], vy = [(p2[0] - p0[0]), (p2[1] - p0[1])];
  const kx = sh.p / cd.img.c.width, ky = sh.p / cd.img.c.height;
  const q0 = [p0[0] - ux[0] * kx - vy[0] * ky, p0[1] - ux[1] * kx - vy[1] * ky];
  const q1 = [q0[0] + ux[0] * (1 + 2 * kx), q0[1] + ux[1] * (1 + 2 * kx)], q2 = [q0[0] + vy[0] * (1 + 2 * ky), q0[1] + vy[1] * (1 + 2 * ky)];
  mapImage(g, sh.c, 0, 0, sh.c.width, sh.c.height, q0, q1, q2);
  g.restore();
}
export function drawCard(g, cd) {
  if ((cd.alpha ?? 1) < .01) return;
  const { BL, BR, TL, TR } = corners(cd), img = cd.img.c;
  const tl = proj(...(cd.flip ? TR : TL)), tr = proj(...(cd.flip ? TL : TR)), bl = proj(...(cd.flip ? BR : BL));
  g.save(); g.globalAlpha = cd.alpha ?? 1;
  if (cd.filter) g.filter = cd.filter;
  const bz = blurAt(proj(cd.X, (cd.y0 || 0) + cd.h * .4, cd.Z)[2]) * (cd.dofK ?? 1);
  const pxScale = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]) / img.width, b = blurred(img, bz / Math.max(pxScale, .05));
  if (b === img) mapImage(g, img, 0, 0, img.width, img.height, tl, tr, bl);
  else { // the blurred copy has padding p: grow the parallelogram to match
    const ux = [(tr[0] - tl[0]) / img.width, (tr[1] - tl[1]) / img.width], vy = [(bl[0] - tl[0]) / img.height, (bl[1] - tl[1]) / img.height], p = b.p;
    const q0 = [tl[0] - ux[0] * p - vy[0] * p, tl[1] - ux[1] * p - vy[1] * p];
    mapImage(g, b.c, 0, 0, b.c.width, b.c.height, q0, [q0[0] + ux[0] * b.c.width, q0[1] + ux[1] * b.c.width], [q0[0] + vy[0] * b.c.height, q0[1] + vy[1] * b.c.height]);
  }
  g.restore();
}
export function depth(cd) { const p = proj(cd.X, (cd.y0 || 0), cd.Z); return p[2]; }
export function drawCards(g, cards) {
  const list = cards.filter(Boolean);
  for (const c of list) if (!c.y0 || c.y0 < 3) drawShadow(g, c);
  list.sort((a, b) => (b.layer ?? 0) - (a.layer ?? 0) || depth(b) - depth(a));
  for (const c of list) { if (c.y0 >= 3 && c.shadow !== false) drawShadow(g, c); drawCard(g, c); }
}

// ---------------- the page leaf ----------------
// θ: 0 = lying on the ground page, 90 = standing against the backdrop. front: colour of the old ground side,
// backArt: the new backdrop (shown on the side that faces the camera once the leaf passes vertical)
export function drawLeaf(g, theta, frontCol, backArt, n = 22) {
  if (theta >= 89.6) return; theta = Math.max(theta, .4);
  const L = PD, th = theta * Math.PI / 180, curl = -.9 * Math.sin(th * 2) ;
  const pts = []; let y = 0, z = PD;
  pts.push([0, y, z]);
  for (let i = 1; i <= n; i++) { const u = i / n, ph = th + curl * Math.pow(u, 1.6) * .9; y += Math.sin(ph) * L / n; z -= Math.cos(ph) * L / n; pts.push([0, y, z]); }
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1];
    const A = proj(-PW, a[1], a[2]), B = proj(PW, a[1], a[2]), Cc = proj(PW, b[1], b[2]), D = proj(-PW, b[1], b[2]);
    const cross = (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0]);
    const ph = Math.atan2(b[1] - a[1], -(b[2] - a[2]));
    const lit = .78 + .22 * Math.sin(ph + .6);
    if (cross > 0) { // front (old ground) faces the camera
      if (typeof frontCol === 'string') { poly(g, [A, B, Cc, D]); g.fillStyle = frontCol; g.fill(); }
      else { const ih = frontCol.height; quadImage(g, frontCol, 0, i / n * ih, frontCol.width, ih / n, A, B, D, Cc); poly(g, [A, B, Cc, D]); }
      g.fillStyle = `rgba(60,40,20,${(1 - lit) * .9})`; g.fill();
    } else {
      const ih = backArt.height, v0 = 1 - i / n, v1 = 1 - (i + 1) / n;
      quadImage(g, backArt, 0, v1 * ih, backArt.width, (v0 - v1) * ih, D, Cc, A, B);
      poly(g, [A, B, Cc, D]); g.fillStyle = `rgba(60,40,20,${(1 - lit) * .7})`; g.fill();
    }
  }
  // thin paper edge highlight
  const e = pts[n], P1 = proj(-PW, e[1], e[2]), P2 = proj(PW, e[1], e[2]);
  g.strokeStyle = 'rgba(255,252,240,.9)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(P1[0], P1[1]); g.lineTo(P2[0], P2[1]); g.stroke();
}

// ---------------- screen-space finishing ----------------
let VIG = null;
export function finishFrame(g, warm, cool) {
  // colour grade: cool grey-blue early, warm gold later
  if (cool > 0) { g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = cool * .22; g.fillStyle = '#7f93b0'; g.fillRect(0, 0, W, H); g.restore(); }
  if (warm > 0) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = warm * .35; g.fillStyle = '#ffb26b'; g.fillRect(0, 0, W, H); g.restore(); }
  if (!VIG) {
    VIG = mk(W, H); const v = VIG.getContext('2d'), gr = v.createRadialGradient(W / 2, H * .46, H * .25, W / 2, H * .5, H * .78);
    gr.addColorStop(0, 'rgba(30,18,10,0)'); gr.addColorStop(1, 'rgba(30,18,10,.42)'); v.fillStyle = gr; v.fillRect(0, 0, W, H);
  }
  g.drawImage(VIG, 0, 0);
  g.save(); g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(grain(), 'repeat'); g.fillRect(0, 0, W, H); g.restore();
}
