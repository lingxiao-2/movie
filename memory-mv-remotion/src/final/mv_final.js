// @ts-nocheck
// 《把回忆拼好给你》一周年 MV — final V4.0 engine (derived from memory-mv-book/js/book2.js; that file is untouched).
// Fixed camera: every illustration is shown whole (no Ken Burns / zoom / pan / crop). Motion only from independent
// elements (chat bubbles, route, polaroids, light, snow, petals, candle) and story transitions on the music.
// 《把回忆拼好给你》立体纸艺动态 MV — the user's finished illustrations staged as a pop-up anniversary book.
// Rigid only: camera moves over plates, cut-out paper stickers pop up (scale/rotate about their base), the map
// route grows, polaroids fall and pile up, candle light flickers. Characters are never deformed.
// Plate coordinates: original 1672 × 941 px. Song: original DJ mix, 59.04 s, lyric times unchanged.
import { seg, ss, eio, eo, ei, clamp, lerp, mulberry, back } from '../legacy/lib.js';
// Remotion shell: asset URLs resolve against the Remotion public folder (set by LegacyBook). Otherwise identical to memory-mv-book/js/book2.js.
let BASE = ''; export const setBase = b => { BASE = b; }; const U = s => BASE + s;
export const DUR = 59.04;  // the whole song, never re-timed
let W, H, G, OFF, OG, MK;
const IMG = {}, CI = {}; let STK = {}, PIECES = {}, LIFT = {}, NB, NG;
const im = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + s)); i.src = U(s); });
const tryIm = async (...ss_) => { for (const s of ss_) { try { return await im(s); } catch { } } throw new Error('missing ' + ss_[0]); };

// ------------------------------------------------------------------------------------------- timeline
const LYRICS = [
  [1.56, 4.62, '我们都是渺小真实存在'], [4.70, 7.96, '祈愿小世界里不只有挫败'], [8.32, 11.44, '直到遇见你我以为就光明起来'],
  [11.80, 14.82, '眼睛里看到的都是广袤无垠的大海'], [15.60, 18.66, '有你在的日子不可能被取代'], [19.02, 22.04, '在最灰暗的日子你陪着我发呆'],
  [22.52, 24.98, '你让我学会如何拨开阴霾'], [25.42, 28.00, '将快乐全都收集将不开心全都淘汰'], [28.98, 31.40, '你对我说的情话'],
  [31.50, 34.60, '像转瞬即逝的烟花'], [35.66, 38.30, '只停在绽放一刹那'], [38.46, 41.40, '我却已无法自拔'],
  [42.58, 44.60, '我们的爱总有时差'], [44.64, 48.10, '也为你骗自己放下'], [48.56, 53.20, '爱炙热的你，却忘了爱自己'],
];
// cam keys [t, cx, cy, vw]; pops [sticker, t]; clean: from this time the plate is drawn without its stickers
// pages of the book. in: 'flip' = the next page falls from the top edge onto the previous one (rigid page);
// 'cut' = an edit inside the same page. pops: [piece, t-in] on plate pages = paper stickers lifting off the page.
// FIXED CAMERA: every page is shown whole (no zoom / pan / crop). Only independent paper pieces move.
// lifts: [sticker, t-in] = a cut-out laid exactly over its painted original rises off the page and settles back
export const SHOTS = [   // boundaries on measured beats / lyric changes; in = transition into the shot
  { id: 'open', t0: 0, t1: 8.2, custom: 'opening2' },
  { id: '1', t0: 8.2, t1: 15.2, custom: 'wechat', in: 'bloom' },
  { id: '2', t0: 15.2, t1: 18.901, custom: 'dorm', in: 'fade' },
  { id: '3a', t0: 18.901, t1: 21.873, p: 'act3_ride', in: 'bloom', lifts: [['act3_ride', 'think', 19.55]], fx: { ride: 1 } },
  { id: '3b', t0: 21.873, t1: 25.287, custom: 'map', in: 'fade' },
  { id: '4a', t0: 25.287, t1: 28.7, p: 'act4_gate', in: 'bloom', lifts: [['act4_gate', 'marks', 25.95], ['act4_gate', 'h1', 26.4], ['act4_gate', 'h2', 26.8]], fx: { snow: .5 } },
  { id: '4b', t0: 28.7, t1: 31.672, p: 'act4_mall', in: 'fade', lifts: [['act4_mall', 'h1', 29.35], ['act4_mall', 'h2', 29.75]], fx: { bokeh: .8 } },
  { id: '5', t0: 31.672, t1: 38.499, p: 'act5_gift', in: 'fade', lifts: [['act5_gift', 'heart', 32.53], ['act5_gift', 'tag', 33.39]], fx: { snow: .6, fireworks: [31.67, 32.53, 33.39, 34.23, 35.66] } },
  { id: '6', t0: 38.499, t1: 50.852, custom: 'polaroids', in: 'fade' },
  { id: '8', t0: 50.852, t1: 59.04, custom: 'cake', in: 'glow' },
];

// ------------------------------------------------------------------------------------------- loading
const PLATES = ['act3_map', 'act3_ride', 'act4_gate', 'act4_mall', 'act5_gift', 'act8_cake'];
const POLS = ['study', 'night', 'city', 'weihai'];
export async function load(w, h, g) {
  W = w; H = h; G = g; const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  OFF = mk(); OG = OFF.getContext('2d'); MK = mk(); NB = mk(); NG = NB.getContext('2d');
  STK = await (await fetch(U('pc/cut/stickers.json'))).json(); PIECES = await (await fetch(U('cut/pieces.json'))).json();
  await Promise.all(PLATES.map(async p => {
    IMG[p] = await tryIm(`pc/up/${p}.png`, `pc/src/${p}.png`);
    if (STK[p]) { IMG[p + '_clean'] = await im(`pc/cut/${p}_clean.png`); for (const n of Object.keys(STK[p])) IMG[p + '_' + n] = await im(`pc/cut/${p}_${n}.png`); }
  }));
  for (const n of Object.keys(PIECES)) IMG['pc_' + n] = await im(`cut/${n}.png`);
  IMG.lace = await im('up/bg_lace.png'); IMG.cl_map = await im('plates/act3_map_clean.png'); IMG.cake_clean = await im('plates/act8_cake_clean.png');
  LIFT = await (await fetch(U('cut/lift.json'))).json(); for (const pn of Object.keys(LIFT)) for (const n of Object.keys(LIFT[pn])) IMG[`lift_${n}`] = await im(`cut/lift_${pn}_${n}.png`);
  IMG.v2_bg_dorm = await im('cut/v02/bg_dorm.png'); IMG.m_low = await im('stands/m_low.png'); IMG.m_firm = await im('stands/m_firm.png');
  IMG.stage = await im('src/stage_plain.png');
  for (const n of ['noodle', 'study', 'night', 'city']) IMG['pol_' + n] = await im(`pc/cut/pol_${n}.png`);
  buildPolaroids();
  const L = { cover: 'anniv/obj/cover_obj.png', page: 'card/layers/inner_page.png', couple: 'card/layers/pop_couple.png', cats: 'card/layers/pop_cats.png', bike: 'card/layers/pop_bike.png', plaque: 'card/layers/pop_plaque.png' };
  await Promise.all(Object.entries(L).map(async ([k, s]) => { CI[k] = await im(s); }));
}

// ------------------------------------------------------------------------------------------- camera over a plate
const EASE = { io: eio, in: u => ei(u) * .6 + u * .4, out: eo };
function camAt(K, t, e = 'io') {
  if (t <= K[0][0]) return K[0].slice(1); if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = EASE[e]((t - a[0]) / (b[0] - a[0]));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
}
// set the context so that 1 unit = 1 original px of the plate
function view(g, cx, cy, vw) { vw = Math.min(vw, 1672); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2);
  const s = W / vw; g.setTransform(s, 0, 0, s, -(cx - vw / 2) * s, -(cy - vh / 2) * s); return { cx, cy, vw, s }; }
const plateDraw = (g, img) => g.drawImage(img, 0, 0, 1672, 941);

// a paper sticker popping up about its pivot (scale with overshoot + a small swing), with a lifting shadow
function sticker(g, img, m, u) {
  if (u <= 0) return; const k = back(clamp(u), 1.9), sc = lerp(.12, 1, k), rot = (1 - eo(clamp(u))) * -9 + Math.sin(clamp(u) * Math.PI) * 3, lift = Math.sin(Math.PI * clamp(u));
  g.save(); g.translate(m.px, m.py); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.translate(-m.px, -m.py);
  g.globalAlpha = clamp(u * 5); g.shadowColor = `rgba(70,30,50,${.25 + .25 * lift})`; g.shadowBlur = 10 + 18 * lift; g.shadowOffsetY = 4 + 10 * lift;
  g.drawImage(img, m.x, m.y, m.w, m.h); g.restore();
}
// a paper sticker lifting off the page: a copy laid exactly on the painted sticker, rising (scale ≥ 1 about its
// base, small swing) with a growing shadow, then settling slightly raised — the painting underneath is never exposed
function lift(g, img, m, dt) {
  if (dt <= 0) return; const u = clamp(dt / .5), k = back(u, 2.2), sc = 1 + .09 * Math.sin(Math.PI * u) * (1 - u * .4) + .03 * ss(u), rot = Math.sin(Math.PI * u) * 2.2, lift_ = .4 + .6 * Math.sin(Math.PI * u);
  g.save(); g.translate(m.px, m.py); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.translate(-m.px, -m.py);
  g.shadowColor = `rgba(70,30,50,${.22 + .2 * lift_})`; g.shadowBlur = 8 + 14 * lift_; g.shadowOffsetY = 3 + 8 * lift_; g.drawImage(img, m.x, m.y, m.w, m.h); g.restore();
}
function liftRet(g, img, m, dt, tout) {      // rise (0.5 s), stay slightly raised, sink back flat before tout
  if (dt <= 0) return; const u = clamp(dt / .5), r = clamp((tout - (dt)) / .35);
  const k = Math.min(1, r), sc = 1 + (.09 * Math.sin(Math.PI * u) * (1 - u * .4) + .035 * ss(u)) * k, rot = Math.sin(Math.PI * u) * 2.2 * k, lift_ = (.4 + .6 * Math.sin(Math.PI * u)) * k;
  g.save(); g.translate(m.px, m.py); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.translate(-m.px, -m.py);
  g.shadowColor = `rgba(70,30,50,${(.22 + .2 * lift_) * k})`; g.shadowBlur = (8 + 14 * lift_) * k; g.shadowOffsetY = (3 + 8 * lift_) * k; g.drawImage(img, m.x, m.y, m.w, m.h); g.restore();
}
function plateShot(g, sh, t) {
  view(g, 836, 470.25, 1672);                                   // the whole page, always
  plateDraw(g, IMG[sh.plate || sh.p]);
  const fx = sh.fx || {};
  if (fx.ride) rideFx(g, t, 0);
  if (fx.fireworks) fireworks(g, t, fx.fireworks);
  for (const [src, n, tin] of sh.lifts || []) { const m = src === 'lift' ? LIFT.act2_dorm[n] : STK[src][n], img = src === 'lift' ? IMG['lift_' + n] : IMG[src + '_' + n]; liftRet(g, img, m, t - tin, sh.t1 - .45 - tin); }
  if (fx.ride) rideFx(g, t, 1);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fx.snow) snow(g, t, fx.snow);
  if (fx.bokeh) bokeh(g, t, fx.bokeh);
  tint(g, fx.warm || 0, fx.cool || 0);
}
// the ride page: street lamps pulse, warm light streams along the road, paper petals blow past (camera fixed)
function rideFx(g, t, front) {
  if (!front) {
    for (const [x, y, ph] of [[505, 117, 0], [1585, 333, 1.3], [1300, 405, 2.1]]) glow(g, x, y, 120, '255,214,150', .26 + .1 * Math.sin(t * 3 + ph));
    g.save(); g.globalCompositeOperation = 'screen'; const R = mulberry(5);
    for (let i = 0; i < 10; i++) { const y = 610 + R() * 180, l = 140 + R() * 180, x = ((R() * 2000 - t * 1100) % 2000 + 2000) % 2000 - 200; const gr = g.createLinearGradient(x + l, 0, x, 0); gr.addColorStop(0, 'rgba(255,225,180,0)'); gr.addColorStop(1, 'rgba(255,225,180,.3)'); g.fillStyle = gr; g.fillRect(x, y, l, 2.5); }
    g.restore(); return;
  }
  const P = mulberry(8); g.save();
  for (let i = 0; i < 10; i++) { const z = .5 + P() * .6, x = ((P() * 1900 - t * 420 * z) % 1900 + 1900) % 1900 - 100, y = 500 + P() * 420 + Math.sin(t * 2 + i) * 20;
    g.save(); g.translate(x, y); g.rotate(t * 2 * z + i); g.scale(1, .55 + .45 * Math.sin(t * 3 + i)); g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(0, 0, 11 * z, 7 * z, 0, 0, 7); g.fill(); g.fillStyle = '#ffc3d0'; g.beginPath(); g.ellipse(0, 0, 9 * z, 5.5 * z, 0, 0, 7); g.fill(); g.restore(); }
  g.restore();
}

// ------------------------------------------------------------------------------------------- V4.0 pages
// distant fireworks for 「像转瞬即逝的烟花」: a few soft bursts in the night sky of the confession page, on beats
function fireworks(g, t, times) {
  const SPOTS = [[300, 120, '255,190,210'], [610, 70, '255,226,170'], [180, 230, '220,200,255'], [470, 190, '255,205,185'], [660, 150, '255,236,200']];
  times.forEach((t0, k) => { const u = (t - t0) / 1.5; if (u < 0 || u > 1) return; const [x, y, c] = SPOTS[k % SPOTS.length], r = 18 + 70 * eo(u), a = (1 - u) * (1 - u);
    glow(g, x, y, r * 1.8, c, .28 * a);
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2 + k, px = x + Math.cos(an) * r, py = y + Math.sin(an) * r + 14 * u * u;
      g.fillStyle = `rgba(${c},${.75 * a})`; g.beginPath(); g.arc(px, py, 2.4 * (1 - u * .5), 0, 7); g.fill(); }
    g.restore(); });
}
// 2 · the dorm: clean dorm page (V02) with two complete poses of him — low, then decided (soft dissolve, no motion
// of the figure itself) — and the white helmet set down on the desk. Plate coords 1672 × 941.
function dormShot(g, sh, t) {
  view(g, 836, 470.25, 1672); plateDraw(g, IMG.v2_bg_dorm);
  glow(g, 300, 470, 170, '255,220,160', .22 + .06 * Math.sin(t * 2.2));               // the desk lamp
  const base = 932, cx = 1110, put = (img, a) => { if (a <= 0) return; const s = 587 / IMG.m_low.height, w = img.width * s, h = img.height * s, x = cx - IMG.m_low.width * s / 2;
    g.save(); g.globalAlpha = a; const gr = g.createRadialGradient(cx, base, 0, cx, base, w * .5); gr.addColorStop(0, 'rgba(50,20,45,.35)'); gr.addColorStop(1, 'rgba(50,20,45,0)');
    g.save(); g.translate(cx, base); g.scale(1, .08); g.fillStyle = gr; g.fillRect(-w * .5, -w * .5, w, w); g.restore();
    g.shadowColor = 'rgba(60,25,50,.28)'; g.shadowBlur = 10; g.shadowOffsetX = 5; g.shadowOffsetY = 4; g.drawImage(img, x, base - h, w, h); g.restore(); };
  const sw = ss(seg(t, 16.98, 17.2));                                                      // low → decided (quick swap on the beat)
  put(IMG.m_low, ss(seg(t, sh.t0 + .15, sh.t0 + .6)) * (1 - sw)); put(IMG.m_firm, sw);
  const hm = LIFT.act2_dorm.helmet, hs = 230 / hm.h, k = ss(seg(t, 17.55, 18.0)), dy = (1 - eo(seg(t, 17.55, 18.0))) * -26;
  if (k > 0) { g.save(); g.globalAlpha = k; g.shadowColor = 'rgba(60,25,50,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 5; g.drawImage(IMG.lift_helmet, 540 - hm.w * hs / 2, 712 - hm.h * hs + dy, hm.w * hs, hm.h * hs); g.restore();
    glow(g, 540, 640, 150, '255,248,235', .2 * Math.sin(Math.PI * seg(t, 17.6, 18.6))); }
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .08, 0);
}
// 6 · polaroids: independent complete photos fall one by one on the beat and pile up; nothing leaves; at the end
// they overflow the frame. Fixed camera (no zoom).
let PILE = [];
function buildPolaroids() {
  // [image, landing beat time, centre x, centre y, rotation, width]  (1920 × 1080 screen px)
  const L = [
    ['pc_pol00', 38.92, 560, 330, -6, 640], ['pc_pol02', 39.78, 1360, 320, 5, 640], ['pc_pol01', 40.61, 960, 600, -3, 640],
    ['pc_pol10', 41.47, 470, 760, 7, 640], ['pc_pol03', 42.33, 1470, 760, -6, 640], ['pc_pol12', 43.19, 900, 250, 4, 640],
    ['pc_pol13', 44.03, 300, 470, -8, 620], ['pc_pol20', 44.88, 1640, 520, 7, 620], ['pc_pol21', 45.72, 1180, 890, -4, 640],
    ['pol_noodle', 46.58, 700, 900, 5, 600], ['pc_pol22', 47.44, 1240, 470, -3, 680],
    ['pol_study', 48.30, 120, 980, 9, 560], ['pol_night', 48.72, 1830, 120, -9, 520], ['pol_city', 49.13, 1790, 990, 6, 560],
    ['pc_pol23', 49.57, 640, 560, -2, 700],
  ];
  PILE = L.map(([n, t, x, y, rot, w]) => ({ img: IMG[n], t0: t - .5, x, y, rot, w, plate: n.startsWith('pol_') }));
}
function polShot(g, sh, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(5px) brightness(.95)'; g.drawImage(IMG.stage, -30, -18, W + 60, H + 36); g.filter = 'none';
  const S = W / 1920; g.setTransform(S, 0, 0, S, 0, 0);
  for (const p of PILE) {
    const u = (t - p.t0) / .5; if (u <= 0) continue; const e = clamp(u), land = back(e, 1.2);
    const dy = lerp(-300, 0, eo(e)), rot = p.rot + (1 - eo(e)) * 10, lift = 1 - e, h = p.w * p.img.height / p.img.width, sc = lerp(1.05, 1, land);
    g.save(); g.translate(p.x, p.y + dy); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.globalAlpha = clamp(u * 5);
    g.shadowColor = `rgba(45,20,40,${.26 + .14 * lift})`; g.shadowBlur = 12 + 26 * lift; g.shadowOffsetX = 5 + 14 * lift; g.shadowOffsetY = 8 + 24 * lift;
    if (p.plate) { g.fillStyle = '#fdf8f2'; g.fillRect(-p.w / 2 - 8, -h / 2 - 8, p.w + 16, h + 16); g.shadowColor = 'transparent'; }
    g.drawImage(p.img, -p.w / 2, -h / 2, p.w, h); g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .05, 0);
}
// 8 · candle cake: the approved cake page (its ending words lifted off as a sticker) — candle flicker, warm light
// breathing, a few paper petals, and the ending line appears slowly; then a gentle hold.
function cakeShot(g, sh, t) {
  view(g, 836, 470.25, 1672); plateDraw(g, IMG.cake_clean);          // the approved page, its note still blank
  candle(g, t, 812, 455);
  glow(g, 836, 520, 700, '255,190,130', .1 + .05 * Math.sin(t * 1.3));
  // the ending line appears as if written: the original illustration revealed left → right on the note only
  const NX0 = 1305, NY0 = 352, NX1 = 1648, NY1 = 516, u = eio(seg(t, 54.1, 56.9));
  if (u > 0) {
    const vs = W / 1672, ex = lerp(NX0 - 70, NX1 + 70, u);
    OG.setTransform(vs, 0, 0, vs, 0, 0); OG.clearRect(0, 0, 1672, 941);
    OG.save(); OG.beginPath(); OG.rect(NX0, NY0, NX1 - NX0, NY1 - NY0); OG.clip(); OG.drawImage(IMG.act8_cake, 0, 0, 1672, 941); OG.restore();
    OG.globalCompositeOperation = 'destination-in'; const gr = OG.createLinearGradient(ex - 70, 0, ex + 10, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    OG.fillStyle = gr; OG.fillRect(0, 0, 1672, 941); OG.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(OFF, 0, 0); g.restore();
    glow(g, 1476, 434, 260, '255,236,210', .16 * Math.sin(Math.PI * seg(t, 54.4, 57.4)));
  }
  const P = mulberry(19); g.save();                                                       // a few paper petals
  for (let i = 0; i < 9; i++) { const z = .5 + P() * .6, x = P() * 1672 + Math.sin(t * .8 + i) * 30, y = ((P() * 1100 + t * 38 * z) % 1100) - 80;
    g.save(); g.translate(x, y); g.rotate(t * .9 * z + i); g.scale(1, .55 + .45 * Math.sin(t * 1.7 + i)); g.globalAlpha = .85; g.fillStyle = '#fff6f2'; g.beginPath(); g.ellipse(0, 0, 10 * z, 6.5 * z, 0, 0, 7); g.fill(); g.fillStyle = '#ffc9d6'; g.beginPath(); g.ellipse(0, 0, 8 * z, 5 * z, 0, 0, 7); g.fill(); g.restore(); }
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .06, 0);
}

// ------------------------------------------------------------------------------------------- 3 · the map
const ROUTE = [[232, 372], [244, 392], [280, 440], [320, 462], [418, 490], [557, 530], [655, 550], [780, 557], [906, 563], [1003, 557], [1060, 585], [1101, 613], [1136, 672], [1140, 694]];
const SEGL = []; let RLEN = 0; for (let i = 1; i < ROUTE.length; i++) { const l = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]); SEGL.push(l); RLEN += l; }
function along(d) { for (let i = 0; i < SEGL.length; i++) { if (d <= SEGL[i] || i === SEGL.length - 1) { const u = clamp(d / SEGL[i]); return [lerp(ROUTE[i][0], ROUTE[i + 1][0], u), lerp(ROUTE[i][1], ROUTE[i + 1][1], u), Math.atan2(ROUTE[i + 1][1] - ROUTE[i][1], ROUTE[i + 1][0] - ROUTE[i][0])]; } d -= SEGL[i]; } }
function mapShot(g, sh0, t) {
  const sh = { t0: 21.2, t1: 25.2 }; t = 21.2 + (t - sh0.t0) * 4.0 / (sh0.t1 - sh0.t0);
  view(g, 836, 470.25, 1672); plateDraw(g, IMG.cl_map);
  liftRet(g, IMG.lift_jinan, LIFT.act3_map.jinan, t - 21.7, sh.t1 - .45 - 21.7);
  const u = eio(seg(t, 22.15, 24.3)), d = u * RLEN, [mx, my] = along(d);
  g.save(); g.strokeStyle = '#ec5b6b'; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([18, 15]); g.globalAlpha = 1 - seg(t, sh.t1 - .45, sh.t1 - .1); g.beginPath();
  let acc = 0; g.moveTo(...ROUTE[0]);
  for (let i = 0; i < SEGL.length; i++) { if (acc + SEGL[i] >= d) { const q = along(d); g.lineTo(q[0], q[1]); break; } g.lineTo(...ROUTE[i + 1]); acc += SEGL[i]; }
  if (d > 0) g.stroke(); g.restore();
  liftRet(g, IMG.lift_taian, LIFT.act3_map.taian, t - 24.25, sh.t1 - .45 - 24.25);
  const m = STK.act3_map.moto, pop = back(seg(t, 21.95, 22.35), 1.6), ret = 1 - eio(seg(t, sh.t1 - .45, sh.t1 - .1)), k = Math.min(pop, ret);
  if (k > .01) { const sc = .58, bob = Math.sin(t * 16) * 1.2 * seg(t, 22.15, 22.3) * (1 - seg(t, 24.3, 24.4));
    g.save(); g.translate(mx, my + bob); g.scale(sc, sc * k); g.translate(-m.px, -m.py);
    g.shadowColor = `rgba(70,30,40,${.35 * k})`; g.shadowBlur = 16; g.shadowOffsetY = 8 * k; g.drawImage(IMG.act3_map_moto, m.x, m.y, m.w, m.h); g.restore(); }
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .04, 0);
}

// ---- 1 · the WeChat quarrel: the user's RGBA WeChat sheet staged as a pop-up page (sheet coords → screen)
const WE = [  // [piece, in, scale-from pivot ('b' bottom / 'c' centre)]
  ['phoneL', 8.6, 'b'], ['phoneR', 9.02, 'b'], ['note', 8.81, 'b'], ['heartline', 9.45, 'c'],
  ['g1', 9.95, 'c'], ['w1', 10.45, 'c'], ['g2', 10.87, 'c'], ['w2', 11.29, 'c'], ['dots', 11.71, 'c'],
  ['broken', 12.55, 'c'], ['scribble', 12.97, 'c'],
];
const WE_OUT = 14.25;
function popPiece(g, n, tin, tout, piv, t) {
  const m = PIECES[n], img = IMG['pc_' + n]; if (!m) return;
  const uin = (t - tin) / .42, uout = (t - tout) / .3; if (uin <= 0 || uout >= 1) return;
  const k = uout > 0 ? 1 - eio(uout) : back(clamp(uin), 1.7), lift = uout > 0 ? 1 - uout : Math.sin(Math.PI * clamp(uin)) * .6 + .4;
  const S = W / 1672, x = m.x * S, y = m.y * S, w = m.w * S, h = m.h * S, px = x + w / 2, py = piv === 'b' ? y + h : y + h / 2;
  const rot = uout > 0 ? 0 : (1 - eo(clamp(uin))) * -7;
  g.save(); g.translate(px, py); g.rotate(rot * Math.PI / 180); if (piv === 'b') g.scale(1, Math.max(.02, k)); else g.scale(Math.max(.02, k), Math.max(.02, k)); g.translate(-px, -py);
  g.shadowColor = `rgba(30,20,60,${.3 + .2 * lift})`; g.shadowBlur = 10 + 16 * lift; g.shadowOffsetY = 5 + 9 * lift; g.drawImage(img, x, y, w, h); g.restore();
}
function wechatShot(g, sh, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b2c5e'); gr.addColorStop(1, '#5b4d86'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the page: the user's night pop-up stage, out of focus behind the phones
  const st = IMG.pc_night_stage, sc = Math.max(W / st.width, H / st.height) * 1.08, push = 1;
  g.filter = 'blur(5px) brightness(.8) saturate(1.1)'; g.drawImage(st, W / 2 - st.width * sc * push / 2, H / 2 - st.height * sc * push / 2, st.width * sc * push, st.height * sc * push); g.filter = 'none';
  twinkle(g, t, 1);
  const silent = seg(t, 13.3, 13.8);
  for (const [n, tin, piv] of WE) {
    if (n === 'heartline' && t > 12.3) { g.save(); g.globalAlpha = 1 - seg(t, 12.3, 12.55); popPiece(g, n, tin, WE_OUT, piv, t); g.restore(); continue; }
    const dim = ['g1', 'w1', 'g2', 'w2', 'dots'].includes(n) ? 1 - .45 * silent : 1;
    g.save(); g.globalAlpha = dim; popPiece(g, n, tin, WE_OUT + (n.startsWith('phone') ? .15 : 0), piv, t); g.restore();
  }
  
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, 0, .12 + .14 * silent);
}

// ---- opening: background → envelope → envelope opens → the card rises out → grows to the approved cover → (opening)
const OPEN_SHIFT = 2.0;               // opening(local) = opening2(t − 2.0); handoff at 3.05
function coverCam(lt) { const app = 0; let vw = lerp(1672, 1520, app), cx = lerp(836, 845, app), cy = lerp(470, 462, app); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2); return { x: -(cx - vw / 2) * W / vw, y: -(cy - vh / 2) * W / vw, w: 1672 * W / vw }; }
function envelopeStage(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); const p = 1; g.drawImage(IMG.lace, W / 2 - W * p / 2, H / 2 - H * p / 2, W * p, H * p);
  goldDust(g, t);
  const EW = 760, cyE = 650, open = seg(t, 1.0, 1.3), away = eio(seg(t, 2.2, 2.75)), app = back(seg(t, .15, .7), 1.4);
  const ec = IMG.pc_env_closed, eo_ = IMG.pc_env_open, eh = EW * ec.height / ec.width, bottom = cyE + eh / 2 + away * 700;
  const drawEnv = (img, a, sc) => { const w = EW * sc, h = w * img.height / img.width; g.save(); g.globalAlpha = a * clamp(t / .35); g.shadowColor = 'rgba(80,30,60,.35)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.drawImage(img, W / 2 - w / 2, bottom - h, w, h); g.restore(); return bottom - h; };
  const sc0 = lerp(.88, 1, app);
  // the card rises out of the open envelope (clipped at the envelope's mouth while it is inside)
  const cardRise = eio(seg(t, 1.35, 2.25)), grow = eio(seg(t, 2.2, 2.8));
  const small = { w: 900, x: W / 2 - 450, y: lerp(bottom - eh * .85, cyE - 470, cardRise) };
  const fin = coverCam(t - OPEN_SHIFT), r = { x: lerp(small.x, fin.x, grow), y: lerp(small.y, fin.y, grow), w: lerp(small.w, fin.w, grow) };
  if (open < 1) drawEnv(ec, 1 - open, sc0);
  if (open > 0) {
    const top = drawEnv(eo_, open, sc0), mouth = top + (bottom - top) * .46;
    if (t > 1.35) { g.save(); if (cardRise < 1) { g.beginPath(); g.rect(0, 0, W, mouth); g.clip(); } g.shadowColor = 'rgba(60,20,40,.4)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.drawImage(CI.cover, r.x, r.y, r.w, r.w * 941 / 1672); g.restore(); }
  }
}
function memory(g, t) {          // the sweet memory: the couple paper cut (user's sheet) rises from the page, then the night falls
  const m = PIECES.couple_mem, img = IMG.pc_couple_mem; if (!m) return;
  const tin = 6.15, tout = 7.55, uin = (t - tin) / .5, uout = (t - tout) / .32; if (uin <= 0 || uout >= 1) return;
  const k = uout > 0 ? 1 - eio(uout) : back(clamp(uin), 1.6), w = 760, h = w * img.height / img.width, x = W / 2 - w / 2, y = 250, py = y + h;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, py); g.scale(1, Math.max(.02, k)); g.translate(-W / 2, -py);
  g.shadowColor = 'rgba(90,35,55,.4)'; g.shadowBlur = 22; g.shadowOffsetY = 10; g.drawImage(img, x, y, w, h); g.restore();
  const gl = Math.sin(Math.PI * clamp((t - 6.5) / 1.0)) * .35; glow(g, W / 2, y + h / 2, 420, '255,226,200', gl);
}
function opening2(g, sh, t) {
  if (t >= 3.05) { opening(g, sh, t - OPEN_SHIFT); memory(g, t); const n = ss(seg(t, 7.3, 8.2)); if (n > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = n * .55; g.fillStyle = '#5b5fa8'; g.fillRect(0, 0, W, H); g.restore(); } return; }
  envelopeStage(g, t);
  if (t > 2.8) { OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); opening(OG, sh, t - OPEN_SHIFT); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = ss(seg(t, 2.8, 3.05)); g.drawImage(OFF, 0, 0); g.globalAlpha = 1; }
}


// ------------------------------------------------------------------------------------------- light & atmosphere (restrained)
function glow(g, x, y, r, c, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function candle(g, t, x, y) {
  const f = .82 + .1 * Math.sin(t * 9.3) + .06 * Math.sin(t * 15.7 + 1) + .04 * Math.sin(t * 23.1);
  glow(g, x, y, 60 * f, '255,214,140', .55 * f); glow(g, x, y + 40, 420 * f, '255,180,110', .22 * f);
}
function twinkle(g, t, k) { const R = mulberry(3); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H * .55, a = k * Math.max(0, Math.sin(t * (1 + R() * 2) + R() * 6)) ** 6; if (a > .05) { const r = 2 + 4 * a; g.fillStyle = `rgba(255,248,225,${.8 * a})`; g.beginPath(); g.moveTo(x, y - r * 3); g.lineTo(x + r * .5, y); g.lineTo(x, y + r * 3); g.lineTo(x - r * .5, y); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x - r * 3, y); g.lineTo(x, y + r * .5); g.lineTo(x + r * 3, y); g.lineTo(x, y - r * .5); g.closePath(); g.fill(); } } g.restore(); }
function snow(g, t, k) { const R = mulberry(11); g.save(); for (let i = 0; i < 70 * k; i++) { const z = R(), x = (R() * W + Math.sin(t * .7 + i) * 26 + t * 12 * z) % W, y = (R() * H + t * (26 + z * 60)) % (H + 40) - 20; g.fillStyle = `rgba(255,255,255,${.3 + z * .45})`; g.beginPath(); g.arc(x, y, 1.2 + z * 3, 0, 7); g.fill(); } g.restore(); }
function bokeh(g, t, k) { const R = mulberry(47); g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 16 * k; i++) { const x = (R() * W + t * 6 * (R() - .5)) % W, y = R() * H * .7, r = 18 + R() * 40, a = (.05 + .07 * R()) * (.6 + .4 * Math.sin(t * (1 + R() * 2) + i)); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,210,170,${a})`); gr.addColorStop(1, 'rgba(255,210,170,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } g.restore(); }
function speed(g, t) { const R = mulberry(31); g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 14; i++) { const y = H * .45 + R() * H * .5, l = 200 + R() * 300, x = ((R() * W * 2 - t * 2200) % (W * 2) + W * 2) % (W * 2) - l; const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, 'rgba(255,235,220,0)'); gr.addColorStop(1, 'rgba(255,235,220,.22)'); g.fillStyle = gr; g.fillRect(x, y, l, 2); } g.restore(); }
function tint(g, warm, cool) {
  if (warm > 0) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = warm; g.fillStyle = '#ffb27a'; g.fillRect(0, 0, W, H); g.restore(); }
  if (cool > 0) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = cool; g.fillStyle = '#3a5a9a'; g.fillRect(0, 0, W, H); g.restore(); }
  const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(35,15,35,0)'); v.addColorStop(1, 'rgba(35,15,35,.26)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function bloomMask(u, seed) { const m = MK.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H); const R = mulberry(seed); m.fillStyle = '#000'; const e = eio(u);
  [[.02, .05], [.98, .08], [.03, .95], [.97, .93], [.5, 1.02]].forEach(([cx, cy], i) => { const d = R() * .15, r = Math.max(0, (e - d) / (1 - d)) * Math.hypot(W, H) * (.8 + R() * .25); if (r <= 0) return; m.beginPath();
    for (let k = 0; k <= 40; k++) { const an = k / 40 * Math.PI * 2, rr = r * (1 + .12 * Math.sin(an * 5 + i * 2 + seed) + .07 * Math.sin(an * 11 + i)); m.lineTo(W * cx + Math.cos(an) * rr, H * cy + Math.sin(an) * rr); } m.closePath(); m.fill(); }); return MK; }
function lyric(g, t) {
  for (const [a, b, s] of LYRICS) { if (t < a - .15 || t > b + .3) continue; const k = Math.min(ss(seg(t, a - .15, a + .2)), 1 - ss(seg(t, b, b + .3)));
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k; g.font = '600 46px Lyric'; g.textAlign = 'center'; const y = H - 60 + (1 - k) * 8;
    g.shadowColor = 'rgba(25,10,35,.8)'; g.shadowBlur = 16; g.fillStyle = '#fffcf6'; g.fillText(s, W / 2, y); g.shadowBlur = 3; g.fillText(s, W / 2, y); g.restore(); }
}

// ------------------------------------------------------------------------------------------- frame
// ---- frame: pages fall from the top edge (rigid page, perspective), lyrics on top
const OP = { opening2, map: mapShot, wechat: wechatShot, dorm: dormShot, polaroids: polShot, cake: cakeShot };
function drawShot(g, sh, t) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = '#2a1428'; g.fillRect(0, 0, W, H); if (sh.custom) OP[sh.custom](g, sh, t); else plateShot(g, sh, t); g.setTransform(1, 0, 0, 1, 0, 0); }
const FL = .38;
function pageFall(g, src, u) {
  // the new page hinges on the top edge: θ 88° (edge-on, towards the viewer) → 0° (lying on the stack)
  const th = (88 * Math.PI / 180) * (1 - eio(u)), ct = Math.cos(th), st = Math.sin(th), F = W * 2.2, cx = W / 2, cy = H * .3;
  const P = (x, y) => { const z = y * st, f = F / (F - z); return [cx + (x - cx) * f, cy + (y * ct - cy) * f]; };
  const N = 36; let last;
  for (let j = 0; j < N; j++) { const y0 = j / N * H, y1 = (j + 1) / N * H, A = P(0, y0), B = P(W, y0), C = P(0, y1), D = P(W, y1);
    ctri(g, src, [0, y0], [W, y0], [0, y1], A, B, C); ctri(g, src, [W, y0], [W, y1], [0, y1], B, D, C); last = [C, D]; }
  // shade of the turning page, its paper edge, and the shadow it throws on the page below
  const q = [P(0, 0), P(W, 0), last[1], last[0]];
  g.save(); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fillStyle = `rgba(40,20,40,${.35 * (1 - ct)})`; g.fill(); g.restore();
  g.save(); g.strokeStyle = `rgba(255,248,240,${.9 * (1 - u * .6)})`; g.lineWidth = 4 + 8 * st; g.beginPath(); g.moveTo(...last[0]); g.lineTo(...last[1]); g.stroke(); g.restore();
  const yb = Math.max(last[0][1], last[1][1]), sh = 160 * st + 30;
  const gr = g.createLinearGradient(0, yb, 0, yb + sh); gr.addColorStop(0, `rgba(40,15,35,${.42 * st + .1})`); gr.addColorStop(1, 'rgba(40,15,35,0)'); g.fillStyle = gr; g.fillRect(0, yb, W, sh);
  const bg = g.createLinearGradient(0, 0, 0, 22); bg.addColorStop(0, 'rgba(40,15,35,.35)'); bg.addColorStop(1, 'rgba(40,15,35,0)'); g.fillStyle = bg; g.fillRect(0, 0, W, 22);   // binding gutter
}
// story transitions centred on the shot boundary: 'fade' = dissolve between two whole pictures, 'bloom' = soft
// watercolour bloom, 'glow' = dissolve through warm light (into the ending). Both pictures keep running meanwhile.
const TR = { fade: .3, bloom: .42, glow: .55 };
export function frame(t) {
  const g = G; let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = SHOTS.length - 1;
  let tr = -1; for (let j = 1; j < SHOTS.length; j++) { const d = TR[SHOTS[j].in]; if (d && Math.abs(t - SHOTS[j].t0) < d) tr = j; }
  if (tr > 0) {
    const sh = SHOTS[tr], d = TR[sh.in], u = clamp((t - (sh.t0 - d)) / (2 * d));
    drawShot(g, SHOTS[tr - 1], t); drawShot(NG, sh, t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (sh.in === 'bloom') { const m = bloomMask(u, 7 + tr); NG.setTransform(1, 0, 0, 1, 0, 0); NG.globalCompositeOperation = 'destination-in'; NG.drawImage(m, 0, 0); NG.globalCompositeOperation = 'source-over'; g.drawImage(NB, 0, 0); }
    else { g.globalAlpha = ss(u); g.drawImage(NB, 0, 0); g.globalAlpha = 1; }
    if (sh.in === 'glow') { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,214,170,${.35 * Math.sin(Math.PI * u)})`; g.fillRect(0, 0, W, H); g.restore(); }
  } else drawShot(g, SHOTS[i], t);
  // no subtitles; gentle fade at the very end
  if (t > DUR - .6) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(20,10,22,${ss(seg(t, DUR - .6, DUR))})`; g.fillRect(0, 0, W, H); }
}


const CK = 2400 / 941;                                     // inner-page plate px per original px
const CTL = [97, 100], CBL = [150, 893], CTR = [1545, 22], CBR = [1640, 800];   // the card's corners (original px)
const OPEN = [1.42, 3.11], thAt = t => Math.PI * .92 * eio(seg(t, OPEN[0], OPEN[1]));
const POPS = [['bike', 691, 1515], ['couple', 512, 1015], ['plaque', 887, 1205], ['cats', 651, 568]];
const edgeX = t => CTL[0] + (CTR[0] - CTL[0]) * Math.cos(Math.min(thAt(t), Math.PI / 2));
const POPT = {}; for (const [k, , rx] of POPS) { let t = OPEN[0]; while (t < OPEN[1] && edgeX(t) > rx - 60) t += 1 / 96; POPT[k] = t - .05; }
function ctri(g, img, s0, s1, s2, d0, d1, d2) {           // exact affine mapping of one triangle of a rigid board
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const mx = (d0[0] + d1[0] + d2[0]) / 3, my = (d0[1] + d1[1] + d2[1]) / 3, gr = q => { const ex = q[0] - mx, ey = q[1] - my, l = Math.hypot(ex, ey) || 1; return [q[0] + ex / l * 1.2, q[1] + ey / l * 1.2]; };
  const q0 = gr(d0), q1 = gr(d1), q2 = gr(d2);
  g.save(); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.lineTo(...q2); g.closePath(); g.clip();
  g.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]); g.drawImage(img, 0, 0); g.restore();
}
function opening(g, sh, t) {
  // camera (original px): slow approach on the closed card, hold through the opening, then dive to the centre
  const app = 0, rel = 0;   // V4.0: fixed camera on the card
  let vw = lerp(lerp(1672, 1520, app), 1672, rel), cx = lerp(lerp(836, 845, app), 836, rel), cy = lerp(lerp(470, 462, app), 470.25, rel);
  vw = Math.min(vw, 1672); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2);
  const s = W / (vw * CK); g.setTransform(s, 0, 0, s, -(cx - vw / 2) * CK * s, -(cy - vh / 2) * CK * s);
  // the inner page lies behind the cover all along; its pop-up stands rise as the cover sweeps past them
  g.drawImage(CI.page, 0, 0);
  for (const [k, by] of POPS) { const t0 = POPT[k], h = (t < t0 ? .06 : lerp(.06, 1, back(seg(t, t0, t0 + .34), 1.7))), Y = by * CK;
    g.save(); g.translate(0, Y); g.scale(1, h); g.translate(0, -Y); g.shadowColor = `rgba(90,35,55,${.35 * h})`; g.shadowBlur = 11; g.shadowOffsetY = 4 * h; g.drawImage(CI[k], 0, 0); g.restore(); }
  const th = thAt(t), ct = Math.cos(th), st = Math.sin(th);
  if (t < OPEN[1] + .25) {
    // soft contact shadow of the card on the page, lifting with the cover
    const lift = st;
    g.save(); g.globalAlpha = .4 * (1 - lift * .7) * (1 - ss(seg(t, OPEN[1] - .1, OPEN[1] + .25))); g.filter = `brightness(0) blur(${(10 + 30 * lift) * CK / 2.55}px)`;
    g.drawImage(CI.cover, (10 + 40 * lift) * CK, (14 + 30 * lift) * CK, 1672 * CK, 941 * CK); g.restore(); g.filter = 'none';
    // the cover: ONE rigid board rotating about its left edge (perspective projection; the picture itself is never bent)
    const ax = [CBL[0] - CTL[0], CBL[1] - CTL[1]], al = Math.hypot(...ax), u = [ax[0] / al, ax[1] / al], n = [-u[1], u[0]];
    const C = [cx, cy], F = 2700;
    const proj = p => { const r = [p[0] - CTL[0], p[1] - CTL[1]], along = r[0] * u[0] + r[1] * u[1], d = r[0] * n[0] + r[1] * n[1];
      const x = CTL[0] + u[0] * along + n[0] * d * ct, y = CTL[1] + u[1] * along + n[1] * d * ct, z = d * st, f = F / (F - z); return [(C[0] + (x - C[0]) * f) * CK, (C[1] + (y - C[1]) * f) * CK]; };
    const fade = 1 - seg(t, OPEN[1], OPEN[1] + .25);
    g.save(); g.globalAlpha = fade;
    if (ct > 0) {
      const NX = 48, NY = 8;
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const x0 = i / NX * 1672, x1 = (i + 1) / NX * 1672, y0 = j / NY * 941, y1 = (j + 1) / NY * 941;
        const A = proj([x0, y0]), B = proj([x1, y0]), Cc = proj([x0, y1]), D = proj([x1, y1]);
        ctri(g, CI.cover, [x0, y0], [x1, y0], [x0, y1], A, B, Cc); ctri(g, CI.cover, [x1, y0], [x1, y1], [x0, y1], B, D, Cc);
      }
      const q = [proj(CTL), proj(CTR), proj(CBR), proj(CBL)];                // light falling off as it turns
      g.beginPath(); q.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fillStyle = `rgba(50,18,40,${.38 * (1 - ct)})`; g.fill();
      g.strokeStyle = `rgba(255,248,240,${.95 * st})`; g.lineWidth = (3 + 9 * st) * CK / 2.55; g.beginPath(); g.moveTo(...q[1]); g.lineTo(...q[2]); g.stroke();
    } else {                                                            // the plain back of the card (never a mirrored front)
      const q = [proj(CTL), proj(CTR), proj(CBR), proj(CBL)], qi = [[.03, .05], [.97, .04], [.97, .95], [.03, .96]].map(([a, b]) => proj([lerp(lerp(CTL[0], CTR[0], a), lerp(CBL[0], CBR[0], a), b), lerp(lerp(CTL[1], CTR[1], a), lerp(CBL[1], CBR[1], a), b)]));
      g.beginPath(); q.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fillStyle = '#f5e9e1'; g.fill(); g.fillStyle = `rgba(70,30,50,${.25 + .25 * -ct})`; g.fill();
      g.strokeStyle = 'rgba(205,165,110,.8)'; g.lineWidth = 3 * CK / 2.55; g.beginPath(); qi.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke();
    }
    g.restore();
    // the shadow the lifting cover throws across the page
    const sh2 = Math.sin(Math.min(th, Math.PI / 2)) * (1 - seg(t, OPEN[1] - .3, OPEN[1] + .2));
    if (sh2 > 0) { const gr = g.createLinearGradient(CTL[0] * CK, 0, edgeX(t) * CK + 300, 0); gr.addColorStop(0, `rgba(70,25,45,${.45 * sh2})`); gr.addColorStop(1, 'rgba(70,25,45,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1672 * CK, 941 * CK); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  // a soft band of light across the closed card, and glints on the opened page
  const lu = seg(t, .35, 1.3); if (lu > 0 && lu < 1) { const x = lerp(-W * .4, W * 1.4, eio(lu)), gr = g.createLinearGradient(x - 280, 0, x + 280, H * .5); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(.5, `rgba(255,248,230,${.24 * Math.sin(Math.PI * lu)})`); gr.addColorStop(1, 'rgba(255,250,235,0)'); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  goldDust(g, t);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = .1; g.fillStyle = '#ffc49a'; g.fillRect(0, 0, W, H); g.restore();
  if (t < .5) { g.fillStyle = `rgba(20,10,22,${1 - ss(t / .5)})`; g.fillRect(0, 0, W, H); }
}
function goldDust(g, t) { const R = mulberry(9); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 40; i++) { const z = R(), x = (R() * W + t * (10 + z * 30)) % W, y = (R() * H - t * (14 + z * 26) + H * 3) % H, a = (.2 + .45 * Math.max(0, Math.sin(t * (1.5 + R() * 2) + i))) * z, r = 2 + z * 5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 3); gr.addColorStop(0, `rgba(255,228,180,${a})`); gr.addColorStop(1, 'rgba(255,228,180,0)'); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); } g.restore(); }

