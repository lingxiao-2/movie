// 《把回忆拼好给你》立体纸艺动态 MV — the user's finished illustrations staged as a pop-up anniversary book.
// Rigid only: camera moves over plates, cut-out paper stickers pop up (scale/rotate about their base), the map
// route grows, polaroids fall and pile up, candle light flickers. Characters are never deformed.
// Plate coordinates: original 1672 × 941 px. Song: original DJ mix, 59.04 s, lyric times unchanged.
import { seg, ss, eio, eo, ei, clamp, lerp, mulberry, back } from '/core/lib.js';
export const DUR = 31.4;   // this cut: opening → end of act 4
let W, H, G, OFF, OG, MK;
const IMG = {}, CI = {}; let STK = {}, PIECES = {}, LIFT = {}, NB, NG;
const im = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + s)); i.src = s; });
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
export const SHOTS = [
  { id: 'open', t0: 0, t1: 8.2, custom: 'opening2' },
  { id: '1', t0: 8.2, t1: 15.2, custom: 'wechat', in: 'flip' },
  { id: '2', t0: 15.2, t1: 18.9, p: 'act2_dorm', plate: 'cl_dorm', in: 'flip', lifts: [['act2_dorm', 'think', 15.75], ['lift', 'helmet', 17.25]], fx: { warm: .08 } },
  { id: '3a', t0: 18.9, t1: 21.2, p: 'act3_ride', in: 'flip', lifts: [['act3_ride', 'think', 19.45]], fx: { ride: 1 } },
  { id: '3b', t0: 21.2, t1: 25.2, custom: 'map', in: 'flip' },
  { id: '4a', t0: 25.2, t1: 28.0, p: 'act4_gate', in: 'flip', lifts: [['act4_gate', 'h1', 25.75], ['act4_gate', 'h2', 26.15], ['act4_gate', 'marks', 26.6]], fx: { snow: .5 } },
  { id: '4b', t0: 28.0, t1: 31.4, p: 'act4_mall', in: 'flip', lifts: [['act4_mall', 'h1', 28.6], ['act4_mall', 'h2', 29.0]], fx: { bokeh: .8 } },
];

// ------------------------------------------------------------------------------------------- loading
const PLATES = ['act2_dorm', 'act3_ride', 'act3_map', 'act4_gate', 'act4_mall', 'act5_gift', 'act8_cake'];
const POLS = ['study', 'night', 'city', 'weihai'];
export async function load(w, h, g) {
  W = w; H = h; G = g; const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  OFF = mk(); OG = OFF.getContext('2d'); MK = mk(); NB = mk(); NG = NB.getContext('2d');
  STK = await (await fetch('pc/cut/stickers.json')).json(); PIECES = await (await fetch('cut/pieces.json')).json();
  await Promise.all(PLATES.map(async p => {
    IMG[p] = await tryIm(`pc/up/${p}.png`, `pc/src/${p}.png`);
    if (STK[p]) { IMG[p + '_clean'] = await im(`pc/cut/${p}_clean.png`); for (const n of Object.keys(STK[p])) IMG[p + '_' + n] = await im(`pc/cut/${p}_${n}.png`); }
  }));
  for (const n of Object.keys(PIECES)) IMG['pc_' + n] = await im(`cut/${n}.png`);
  IMG.lace = await im('up/bg_lace.png'); IMG.cl_dorm = await im('cut/act2_dorm_clean2.png'); IMG.cl_map = await im('cut/act3_map_clean2.png');
  LIFT = await (await fetch('cut/lift.json')).json(); for (const pn of Object.keys(LIFT)) for (const n of Object.keys(LIFT[pn])) IMG[`lift_${n}`] = await im(`cut/lift_${pn}_${n}.png`);
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
  if (fx.ride) rideFx(g, t);
  for (const [src, n, tin] of sh.lifts || []) { const m = src === 'lift' ? LIFT.act2_dorm[n] : STK[src][n], img = src === 'lift' ? IMG['lift_' + n] : IMG[src + '_' + n]; liftRet(g, img, m, t - tin, sh.t1 - .45 - tin); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fx.snow) snow(g, t, fx.snow);
  if (fx.bokeh) bokeh(g, t, fx.bokeh);
  tint(g, fx.warm || 0, fx.cool || 0);
}
// the ride page: street lamps pulse, warm light streams along the road, paper petals blow past (camera fixed)
function rideFx(g, t) {
  for (const [x, y, ph] of [[505, 117, 0], [1585, 333, 1.3], [1300, 405, 2.1]]) glow(g, x, y, 110, '255,214,150', .28 + .1 * Math.sin(t * 3 + ph));
  g.save(); g.globalCompositeOperation = 'screen'; const R = mulberry(5);
  for (let i = 0; i < 9; i++) { const y = 610 + R() * 180, l = 120 + R() * 160, x = ((R() * 2000 - t * 900) % 2000 + 2000) % 2000 - 200; const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, 'rgba(255,225,180,0)'); gr.addColorStop(1, 'rgba(255,225,180,.28)'); g.fillStyle = gr; g.fillRect(x, y, l, 2.5); }
  g.restore();
  const P = mulberry(8); g.save();
  for (let i = 0; i < 10; i++) { const z = .5 + P() * .6, x = ((P() * 1900 - t * 420 * z) % 1900 + 1900) % 1900 - 100, y = 500 + P() * 420 + Math.sin(t * 2 + i) * 20;
    g.save(); g.translate(x, y); g.rotate(t * 2 * z + i); g.scale(1, .55 + .45 * Math.sin(t * 3 + i)); g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(0, 0, 11 * z, 7 * z, 0, 0, 7); g.fill(); g.fillStyle = '#ffc3d0'; g.beginPath(); g.ellipse(0, 0, 9 * z, 5.5 * z, 0, 0, 7); g.fill(); g.restore(); }
  g.restore();
}

// ------------------------------------------------------------------------------------------- 3 · the map
const ROUTE = [[232, 372], [244, 392], [280, 440], [320, 462], [418, 490], [557, 530], [655, 550], [780, 557], [906, 563], [1003, 557], [1060, 585], [1101, 613], [1136, 672], [1140, 694]];
const SEGL = []; let RLEN = 0; for (let i = 1; i < ROUTE.length; i++) { const l = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]); SEGL.push(l); RLEN += l; }
function along(d) { for (let i = 0; i < SEGL.length; i++) { if (d <= SEGL[i] || i === SEGL.length - 1) { const u = clamp(d / SEGL[i]); return [lerp(ROUTE[i][0], ROUTE[i + 1][0], u), lerp(ROUTE[i][1], ROUTE[i + 1][1], u), Math.atan2(ROUTE[i + 1][1] - ROUTE[i][1], ROUTE[i + 1][0] - ROUTE[i][0])]; } d -= SEGL[i]; } }
function mapShot(g, sh, t) {
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
function coverCam(lt) { const app = eio(seg(lt, 0, 1.6)); let vw = lerp(1672, 1520, app), cx = lerp(836, 845, app), cy = lerp(470, 462, app); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2); return { x: -(cx - vw / 2) * W / vw, y: -(cy - vh / 2) * W / vw, w: 1672 * W / vw }; }
function envelopeStage(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); const p = 1 + .03 * seg(t, 0, 3); g.drawImage(IMG.lace, W / 2 - W * p / 2, H / 2 - H * p / 2, W * p, H * p);
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
const OP = { opening2, map: mapShot, wechat: wechatShot };
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
export function frame(t) {
  const g = G; let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = SHOTS.length - 1;
  let fi = -1; for (let j = 1; j < SHOTS.length; j++) if (SHOTS[j].in === 'flip' && Math.abs(t - SHOTS[j].t0) < FL) fi = j;
  if (fi > 0) {
    const u = (t - (SHOTS[fi].t0 - FL)) / (2 * FL);
    drawShot(g, SHOTS[fi - 1], Math.min(t, SHOTS[fi].t0 - 1e-3));
    drawShot(NG, SHOTS[fi], Math.max(t, SHOTS[fi].t0));
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(30,12,30,${.25 * Math.sin(Math.PI * u)})`; g.fillRect(0, 0, W, H);
    pageFall(g, NB, u);
  } else drawShot(g, SHOTS[i], t);
  // lyrics intentionally not drawn (no subtitles)
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
  const app = eio(seg(t, 0, 1.6)), rel = eio(seg(t, 3.25, 4.1));
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
    g.save(); g.globalAlpha = .4 * (1 - lift * .7); g.filter = `brightness(0) blur(${(10 + 30 * lift) * CK / 2.55}px)`;
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

