// 《把回忆拼好给你》DJ 版 — final film. Animates the user's eight illustrations:
// keyframed camera in each plate, fg/bg parallax (matted characters over an inpainted plate), breathing,
// eyelid blinks, wind on hair and sea, particles and light, beat-cut transitions, lyrics and story captions.
// All positions are in ORIGINAL image pixels (1672 × 941; act7/8 = the two halves of the strip).
import { seg, ss, eio, eo, ei, clamp, lerp, back, mulberry, hash } from '/core/lib.js';

export const DUR = 59.04;
let W, H, G, OFF, OG;
const IMG = {};

// ---------------------------------------------------------------- scenes (plates)
// k = plate px per original px; oy = original y of the plate's top (act8 is the lower half of the strip)
const SC = {
  act1: { k: 2400 / 941, layered: 1 }, act2: { k: 2400 / 941, layered: 1 }, act3: { k: 2400 / 941, layered: 1 },
  act4: { k: 2400 / 941, layered: 1 }, act5: { k: 2400 / 941, layered: 1 }, act6: { k: 2400 / 941, layered: 0 },
  act7: { k: 4, layered: 1, oy: 0 }, act8: { k: 4, layered: 1, oy: 506 },
};
// wind regions on the fg layer (original coords, relative to the plate's own origin): hair that sways
const WIND = {
  act4: [{ x0: 1000, y0: 330, x1: 1300, y1: 941, amp: 2.2, f: .55, ph: 0 }],
  act7: [{ x0: 920, y0: 250, x1: 1110, y1: 480, amp: 3.2, f: .8, ph: 1 }],
  act8: [{ x0: 560, y0: 120, x1: 830, y1: 380, amp: 3.6, f: .7, ph: 0 }, { x0: 590, y0: 300, x1: 790, y1: 436, amp: 2.0, f: .9, ph: 2 }],
  act1: [{ x0: 1380, y0: 360, x1: 1560, y1: 700, amp: 1.2, f: .4, ph: 0 }],
};
// sea bands on the bg layer that ripple
const SEA = { act7: [{ x0: 0, y0: 255, x1: 1672, y1: 470 }], act8: [{ x0: 0, y0: 268, x1: 1672, y1: 436 }] };

// ---------------------------------------------------------------- the cut (beat-snapped, see TIMELINE.md)
// cam keys: [t, cx, cy, vw]  (centre and visible width in original px; height = vw × 9/16)
const SHOTS = [
  { s: 'act1', t0: 0, t1: 6.525, in: 'black', cam: [[0, 836, 470, 1672], [2.0, 820, 470, 1480], [3.3, 505, 465, 820], [4.3, 520, 458, 770], [5.2, 1170, 468, 830], [6.525, 1185, 462, 760]],
    blinks: [[3.7, [0, 1]], [5.75, [2, 3]]], grade: { cool: .35 } },
  { s: 'act2', t0: 6.525, t1: 12.934, in: 'cross', xf: .55, cam: [[6.525, 360, 240, 800], [8.0, 370, 250, 770], [9.0, 255, 645, 690], [9.9, 270, 640, 660], [10.6, 1010, 365, 1250], [12.0, 1010, 385, 1300], [12.934, 1000, 420, 1420]],
    blinks: [[11.25, [0, 1]], [12.45, [0, 1]]], grade: { cool: .12, warmUp: [8.5, 12.9] } },
  { s: 'act3', t0: 12.934, t1: 21.455, in: 'flash', cam: [[12.934, 836, 470, 1560], [15.6, 810, 445, 1420], [16.6, 700, 600, 800], [18.4, 740, 610, 760], [19.4, 836, 470, 1560], [21.455, 870, 470, 1500]], ride: 1 },
  { s: 'act4', t0: 21.455, t1: 27.841, in: 'cross', xf: .5, cam: [[21.455, 836, 470, 1672], [23.6, 820, 455, 1440], [24.6, 1000, 420, 1150], [26.2, 990, 430, 1090], [27.841, 836, 460, 1400]] },
  { s: 'act5', t0: 27.841, t1: 38.499, in: 'flash', cam: [[27.841, 836, 470, 1672], [31.6, 830, 470, 1540], [34.6, 846, 470, 1530], [35.4, 836, 470, 1600], [38.499, 836, 470, 1570]],
    blinks: [[29.9, [0, 1]], [33.3, [0, 1]]], fireworks: [31.672, 32.508, 33.344, 34.18], date: [35.45, 38.499] },
  { s: 'act6', t0: 38.499, t1: 39.776, in: 'flash', cam: [[38.499, 255, 698, 480], [39.776, 262, 692, 440]] },
  { s: 'act6', t0: 39.776, t1: 41.053, in: 'cut', cam: [[39.776, 852, 196, 485], [41.053, 862, 190, 445]] },
  { s: 'act6', t0: 41.053, t1: 42.33, in: 'cut', cam: [[41.053, 1395, 186, 470], [42.33, 1405, 186, 440]] },
  { s: 'act6', t0: 42.33, t1: 43.607, in: 'cut', cam: [[42.33, 772, 735, 515], [43.607, 766, 730, 470]] },
  { s: 'act6', t0: 43.607, t1: 44.443, in: 'cut', cam: [[43.607, 335, 236, 460], [44.443, 342, 240, 430]] },
  { s: 'act7', t0: 44.443, t1: 51.27, in: 'light', xf: .7, cam: [[44.443, 600, 300, 600], [46.6, 660, 265, 720], [48.4, 760, 250, 800], [51.27, 1240, 247, 878]], blinks: [[46.3, [0, 1]], [49.0, [0, 1]]], gulls: 1 },
  { s: 'act8', t0: 51.27, t1: DUR, in: 'cross', xf: .9, cam: [[51.27, 590, 330, 470], [53.6, 655, 232, 735], [55.0, 662, 218, 775], [DUR, 664, 218, 775]], ending: 1 },
];
const LYRICS = [
  [1.56, 4.62, '我们都是渺小真实存在'], [4.70, 7.96, '祈愿小世界里不只有挫败'], [8.32, 11.44, '直到遇见你我以为就光明起来'],
  [11.80, 14.82, '眼睛里看到的都是广袤无垠的大海'], [15.60, 18.66, '有你在的日子不可能被取代'], [19.02, 22.04, '在最灰暗的日子你陪着我发呆'],
  [22.52, 24.98, '你让我学会如何拨开阴霾'], [25.42, 28.00, '将快乐全都收集将不开心全都淘汰'], [28.98, 31.40, '你对我说的情话'],
  [31.50, 34.60, '像转瞬即逝的烟花'], [35.66, 38.30, '只停在绽放一刹那'], [38.46, 41.40, '我却已无法自拔'],
  [42.58, 44.60, '我们的爱总有时差'], [44.64, 48.10, '也为你骗自己放下'], [48.56, 53.20, '爱炙热的你，却忘了爱自己'],
];
export const TIMELINE = { SHOTS: SHOTS.map(s => ({ scene: s.s, t0: s.t0, t1: s.t1, in: s.in })), LYRICS };

// ---------------------------------------------------------------- loading
export async function load(w, h, g) {
  W = w; H = h; G = g; OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; OG = OFF.getContext('2d');
  const im = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => j(new Error('missing ' + src)); i.src = src; });
  const need = new Set(SHOTS.map(s => s.s));
  await Promise.all([...need].map(async s => { try {
    const c = SC[s];
    if (c.layered) { c.bg = await im(`assets/layers/${s}_bg.png`); c.fg = await im(`assets/layers/${s}_fg.png`); }
    else c.bg = await im(`assets/up/${s}.png`);
    try { const r = await fetch(`assets/layers/${s}_blink.json`); if (r.ok) { c.eyes = await r.json(); for (const e of c.eyes) { e.half = await im(`assets/layers/${s}_eye${e.i}_half.png`); e.closed = await im(`assets/layers/${s}_eye${e.i}_closed.png`); } } } catch { }
    if (c.fg && WIND[s]) c.wind = WIND[s].map(r => windLayer(c, r));
  } catch (e) { if (!new URLSearchParams(location.search).get('preview')) throw e; console.warn('scene not ready', s); } }));
}
// the swaying part of the fg, with feathered edges, kept in its own canvas (plate px)
function windLayer(c, r) {
  const k = c.k, x0 = Math.floor(r.x0 * k), y0 = Math.floor(r.y0 * k), w = Math.ceil((r.x1 - r.x0) * k), h = Math.ceil((r.y1 - r.y0) * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  g.drawImage(c.fg, x0, y0, w, h, 0, 0, w, h);
  const m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d');
  let gr = mg.createLinearGradient(0, 0, 0, h * .25); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); mg.fillStyle = gr; mg.fillRect(0, 0, w, h);
  mg.globalCompositeOperation = 'destination-in';
  gr = mg.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.15, 'rgba(0,0,0,1)'); gr.addColorStop(.85, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mg.fillStyle = gr; mg.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(m, 0, 0);
  return { ...r, x: x0, y: y0, w, h, cv, mask: m };
}

// ---------------------------------------------------------------- camera
function camAt(sh, t) {
  const K = sh.cam; if (t <= K[0][0]) return K[0].slice(1); if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = eio(seg(t, a[0], b[0]));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
}
// visible rect of a layer in plate px; p = parallax (fg > 0 moves/zooms a little more than the plate)
function viewRect(sh, c, t, p) {
  let [cx, cy, vw] = camAt(sh, t); const [cx0, cy0, vw0] = camAt(sh, sh.t0);
  cx = cx0 + (cx - cx0) * (1 + p); cy = cy0 + (cy - cy0) * (1 + p); vw = vw0 * Math.pow(vw / vw0, 1 + p);
  const k = c.k, PW = c.bg.width / k, PH = c.bg.height / k, vh = vw * 9 / 16;
  cx = clamp(cx, vw / 2, PW - vw / 2); cy = clamp(cy, vh / 2, PH - vh / 2);
  return { x: (cx - vw / 2) * k, y: (cy - vh / 2) * k, w: vw * k, h: vh * k };
}
const toScreen = (v, x, y) => [(x - v.x) / v.w * W, (y - v.y) / v.h * H];

// ---------------------------------------------------------------- one shot
function drawShot(g, sh, t) {
  const c = SC[sh.s]; if (!c.bg) { g.fillStyle = '#222'; g.fillRect(0, 0, W, H); return; }
  const vb = viewRect(sh, c, t, c.layered ? -.05 : 0);
  // ride: the world streams past behind the bike
  g.drawImage(c.bg, vb.x, vb.y, vb.w, vb.h, 0, 0, W, H);
  if (sh.ride) { // road, rails and water stream past (below the skyline); the sky and the written line stay still
    const y0 = 470 * c.k; if (y0 < vb.y + vb.h) {
      const ys = Math.max(y0, vb.y), sy = (ys - vb.y) / vb.h * H, sh_ = vb.y + vb.h - ys, off = ((t - sh.t0) * 160 * c.k) % (60 * c.k);
      g.save(); const fade = g.createLinearGradient(0, sy, 0, sy + 60); g.globalAlpha = .38;
      for (const dx of [-26, -13, 13, 26]) g.drawImage(c.bg, clamp(vb.x + dx * c.k + off * .1, 0, c.bg.width - vb.w), ys, vb.w, sh_, 0, sy, W, H - sy);
      g.restore(); } }
  if (SEA[sh.s]) for (const r of SEA[sh.s]) sea(g, c, vb, r, t);
  if (sh.fireworks) fireworks(g, sh, t);
  if (sh.s === 'act1') act1Bg(g, c, vb, t);
  if (!c.layered) return;
  // fg: breathing (from the bottom), bike bob, wind, blinks — composed off-screen then drawn
  const vf = viewRect(sh, c, t, .06);
  const br = 1 + .0045 * Math.sin((t - sh.t0) * 2 * Math.PI / 3.4), bob = sh.ride ? Math.sin(t * 15) * 2.2 : 0;
  OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H);
  OG.setTransform(1, 0, 0, br, 0, H * (1 - br) + bob);
  OG.drawImage(c.fg, vf.x, vf.y, vf.w, vf.h, 0, 0, W, H);
  if (c.wind) for (const r of c.wind) wind(OG, r, vf, t);
  if (c.eyes && sh.blinks) for (const [bt, ids] of sh.blinks) {
    const f = Math.floor((t - bt) * 24); if (f < 0 || f > 4) continue;
    const st = f === 0 || f === 4 ? 'half' : 'closed';
    for (const e of c.eyes) if (ids.includes(e.i)) { const [x, y] = toScreen(vf, e.x, e.y); OG.drawImage(e[st], x, y, e.w / vf.w * W, e.h / vf.h * H); }
  }
  OG.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(OFF, 0, 0);
}
function wind(g, r, v, t) {
  // remove the region from the composed fg, then redraw it in thin horizontal slices pushed by a travelling wave
  const [sx, sy] = toScreen(v, r.x, r.y), sw = r.w / v.w * W, shh = r.h / v.h * H;
  g.save(); g.globalCompositeOperation = 'destination-out'; g.drawImage(r.mask, sx, sy, sw, shh); g.restore();
  const n = Math.max(8, Math.round(shh / 3)), A = r.amp * sw / (r.x1 - r.x0);   // original px → screen px
  for (let i = 0; i < n; i++) {
    const u = i / n, wgt = Math.pow(u, 1.3), dx = A * wgt * (Math.sin(t * 2 * Math.PI * r.f + u * 4 + r.ph) + .35 * Math.sin(t * 5.3 + u * 9));
    g.drawImage(r.cv, 0, u * r.h, r.w, r.h / n + 1, sx + dx, sy + u * shh, sw, shh / n + 1);
  }
}
function sea(g, c, v, r, t) {
  const k = c.k, y0 = r.y0 * k, y1 = r.y1 * k, top = (y0 - v.y) / v.h * H, bot = (y1 - v.y) / v.h * H; if (bot < 0 || top > H) return;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const u = i / n, py = y0 + (y1 - y0) * u, ph = py / k;
    const dx = Math.sin(t * 1.6 + ph * .09) * (.6 + u * 1.6) * k;
    const sy0 = (py - v.y) / v.h * H; if (sy0 < -10 || sy0 > H + 10) continue;
    g.drawImage(c.bg, v.x + dx, py, v.w, (y1 - y0) / n + 1, 0, sy0, W, (y1 - y0) / n / v.h * H + 1);
  }
  // glints dancing on the water
  const R = mulberry(7); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) {
    const x = R() * 1672 * k, y = y0 + (y1 - y0) * Math.pow(R(), .8), ph = R() * 6.28, sp = 1.5 + R() * 3;
    const a = Math.max(0, Math.sin(t * sp + ph)) ** 6; if (a < .05) continue;
    const [sx, sy] = toScreen(v, x, y); if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
    g.fillStyle = `rgba(255,246,220,${.55 * a})`; g.beginPath(); g.ellipse(sx, sy, 5 + 6 * a, 1.4, 0, 0, 7); g.fill();
  }
  g.restore();
}
function act1Bg(g, c, v, t) {
  // stars twinkling in her window; the two "…" bubbles breathing, then going still; the crack of light flickering
  const k = c.k, R = mulberry(3); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const x = (1180 + R() * 440) * k, y = (20 + R() * 300) * k, a = Math.max(0, Math.sin(t * (1 + R() * 2) + R() * 6)) ** 4, [sx, sy] = toScreen(v, x, y); if (a > .05) { g.fillStyle = `rgba(255,250,230,${.8 * a})`; g.beginPath(); g.arc(sx, sy, 1.5 + 2.5 * a, 0, 7); g.fill(); } }
  const still = 1 - ss(seg(t, 3.6, 4.4));
  for (const [x, y, ph] of [[738, 437, 0], [868, 518, 1.6]]) { const a = (.25 + .2 * Math.sin(t * 4 + ph)) * still, [sx, sy] = toScreen(v, x * k, y * k), r = 120 * W / v.w * k; const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(sx - r, sy - r, r * 2, r * 2); }
  const fl = .18 + .12 * Math.max(0, Math.sin(t * 7)) ** 3; const [ax, ay] = toScreen(v, 950 * k, 0), [bx, by] = toScreen(v, 655 * k, 941 * k);
  g.strokeStyle = `rgba(255,236,190,${fl})`; g.lineWidth = 30 * W / v.w * k; g.filter = 'blur(12px)'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.filter = 'none';
  g.restore();
}
function fireworks(g, sh, t) {
  const c = SC[sh.s], v = viewRect(sh, c, t, -.05), k = c.k;
  sh.fireworks.forEach((t0, i) => {
    const u = (t - t0) / 1.6; if (u < 0 || u > 1) return;
    const [cx, cy] = toScreen(v, [610, 1170, 700, 1220][i] * k, [150, 90, 60, 190][i] * k), R = (60 + 160 * eo(u)) * W / 1920, a = (1 - u) ** 1.5, col = ['255,190,210', '255,226,160', '220,200,255', '255,200,190'][i];
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 28; j++) { const an = j / 28 * 6.283 + i, x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R + u * u * 40; g.fillStyle = `rgba(${col},${.8 * a})`; g.beginPath(); g.arc(x, y, 3.2 * (1 - u * .5), 0, 7); g.fill(); g.strokeStyle = `rgba(${col},${.35 * a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(an) * R * .55, cy + Math.sin(an) * R * .55); g.lineTo(x, y); g.stroke(); }
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2); gr.addColorStop(0, `rgba(${col},${.35 * a * (1 - u)})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
    g.restore();
  });
}

// ---------------------------------------------------------------- screen-space atmosphere
function particles(g, sh, t) {
  const s = sh.s;
  if (s === 'act5' || s === 'act6') snow(g, t, s === 'act6' ? .6 : 1);
  if (s === 'act3') { petals(g, t, 1); speed(g, t); }
  if (s === 'act5') petals(g, t, .35);
  if (s === 'act4' || s === 'act2') bokeh(g, t, s === 'act4' ? 1 : .6);
  if (sh.gulls) gulls(g, t - sh.t0);
}
function snow(g, t, k) {
  const R = mulberry(11); g.save();
  for (let i = 0; i < 140 * k; i++) {
    const z = R(), sp = 30 + z * 70, x = (R() * W + Math.sin(t * .7 + i) * 30 * z + t * 12 * z) % W, y = (R() * H + t * sp) % (H + 40) - 20, r = 1.2 + z * 3.4;
    g.fillStyle = `rgba(255,255,255,${.35 + z * .5})`; if (z > .8) g.filter = 'blur(1.5px)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.filter = 'none';
  }
  g.restore();
}
function petals(g, t, k) {
  const R = mulberry(21); g.save();
  for (let i = 0; i < 46 * k; i++) {
    const z = .4 + R() * .6, sp = (k > .5 ? 520 : 90) * z, x = ((R() * (W + 200) - t * sp) % (W + 200) + W + 200) % (W + 200) - 100, y = (R() * H + t * 40 * z + Math.sin(t * 2 + i) * 20) % H, rot = t * (1 + R() * 3) + i;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, .55 + .45 * Math.sin(t * 3 + i)); g.fillStyle = `rgba(255,${190 + R() * 30 | 0},${206 + R() * 20 | 0},${.75 * z})`;
    g.beginPath(); g.ellipse(0, 0, 9 * z, 5.5 * z, 0, 0, 7); g.fill(); g.restore();
  }
  g.restore();
}
function speed(g, t) {
  const R = mulberry(31); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) { const y = R() * H, l = 160 + R() * 300, x = ((R() * W * 2 - t * 2200) % (W * 2) + W * 2) % (W * 2) - l; const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, 'rgba(255,240,250,0)'); gr.addColorStop(1, 'rgba(255,240,250,.32)'); g.fillStyle = gr; g.fillRect(x, y, l, 2 + R() * 2); }
  g.restore();
}
function bokeh(g, t, k) {
  const R = mulberry(41); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26 * k; i++) { const x = (R() * W + t * 8 * (R() - .5)) % W, y = R() * H * .8 + Math.sin(t * .6 + i) * 10, r = 10 + R() * 34, a = (.06 + .08 * R()) * (.7 + .3 * Math.sin(t * 1.3 + i)); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,214,170,${a})`); gr.addColorStop(.8, `rgba(255,214,170,${a * .6})`); gr.addColorStop(1, 'rgba(255,214,170,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.restore();
}
function gulls(g, u) {
  g.save(); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round';
  [[0, .18, 1], [.6, .26, .7], [1.3, .14, .8]].forEach(([d, y0, s]) => {
    const p = (u - d) / 6.2; if (p < 0 || p > 1) return; const x = lerp(-80, W + 80, p), y = H * y0 + Math.sin(p * 9) * 18, fl = Math.sin(u * 9 + d * 3) * 10 * s;
    g.lineWidth = 3.4 * s; g.beginPath(); g.moveTo(x - 26 * s, y - fl); g.quadraticCurveTo(x - 12 * s, y - 12 * s - fl * .4, x, y); g.quadraticCurveTo(x + 12 * s, y - 12 * s - fl * .4, x + 26 * s, y - fl); g.stroke();
  });
  g.restore();
}
function grade(g, sh, t) {
  const gr = sh.grade || {};
  let cool = gr.cool || 0; if (gr.warmUp) cool *= 1 - ss(seg(t, gr.warmUp[0], gr.warmUp[1]));
  if (cool > 0) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = cool; g.fillStyle = '#3a5a9a'; g.fillRect(0, 0, W, H); g.restore(); }
  if (gr.warmUp) { const w = ss(seg(t, gr.warmUp[0], gr.warmUp[1])) * .25; g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = w; g.fillStyle = '#ffb070'; g.fillRect(0, 0, W, H); g.restore(); }
  const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(20,10,30,0)'); v.addColorStop(1, 'rgba(20,10,30,.32)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- captions
function lyric(g, t) {
  for (const [a, b, s] of LYRICS) {
    if (t < a - .15 || t > b + .3) continue;
    const k = Math.min(ss(seg(t, a - .15, a + .2)), 1 - ss(seg(t, b, b + .3)));
    g.save(); g.globalAlpha = k; g.font = '600 46px Lyric'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const y = H - 70 + (1 - k) * 8;
    g.shadowColor = 'rgba(30,15,40,.75)'; g.shadowBlur = 14; g.fillStyle = 'rgba(255,252,246,1)'; g.fillText(s, W / 2, y);
    g.shadowBlur = 3; g.shadowColor = 'rgba(30,15,40,.6)'; g.fillText(s, W / 2, y);
    g.restore();
  }
}
function dateCard(g, sh, t) {
  const [a, b] = sh.date; if (t < a) return; const k = ss(seg(t, a, a + .6)), out = 1 - ss(seg(t, b - .35, b));
  g.save(); g.globalAlpha = .55 * k * out; g.fillStyle = '#1c1022'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalAlpha = k * out; g.translate(W / 2, H * .44 - (1 - k) * 20);
  g.font = '500 128px DateF'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,190,200,.9)'; g.shadowBlur = 40; g.fillStyle = '#fff8f0'; g.fillText('2025.11.15', 0, 0);
  g.shadowBlur = 0; g.globalAlpha = k * out * .9; g.strokeStyle = 'rgba(255,230,235,.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-330, 86); g.lineTo(330, 86); g.stroke();
  // small heart under the line
  g.fillStyle = '#ffb3c4'; g.beginPath(); const hy = 120, s = 16; g.moveTo(0, hy + s * .35); g.bezierCurveTo(-s * 1.1, hy - s * .35, -s * .5, hy - s * 1.05, 0, hy - s * .45); g.bezierCurveTo(s * .5, hy - s * 1.05, s * 1.1, hy - s * .35, 0, hy + s * .35); g.fill();
  g.restore();
}
const END = '我们的故事，未来再续……';
function ending(g, t) {
  const a = 54.2; if (t < a) return;
  g.save(); g.font = '76px HandZh'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(120,60,90,.55)'; g.shadowBlur = 16;
  const lines = [END.slice(0, 6), END.slice(6)], X = [W * .665, W * .705], Y = [H * .29, H * .29 + 96];
  let n = 0; lines.forEach((ln, li) => { let x = X[li]; for (const ch of ln) { const t0 = a + n * .12; n++; const k = ss(seg(t, t0, t0 + .5)); if (k > 0) { g.globalAlpha = k; g.fillStyle = '#fffaf2'; g.fillText(ch, x, Y[li] + (1 - k) * 10); } x += g.measureText(ch).width; } });
  // a soft underline sweep and a heart, like the illustration's
  const k = ss(seg(t, a + 1.5, a + 2.3)); if (k > 0) { g.globalAlpha = k * .85; g.strokeStyle = '#fffaf2'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * .69, Y[1] + 34); g.quadraticCurveTo(W * .8, Y[1] + 18, W * .69 + (W * .27) * k, Y[1] + 8); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- frame
export function frame(t) {
  const g = G; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = SHOTS.length - 1;
  const sh = SHOTS[i], prev = SHOTS[i - 1];
  drawShot(g, sh, t); particles(g, sh, t); grade(g, sh, t);
  // transitions into this shot
  const xf = sh.xf || .5, u = (t - sh.t0) / xf;
  if (prev && (sh.in === 'cross' || sh.in === 'light') && u < 1) {
    // draw the previous shot (continuing in time) on top and fade it out
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d'); const keep = OG;
    drawShot(tg, prev, t); particles(tg, prev, t); grade(tg, prev, t);
    g.save(); g.globalAlpha = 1 - eio(u); g.drawImage(tmp, 0, 0); g.restore();
    if (sh.in === 'light') { const a = Math.sin(Math.PI * clamp(u)) * .42; g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(W * .7, H * .3, 0, W * .7, H * .3, W * .9); gr.addColorStop(0, `rgba(255,248,225,${a})`); gr.addColorStop(1, `rgba(255,230,200,${a * .3})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  }
  if (sh.in === 'flash') { const a = (1 - clamp((t - sh.t0) / .45)) ** 2 * .85; if (a > 0) { g.fillStyle = `rgba(255,250,244,${a})`; g.fillRect(0, 0, W, H); } }
  if (sh.in === 'cut' && t - sh.t0 < .1) { g.fillStyle = `rgba(255,250,244,${.35 * (1 - (t - sh.t0) / .1)})`; g.fillRect(0, 0, W, H); }
  if (sh.in === 'black') { const a = 1 - ss(seg(t, 0, .9)); if (a > 0) { g.fillStyle = `rgba(8,6,14,${a})`; g.fillRect(0, 0, W, H); } }
  if (sh.date) dateCard(g, sh, t);
  if (sh.ending) ending(g, t);
  lyric(g, t);
  if (t > DUR - .55) { g.fillStyle = `rgba(8,6,14,${ss(seg(t, DUR - .55, DUR))})`; g.fillRect(0, 0, W, H); }
}
