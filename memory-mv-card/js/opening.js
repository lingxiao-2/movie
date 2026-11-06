// 一周年纪念贺卡开场 — rigid 2.5D paper animation over the user's approved artwork (no warping).
// Plates are 4264×2400 (= original 1672×941 × K). Camera = (cx, cy, vw) in original px.
import { seg, ss, eio, eo, ei, back, clamp, lerp, mulberry } from '/core/lib.js';
export const DUR = 8.5;
const K = 2400 / 941; let W, H, G, OFF, OG; const I = {};
const im = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + s)); i.src = s; });
export async function load(w, h, g) {
  W = w; H = h; G = g; OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; OG = OFF.getContext('2d');
  const L = { base: 'layers/cover_base.png', ribL: 'layers/rib_L.png', ribB: 'layers/rib_B.png', ribR: 'layers/rib_R.png', seal: 'layers/seal.png',
    page: 'layers/inner_page.png', couple: 'layers/pop_couple.png', cats: 'layers/pop_cats.png', bike: 'layers/pop_bike.png', plaque: 'layers/pop_plaque.png',
    phones: 'up/phones.png', act1: 'assets/up/act1.png' };
  await Promise.all(Object.entries(L).map(async ([k, s]) => { I[k] = await im(s); }));
}
// camera: plate px → screen
function cam(g, cx, cy, vw) { vw = Math.min(vw, 1672); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2); const s = W / (vw * K); g.setTransform(s, 0, 0, s, -(cx - vw / 2) * K * s, -(cy - vh / 2) * K * s); return { cx, cy, vw, s }; }
const P = (x, y) => [x * K, y * K];
function piece(g, img, { dx = 0, dy = 0, rot = 0, sc = 1, px = 0, py = 0, alpha = 1 } = {}) {
  if (alpha <= 0) return; g.save(); g.globalAlpha = alpha; const [X, Y] = P(px, py);
  g.translate(X + dx * K, Y + dy * K); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.translate(-X, -Y); g.drawImage(img, 0, 0); g.restore();
}
// --------------------------------------------------------- the card lid (rigid quad rotating about its left edge, with perspective)
const TL = [97, 100], BL = [150, 893], TR = [1545, 22], BR = [1640, 800];
function tri(g, img, s0, s1, s2, d0, d1, d2) {
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const mx = (d0[0] + d1[0] + d2[0]) / 3, my = (d0[1] + d1[1] + d2[1]) / 3, gr = q => { const ex = q[0] - mx, ey = q[1] - my, l = Math.hypot(ex, ey) || 1; return [q[0] + ex / l * 2, q[1] + ey / l * 2]; };
  const q0 = gr(d0), q1 = gr(d1), q2 = gr(d2);
  g.save(); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.lineTo(...q2); g.closePath(); g.clip();
  if (img) { g.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]); g.drawImage(img, 0, 0); } else g.fill();
  g.restore();
}
function lid(g, th, view) {
  const ax = [BL[0] - TL[0], BL[1] - TL[1]], al = Math.hypot(...ax), u = [ax[0] / al, ax[1] / al], n = [-u[1], u[0]];   // n points right
  const C = [view.cx, view.cy], F = 2600, ct = Math.cos(th), st = Math.sin(th);
  const proj = p => { const rel = [p[0] - TL[0], p[1] - TL[1]], along = rel[0] * u[0] + rel[1] * u[1], d = rel[0] * n[0] + rel[1] * n[1];
    const x = TL[0] + u[0] * along + n[0] * d * ct, y = TL[1] + u[1] * along + n[1] * d * ct, z = d * st, f = F / (F - z); return [(C[0] + (x - C[0]) * f) * K, (C[1] + (y - C[1]) * f) * K]; };
  const N = 36, front = ct > -0.02, shade = front ? .78 + .22 * ct : .9 - .25 * Math.abs(ct);
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N, a0 = [lerp(TL[0], TR[0], u0), lerp(TL[1], TR[1], u0)], a1 = [lerp(TL[0], TR[0], u1), lerp(TL[1], TR[1], u1)];
    const b0 = [lerp(BL[0], BR[0], u0), lerp(BL[1], BR[1], u0)], b1 = [lerp(BL[0], BR[0], u1), lerp(BL[1], BR[1], u1)];
    const A0 = proj(a0), A1 = proj(a1), B0 = proj(b0), B1 = proj(b1);
    if (front) { const S = q => [q[0] * K, q[1] * K]; tri(g, I.base, S(a0), S(a1), S(b0), A0, A1, B0); tri(g, I.base, S(a1), S(b1), S(b0), A1, B1, B0); }
    else { g.fillStyle = '#f6ebe2'; tri(g, null, 0, 0, 0, A0, A1, B0); tri(g, null, 0, 0, 0, A1, B1, B0); }
  }
  // lighting on the moving card + its paper-thickness edge
  const pts = [proj(TL), proj(TR), proj(BR), proj(BL)];
  g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath();
  g.fillStyle = `rgba(60,25,45,${(1 - shade) * .9})`; g.fill();
  g.strokeStyle = 'rgba(255,248,240,.9)'; g.lineWidth = 7 * K / 2.55; g.stroke(); g.restore();
  return pts;
}
// --------------------------------------------------------- pop-up stands: rigid cards hinging up from their base line
// [layer, base line y, right edge x]: each stand rises as the opening cover sweeps past it (right → left)
const POPS = [['bike', 691, 1515], ['couple', 512, 1015], ['plaque', 887, 1205], ['cats', 651, 568]];
const OPEN = [2.28, 3.75], thAt = t => Math.PI * .86 * eio(seg(t, OPEN[0], OPEN[1]));
const edgeX = t => TL[0] + (TR[0] - TL[0]) * Math.cos(Math.min(thAt(t), Math.PI / 2));
const START = {}; for (const [k, , rx] of POPS) { let t = OPEN[0]; while (t < OPEN[1] && edgeX(t) > rx - 60) t += 1 / 96; START[k] = t - .05; }
function pops(g, t) {
  for (const [k, by] of POPS) {
    const t0 = START[k], h = t < t0 ? .06 : lerp(.06, 1, back(seg(t, t0, t0 + .34), 1.7)), Y = by * K;
    g.save(); g.translate(0, Y); g.scale(1, h); g.translate(0, -Y);
    g.shadowColor = `rgba(90,35,55,${.35 * h})`; g.shadowBlur = 28 * K / 2.55; g.shadowOffsetY = 10 * h * K / 2.55; g.drawImage(I[k], 0, 0); g.restore();
  }
}
// --------------------------------------------------------- light
function glint(g, img, t, t0, dur = .55) {          // a soft light band sweeping across one layer (clipped to it)
  const u = (t - t0) / dur; if (u < 0 || u > 1) return;
  OG.setTransform(g.getTransform()); OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.restore();
  OG.globalCompositeOperation = 'source-over'; OG.drawImage(img, 0, 0); OG.globalCompositeOperation = 'source-in';
  const x = lerp(-400, 4600, u), gr = OG.createLinearGradient(x - 260, 0, x + 260, 600); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,250,235,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  OG.fillStyle = gr; OG.fillRect(0, 0, 4264, 2400); OG.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen'; g.drawImage(OFF, 0, 0); g.restore();
}
function star(g, x, y, r, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a; g.translate(x, y);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); gr.addColorStop(0, 'rgba(255,248,225,.9)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
  g.fillStyle = '#fffbe9'; g.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * .18 : r; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.restore(); }
function dust(g, t, k) { const R = mulberry(9); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 46; i++) { const z = R(), x = (R() * W + t * (10 + z * 30)) % W, y = (R() * H - t * (14 + z * 26) + H) % H, a = k * (.25 + .5 * Math.max(0, Math.sin(t * (1.5 + R() * 2) + i))) * z;
    const r = 2 + z * 5, gr = g.createRadialGradient(x, y, 0, x, y, r * 3); gr.addColorStop(0, `rgba(255,228,180,${a})`); gr.addColorStop(1, 'rgba(255,228,180,0)'); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); } g.restore(); }
function finish(g, warm) { g.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = warm; g.fillStyle = '#ffc49a'; g.fillRect(0, 0, W, H); g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(40,15,35,0)'); v.addColorStop(1, 'rgba(40,15,35,.3)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
// watercolour bloom between two full-frame scenes (soft blobs from the corners), as in the MV
let MK; function bloom(u, seed) { if (!MK) { MK = document.createElement('canvas'); MK.width = W; MK.height = H; } const m = MK.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H); const R = mulberry(seed); m.fillStyle = '#000'; const e = eio(u);
  [[.02, .05], [.98, .08], [.03, .95], [.97, .93], [.5, 1.02]].forEach(([cx, cy], i) => { const d = R() * .15, r = Math.max(0, (e - d) / (1 - d)) * Math.hypot(W, H) * (.8 + R() * .25); if (r <= 0) return; m.beginPath();
    for (let k = 0; k <= 40; k++) { const an = k / 40 * Math.PI * 2, rr = r * (1 + .12 * Math.sin(an * 5 + i * 2 + seed) + .07 * Math.sin(an * 11 + i)); m.lineTo(W * cx + Math.cos(an) * rr, H * cy + Math.sin(an) * rr); } m.closePath(); m.fill(); }); return MK; }
// --------------------------------------------------------- scenes
function cardScene(g, t) {           // cover → untie → open → pop-up → push in
  const push = eio(seg(t, 0, 2.2)), dive = eio(seg(t, 4.35, 5.6));
  const view = cam(g, lerp(lerp(836, 820, push), 790, dive), lerp(470, 330, dive), lerp(lerp(1672, 1540, push), 640, dive));
  const th = thAt(t), opening = t >= 2.28;
  if (opening) {                      // inner page under the lid
    g.drawImage(I.page, 0, 0); pops(g, t);
    // shadow cast by the lifting lid
    const sh = Math.sin(Math.min(th, Math.PI / 2)) * (1 - seg(t, 3.5, 3.9)); if (sh > 0) { const gr = g.createLinearGradient(TL[0] * K, 0, TR[0] * K, 0); gr.addColorStop(0, `rgba(70,25,45,${.45 * sh})`); gr.addColorStop(1, 'rgba(70,25,45,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4264, 2400); }
    // the cover's surroundings (sparkle bg + envelope) dissolve into the inner page's own background
    const ring = 1 - ss(seg(t, 2.6, 3.3));
    if (ring > 0) { g.save(); g.globalAlpha = ring; g.beginPath(); g.rect(0, 0, 4264, 2400); [TL, TR, BR, BL].forEach((p, i) => i ? g.lineTo(p[0] * K, p[1] * K) : g.moveTo(p[0] * K, p[1] * K)); g.closePath(); g.clip('evenodd'); g.drawImage(I.base, 0, 0); g.restore(); }
    if (t < 3.9) { const a = 1 - seg(t, 3.55, 3.9); g.save(); g.globalAlpha = a; lid(g, th, view); g.restore(); }
  } else {
    g.drawImage(I.base, 0, 0);
    // untie: the bow and its long ribbon lift away up-left, the side tail slides off, the seal pops and floats, the lower bow drops
    const uL = seg(t, 1.0, 1.95), antL = Math.sin(Math.PI * seg(t, .98, 1.18)) * .25;
    piece(g, I.ribL, { dx: antL * 18 - 900 * ei(uL), dy: -520 * ei(uL), rot: -16 * ei(uL), px: 300, py: 170, alpha: 1 - seg(t, 1.75, 1.95) });
    const uR = seg(t, 1.25, 1.85); piece(g, I.ribR, { dx: 520 * ei(uR), dy: 40 * ei(uR), rot: 8 * ei(uR), px: 1540, py: 610, alpha: 1 - seg(t, 1.7, 1.85) });
    const uB = seg(t, 1.6, 2.25); piece(g, I.ribB, { dy: 620 * ei(uB), rot: 5 * ei(uB), px: 895, py: 700, alpha: 1 - seg(t, 2.05, 2.25) });
    const pop = back(seg(t, 1.42, 1.62), 2.6) - 1, uS = seg(t, 1.6, 2.2);
    piece(g, I.seal, { dy: -40 * pop - 640 * eo(uS), dx: 120 * eo(uS), rot: 28 * eo(uS), sc: 1 + .14 * Math.max(0, pop) + .1 * Math.sin(Math.PI * seg(t, 1.42, 1.62)), px: 890, py: 710, alpha: 1 - seg(t, 1.95, 2.2) });
    glint(g, I.ribL, t, .25, .6); glint(g, I.seal, t, .7, .45);
  }
  // sparkles on the metal charm, the bow knot and the seal (cover) and the plaque (inner)
  g.setTransform(1, 0, 0, 1, 0, 0); const sp = (x, y) => [(x - (view.cx - view.vw / 2)) / view.vw * W, (y - (view.cy - view.vw * 9 / 32)) / (view.vw * 9 / 16) * H];
  if (!opening) { star(g, ...sp(370, 255), 26, Math.sin(Math.PI * seg(t, .45, .95))); star(g, ...sp(430, 430), 18, Math.sin(Math.PI * seg(t, .6, 1.05))); star(g, ...sp(915, 655), 22, Math.sin(Math.PI * seg(t, .8, 1.25))); }
  else { star(g, ...sp(1000, 600), 24, Math.sin(Math.PI * seg(t, 4.0, 4.5))); star(g, ...sp(660, 610), 16, Math.sin(Math.PI * seg(t, 4.2, 4.7))); }
  dust(g, t, 1); finish(g, .12);
  if (t < .45) { g.fillStyle = `rgba(20,10,22,${1 - ss(t / .45)})`; g.fillRect(0, 0, W, H); }
}
function fullScene(g, img, t, t0, t1, k0, k1) { const u = eio(seg(t, t0, t1)); cam(g, lerp(k0[0], k1[0], u), lerp(k0[1], k1[1], u), lerp(k0[2], k1[2], u)); g.drawImage(img, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); }
function phonesScene(g, t) { fullScene(g, I.phones, t, 5.2, 7.4, [836, 470, 1500], [836, 470, 1672]); dust(g, t, .7); finish(g, .06); }
function act1Scene(g, t) { fullScene(g, I.act1, t, 6.7, 8.5, [836, 470, 1672], [836, 476, 1560]); finish(g, 0); }
export function frame(t) {
  if (t === 0) console.log('pop starts', JSON.stringify(START));
  const g = G; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const ph = (g2, a, b, prev, next, uIn) => { };
  if (t < 5.27) cardScene(g, t);
  else if (t < 6.95) phonesScene(g, t);
  else act1Scene(g, t);
  // watercolour blooms: card → phones (5.27–6.1), phones → act 1 (6.95–7.8)
  for (const [a, dur, prev, seed] of [[5.27, .85, cardScene, 3], [6.95, .85, phonesScene, 9]]) {
    const u = (t - a) / dur; if (u < 0 || u >= 1) continue;
    OG.setTransform(1, 0, 0, 1, 0, 0); OG.globalCompositeOperation = 'source-over'; OG.clearRect(0, 0, W, H); prev(OG, t);
    OG.setTransform(1, 0, 0, 1, 0, 0); OG.globalCompositeOperation = 'destination-out'; OG.filter = 'blur(40px)'; OG.drawImage(bloom(u, seed), 0, 0); OG.filter = 'none'; OG.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(OFF, 0, 0);
  }
}
