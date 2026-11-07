// 《把回忆拼好给你》立体纸艺动态 MV — the user's finished illustrations staged as a pop-up anniversary book.
// Rigid only: camera moves over plates, cut-out paper stickers pop up (scale/rotate about their base), the map
// route grows, polaroids fall and pile up, candle light flickers. Characters are never deformed.
// Plate coordinates: original 1672 × 941 px. Song: original DJ mix, 59.04 s, lyric times unchanged.
import { seg, ss, eio, eo, ei, clamp, lerp, mulberry, back } from '/core/lib.js';
export const DUR = 59.04;
let W, H, G, OFF, OG, MK;
const IMG = {}, CI = {}; let STK = {}, PIECES = {}, NB, NG;
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
export const SHOTS = [
  { id: 'open', t0: 0, t1: 7.11, custom: 'opening2' },
  // 1 隔着微信的争执
  { id: '1', t0: 7.11, t1: 12.79, custom: 'wechat', in: 'flip' },
  // 2 宿舍里决定来见我
  { id: '2a', t0: 12.79, t1: 14.88, p: 'act2_dorm', in: 'flip', pops: [['think', 13.3]], cam: [[12.79, 836, 470, 1672], [13.9, 836, 470, 1560], [14.88, 700, 480, 1180]], fx: { warm: .1, glowAt: [[1260, 535, 180, 13.9]] } },
  { id: '2b', t0: 14.88, t1: 16.56, p: 'act2_dorm', in: 'cut', cam: [[14.88, 830, 760, 640], [16.56, 830, 770, 470]], ease: 'in', fx: { warm: .15 } },
  // 3 济南到泰安
  { id: '3', t0: 16.56, t1: 21.455, custom: 'map', in: 'flip' },
  // 4 学校门口见面（她送他的香槟色花束）→ 商场和好
  { id: '4a', t0: 21.455, t1: 23.13, p: 'act4_gate', in: 'flip', pops: [['h1', 22.0], ['h2', 22.3]], cam: [[21.455, 836, 470, 1672], [23.13, 836, 480, 1540]], fx: { snow: .6 } },
  { id: '4b', t0: 23.13, t1: 24.05, p: 'act4_gate', in: 'cut', cam: [[23.13, 735, 650, 640], [24.05, 735, 640, 560]], fx: { snow: .5 } },
  { id: '4c', t0: 24.05, t1: 24.8, p: 'act4_gate', in: 'cut', cam: [[24.05, 655, 335, 560], [24.8, 660, 335, 500]], fx: { snow: .4 } },
  { id: '4d', t0: 24.8, t1: 27.841, p: 'act4_mall', in: 'flip', pops: [['h1', 25.47], ['h2', 25.89]], cam: [[24.8, 836, 470, 1672], [27.841, 900, 470, 1420]], fx: { bokeh: 1 } },
  // 5 2025.11.15
  { id: '5a', t0: 27.841, t1: 29.513, p: 'act5_gift', in: 'flip', cam: [[27.841, 836, 470, 1672], [29.513, 650, 640, 760]], fx: { snow: .6 } },
  { id: '5b', t0: 29.513, t1: 31.185, p: 'act5_gift', in: 'cut', cam: [[29.513, 1150, 420, 620], [31.185, 1160, 425, 540]], fx: { snow: .4, tear: [1135, 395] } },
  { id: '5c', t0: 31.185, t1: 32.439, p: 'act5_gift', in: 'cut', cam: [[31.185, 640, 330, 640], [32.439, 650, 330, 580]], fx: { snow: .4 } },
  { id: '5d', t0: 32.439, t1: 34.18, p: 'act5_gift', in: 'cut', cam: [[32.439, 836, 470, 1672], [33.2, 1150, 300, 1100], [34.18, 1300, 230, 900]], fx: { snow: .8, glowAt: [[1400, 180, 240, 33.344]] } },
  // 6 拍立得回忆
  { id: '6', t0: 34.18, t1: 48.56, custom: 'polaroids', in: 'flip' },
  // 8 一周年烛光
  { id: '8', t0: 48.56, t1: 59.04, p: 'act8_cake', in: 'flip', cam: [[48.56, 836, 470, 1672], [50.0, 830, 440, 1000], [52.9, 830, 440, 860], [54.4, 836, 470, 1672], [59.04, 836, 470, 1620]], fx: { candle: [812, 455], glowAt: [[215, 275, 200, 53.4], [1440, 470, 260, 53.9]] } },
];


// ------------------------------------------------------------------------------------------- loading
const PLATES = ['act2_dorm', 'act3_map', 'act4_gate', 'act4_mall', 'act5_gift', 'act8_cake'];
const POLS = ['study', 'night', 'city', 'weihai'];
export async function load(w, h, g) {
  W = w; H = h; G = g; const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  OFF = mk(); OG = OFF.getContext('2d'); MK = mk(); NB = mk(); NG = NB.getContext('2d');
  STK = await (await fetch('pc/cut/stickers.json')).json(); PIECES = await (await fetch('cut/pieces.json')).json();
  await Promise.all(PLATES.map(async p => {
    IMG[p] = await tryIm(`pc/up/${p}.png`, `pc/src/${p}.png`);
    if (STK[p]) { IMG[p + '_clean'] = await im(`pc/cut/${p}_clean.png`); for (const n of Object.keys(STK[p])) IMG[p + '_' + n] = await im(`pc/cut/${p}_${n}.png`); }
  }));
  for (const n of POLS) IMG['pol_' + n] = await im(`pc/cut/pol_${n}.png`);
  for (const n of Object.keys(PIECES)) IMG['pc_' + n] = await im(`cut/${n}.png`);
  IMG.lace = await im('up/bg_lace.png'); IMG.stage = await im('up/stage_plain.png');
  const L = { cover: 'anniv/obj/cover_obj.png', page: 'card/layers/inner_page.png', couple: 'card/layers/pop_couple.png', cats: 'card/layers/pop_cats.png', bike: 'card/layers/pop_bike.png', plaque: 'card/layers/pop_plaque.png' };
  await Promise.all(Object.entries(L).map(async ([k, s]) => { CI[k] = await im(s); }));
  buildPolaroids();
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
function plateShot(g, sh, t) {
  const v = view(g, ...camAt(sh.cam, t, sh.ease));
  plateDraw(g, IMG[sh.p]);
  for (const [n, tp] of sh.pops || []) lift(g, IMG[sh.p + '_' + n], STK[sh.p][n], t - tp);
  for (const [x, y, r, tg] of (sh.fx || {}).glowAt || []) glow(g, x, y, r, '255,236,205', .5 * Math.sin(Math.PI * clamp((t - tg) / 1.4)));
  const fx = sh.fx || {};
  if (fx.heart) { const [x, y, t0] = fx.heart, a = clamp((t - t0) * 2) * (.55 + .45 * Math.sin((t - t0) * 6)); glow(g, x, y, 90, `255,200,215`, .55 * a); }
  if (fx.candle) candle(g, t, ...fx.candle);
  if (fx.tear) { const a = .5 + .5 * Math.sin(t * 5.5); glow(g, fx.tear[0], fx.tear[1], 14, '255,255,255', .7 * a); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fx.stars) twinkle(g, t, 1);
  if (fx.snow) snow(g, t, fx.snow);
  if (fx.bokeh) bokeh(g, t, fx.bokeh);
  if (fx.speed) speed(g, t);
  tint(g, fx.warm || 0, fx.cool || 0);
}

// ------------------------------------------------------------------------------------------- 3 · the map
const ROUTE = [[232, 372], [244, 392], [280, 440], [320, 462], [418, 490], [557, 530], [655, 550], [780, 557], [906, 563], [1003, 557], [1060, 585], [1101, 613], [1136, 672], [1140, 694]];
const SEGL = []; let RLEN = 0; for (let i = 1; i < ROUTE.length; i++) { const l = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]); SEGL.push(l); RLEN += l; }
function along(d) { for (let i = 0; i < SEGL.length; i++) { if (d <= SEGL[i] || i === SEGL.length - 1) { const u = clamp(d / SEGL[i]); return [lerp(ROUTE[i][0], ROUTE[i + 1][0], u), lerp(ROUTE[i][1], ROUTE[i + 1][1], u), Math.atan2(ROUTE[i + 1][1] - ROUTE[i][1], ROUTE[i + 1][0] - ROUTE[i][0])]; } d -= SEGL[i]; } }
function mapShot(g, sh, t) {
  const u = eio(seg(t, 17.0, 20.55)), d = u * RLEN, [mx, my] = along(d);
  // camera: Jinan close → follow the bike → pull back to the whole route arriving at Taian
  const intro = eio(seg(t, 16.56, 17.3)), outro = eio(seg(t, 20.3, 21.2));
  let cx = lerp(lerp(560, mx + 120, intro), 836, outro), cy = lerp(lerp(420, my - 60, intro), 470, outro), vw = lerp(lerp(1300, 1000, intro), 1672, outro);
  view(g, cx, cy, vw); plateDraw(g, IMG.act3_map_clean);
  // the dashed route grows behind the bike
  g.save(); g.strokeStyle = '#ec5b6b'; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([18, 15]); g.beginPath();
  let acc = 0; g.moveTo(...ROUTE[0]);
  for (let i = 0; i < SEGL.length; i++) { if (acc + SEGL[i] >= d) { const q = along(d); g.lineTo(q[0], q[1]); break; } g.lineTo(...ROUTE[i + 1]); acc += SEGL[i]; }
  g.stroke(); g.restore();
  const M = STK.act3_map;
  // Jinan / Taian pins pulse as the trip starts / ends
  glow(g, 232, 330, 60, '255,170,180', .5 * Math.sin(Math.PI * seg(t, 16.9, 17.6)));
  glow(g, 1142, 645, 70, '255,170,180', .6 * Math.sin(Math.PI * seg(t, 20.5, 21.3)));
  // the bike sticker rides the route (rigid: translate + tiny bob; its base sits on the line)
  const m = M.moto, sc = .58, bob = Math.sin(t * 16) * 1.2, pop = .4 + .6 * back(seg(t, 16.75, 17.15), 1.6);
  g.save(); g.translate(mx, my + bob); g.scale(sc * pop, sc * pop); g.translate(-m.px, -m.py);
  g.shadowColor = 'rgba(70,30,40,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 8; g.drawImage(IMG.act3_map_moto, m.x, m.y, m.w, m.h); g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .06, 0);
}

// ------------------------------------------------------------------------------------------- 6 · polaroids pile up
// ---- 6 · polaroids: each one an independent object (the user's RGBA polaroid sheet + 4 earlier memories)
let PILE = [];
function buildPolaroids() {
  const order = ['pol00', 'pol10', 'pol03', 'pol12', 'pol13', 'pol20', 'pol21', 'pol02', 'pol11', 'pol01', 'old_study', 'pol22', 'old_weihai', 'old_night', 'pol23', 'old_city'];
  const R = mulberry(23); let t = 34.6, gap = 1.12;
  PILE = order.map((n, i) => {
    const old = n.startsWith('old_'), img = old ? IMG['pol_' + n.slice(4)] : IMG['pc_' + n];
    const ang = i * 2.39996 + R() * .4, rad = 90 + i * 64 + R() * 50;
    const p = { img, old, t0: t, x: 960 + Math.cos(ang) * rad * 1.5, y: 540 + Math.sin(ang) * rad * .85, rot: (R() - .5) * 16, w: (old ? 470 : 560) + R() * 60 };
    t += gap; gap = Math.max(.34, gap * .86); return p;
  });
}
function polShot(g, sh, t) {
  // the page: the user's plain pop-up stage, softly out of focus under the pile
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(6px) brightness(.92)'; g.drawImage(IMG.stage, -40, -24, W + 80, H + 48); g.filter = 'none';
  const zoom = lerp(1.25, 1.0, eio(seg(t, 34.18, 47.3))) * lerp(1, .9, eio(seg(t, 47.3, 48.3)));
  g.setTransform(zoom, 0, 0, zoom, W / 2 - 960 * zoom, H / 2 - 540 * zoom);
  for (const p of PILE) {
    const u = (t - p.t0) / .55; if (u <= 0) continue; const e = clamp(u), land = back(e, 1.25);
    const sc = lerp(1.2, 1, land), dy = lerp(-220, 0, eo(e)), rot = p.rot + (1 - eo(e)) * 8, lift = 1 - e, h = p.w * p.img.height / p.img.width;
    g.save(); g.translate(p.x, p.y + dy); g.rotate(rot * Math.PI / 180); g.scale(sc, sc); g.globalAlpha = clamp(u * 6);
    g.shadowColor = `rgba(45,20,40,${.3 + .15 * lift})`; g.shadowBlur = 14 + 30 * lift; g.shadowOffsetX = 6 + 18 * lift; g.shadowOffsetY = 10 + 30 * lift;
    if (p.old) { g.fillStyle = '#fdfaf4'; g.fillRect(-p.w / 2 - 10, -h / 2 - 10, p.w + 20, h + 20); g.shadowColor = 'transparent'; }
    g.drawImage(p.img, -p.w / 2, -h / 2, p.w, h); g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0); tint(g, .06, 0);
}

// ---- 1 · the WeChat quarrel: the user's RGBA WeChat sheet staged as a pop-up page (sheet coords → screen)
const WE = [  // [piece, in, scale-from pivot ('b' bottom / 'c' centre)]
  ['phoneL', 7.45, 'b'], ['phoneR', 7.86, 'b'], ['heartline', 8.32, 'c'],
  ['g1', 8.74, 'c'], ['w1', 9.16, 'c'], ['g2', 9.58, 'c'], ['w2', 10.0, 'c'], ['dots', 10.42, 'c'],
  ['broken', 11.05, 'c'], ['scribble', 11.26, 'c'], ['note', 7.66, 'b'],
];
const WE_OUT = 12.05;
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
  const st = IMG.pc_night_stage, sc = Math.max(W / st.width, H / st.height) * 1.08, push = 1 + .03 * seg(t, 7.11, 12.79);
  g.filter = 'blur(5px) brightness(.8) saturate(1.1)'; g.drawImage(st, W / 2 - st.width * sc * push / 2, H / 2 - st.height * sc * push / 2, st.width * sc * push, st.height * sc * push); g.filter = 'none';
  twinkle(g, t, 1);
  const silent = seg(t, 11.5, 11.9);
  for (const [n, tin, piv] of WE) {
    if (n === 'heartline' && t > 11.0) { g.save(); g.globalAlpha = 1 - seg(t, 11.0, 11.2); popPiece(g, n, tin, WE_OUT, piv, t); g.restore(); continue; }
    const dim = ['g1', 'w1', 'g2', 'w2', 'dots'].includes(n) ? 1 - .45 * silent : 1;
    g.save(); g.globalAlpha = dim; popPiece(g, n, tin, WE_OUT + (n.startsWith('phone') ? .15 : 0), piv, t); g.restore();
  }
  if (t > 11.05 && t < 11.45) { const s = Math.sin((t - 11.05) * 60) * 5 * (1 - seg(t, 11.05, 11.45)); g.translate(s, 0); }
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
function opening2(g, sh, t) {
  if (t >= 3.05) return opening(g, sh, t - OPEN_SHIFT);
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
const OP = { opening2, map: mapShot, polaroids: polShot, wechat: wechatShot };
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
  lyric(g, t);
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
  const app = eio(seg(t, 0, 1.6)), dive = eio(seg(t, 3.4, 5.271));
  let vw = lerp(lerp(1672, 1520, app), 640, dive), cx = lerp(lerp(836, 845, app), 790, dive), cy = lerp(lerp(470, 462, app), 330, dive);
  vw = Math.min(vw, 1672); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2);
  const s = W / (vw * CK); g.setTransform(s, 0, 0, s, -(cx - vw / 2) * CK * s, -(cy - vh / 2) * CK * s);
  // the inner page lies behind the cover all along; its pop-up stands rise as the cover sweeps past them
  g.drawImage(CI.page, 0, 0);
  for (const [k, by] of POPS) { const t0 = POPT[k], h = t < t0 ? .06 : lerp(.06, 1, back(seg(t, t0, t0 + .34), 1.7)), Y = by * CK;
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

