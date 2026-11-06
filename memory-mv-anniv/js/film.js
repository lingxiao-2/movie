// 《把回忆拼好给你》Motion Comic — camera language over the user's illustrations (no character deformation).
// Every shot = one framing of an act plate (wide / medium / close-up / insert), keyed camera, optional fg/bg
// parallax with depth of field (rigid layers only), environment FX, and a beat-cut transition.
// Coordinates are ORIGINAL plate px (1672 × 941); plates are 2400 px tall (k = 2400 / 941).
import { seg, ss, eio, eo, ei, clamp, lerp, mulberry, back } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
export const T0 = Q.get('t0') ? +Q.get('t0') : 0, T1 = Q.get('t1') ? +Q.get('t1') : 59.04;
export const DUR = T1 - T0;
let W, H, G, OFF, OG, BUF, BG;
const PL = {};
const SRC = { act7: { k: 4, w: 1672, h: 494 }, act8: { k: 4, w: 1672, h: 435 } };
const geo = s => SRC[s] || { k: 2400 / 941, w: 1672, h: 941 };
let K = 2400 / 941, GW = 1672, GH = 941;

// ------------------------------------------------------------------ shots (film seconds; cuts on the beat grid, 0.418 s)
export const SHOTS = [
  { id: 'open', t0: 0, t1: 5.271, s: 'custom', custom: 'opening', cam: [[0, 836, 470, 1672]], in: 'cut', why: '一周年纪念贺卡：靠近 → 封面整体翻开 → 立体内页 → 推进中央' },
  { id: '1a', t0: 5.271, t1: 6.943, s: 'act1', split: 1, cam: [[5.271, 836, 470, 1672], [6.943, 836, 476, 1540]], bgBlur: 1, night: 1, dots: 1, cool: .3, in: 'brush', why: '两人卧室全景：同一个夜晚，被一道裂缝隔开' },
  { id: '1b', t0: 6.943, t1: 8.197, s: 'act1', split: 1, cam: [[6.943, 470, 450, 700], [8.197, 485, 452, 610]], bgBlur: 6, night: 1, dots: 1, cool: .3, in: 'cut', why: '男主托腮看手机，眼镜后的眼神' },
  { id: '1d', t0: 8.197, t1: 9.451, s: 'act1', split: 1, cam: [[8.197, 1170, 470, 720], [9.451, 1215, 482, 640]], bgBlur: 6, night: 1, dots: 1, cool: .35, in: 'cut', why: '女主含泪低头看手机，沉默' },
  { id: '2a', t0: 9.451, t1: 11.123, s: 'act2', split: 1, cam: [[9.451, 285, 255, 780], [11.123, 300, 265, 720]], bgBlur: 2, cool: .15, in: 'brush', why: '回忆画面与独白「隔着屏幕，好像怎么都说不清楚……」' },
  { id: '2c', t0: 11.123, t1: 12.794, s: 'act2', split: 1, cam: [[11.123, 1000, 330, 1120], [12.794, 1010, 345, 1020]], bgBlur: 3, warm: .25, in: 'cut', why: '他闭眼微笑：「或许，见一面，一切就都能解决了。」' },
  { id: '2d', t0: 12.794, t1: 14.047, s: 'act2', split: 1, cam: [[12.794, 1090, 760, 560], [14.047, 1230, 600, 1060]], ease: 'in', bgBlur: 2, warm: .3, in: 'cut', why: '白色头盔特写，拉开露出红色摩托——出发' },
  { id: '3-0', t0: 14.047, t1: 15.719, s: 'act3', split: 1, cam: [[14.047, 836, 470, 1672], [15.719, 900, 470, 1500]], para: 60, bgBlur: 1.5, streaks: .8, petals: 1, in: 'flash', why: '全景：手写「这一次，我不想再隔着屏幕，我要亲自去见你。」' },
  { id: '3a', t0: 15.719, t1: 17.39, s: 'act3', split: 1, cam: [[15.719, 470, 690, 560], [17.39, 760, 690, 500]], bgBlur: 7, streaks: 1.0, in: 'cut', why: '球鞋、排气管、车轮跟拍' },
  { id: '3b', t0: 17.39, t1: 19.06, s: 'act3', split: 1, cam: [[17.39, 785, 222, 360], [19.06, 800, 218, 310]], bgBlur: 11, streaks: .6, in: 'cut', bokeh: 1, why: '头盔面罩里的眼神' },
  { id: '3c', t0: 19.06, t1: 20.6, s: 'act3', split: 1, cam: [[19.06, 760, 470, 1672], [20.6, 880, 470, 1480]], para: 70, bgBlur: 1.5, streaks: .8, in: 'whip', petals: 1, why: '甩镜：全景视差' },
  { id: '3d', t0: 20.6, t1: 21.455, s: 'act3', split: 1, cam: [[20.6, 930, 455, 620], [21.455, 1045, 515, 330]], ease: 'in', bgBlur: 6, streaks: 1.4, in: 'cut', flare: [1045, 527], why: '冲向车灯' },
  { id: '4a', t0: 21.455, t1: 23.13, s: 'act4', split: 1, cam: [[21.455, 836, 470, 1672], [23.13, 836, 478, 1460]], focus: [21.455, 22.35, 16], in: 'light', mallLights: 1, why: '车灯光化开成商场全景，焦点由虚到实' },
  { id: '4b', t0: 23.13, t1: 24.38, s: 'act4', split: 1, cam: [[23.13, 600, 430, 700], [24.38, 625, 425, 610]], bgBlur: 7, in: 'cut', mallLights: .5, why: '男主侧脸，把话说清楚' },
  { id: '4c', t0: 24.38, t1: 25.6, s: 'act4', split: 1, cam: [[24.38, 1110, 445, 640], [25.6, 1118, 448, 560]], bgBlur: 7, in: 'cut', tear: [1146, 456], mallLights: .5, why: '女主眼睛与泪光' },
  { id: '4d', t0: 25.6, t1: 27.841, s: 'act4', split: 1, cam: [[25.6, 870, 440, 1220], [27.841, 860, 452, 1100]], bgBlur: 3, in: 'cut', mallLights: 1, warm: .2, why: '双人对视：话说开了' },
  { id: '5a', t0: 27.841, t1: 29.095, s: 'act5', split: 1, cam: [[27.841, 470, 470, 860], [29.095, 500, 440, 760]], bgBlur: 4, snow: 1, in: 'flash', why: '28 秒鼓点：冬夜灯下，他抱着花和围巾（只取男主一侧，女主不入画）' },
  { id: '5b', t0: 29.095, t1: 30.767, s: 'act5A', cam: [[29.095, 836, 470, 1672], [30.767, 800, 488, 1420]], snow: 1, in: 'cut', why: '补图 A：他把粉玫瑰和白围巾递向她' },
  { id: '5c', t0: 30.767, t1: 31.672, s: 'act5A', cam: [[30.767, 1255, 375, 560], [31.672, 1262, 378, 500]], snow: .6, tear: [1290, 418], in: 'cut', fireworks: [], why: '她捂嘴含泪的眼睛特写' },
  { id: '5d', t0: 31.672, t1: 32.508, s: 'act5B', cam: [[31.672, 930, 640, 600], [32.508, 925, 605, 540]], snow: .6, in: 'cut', fireworks: [[31.672, .78, .2, '255,226,170']], why: '花束特写——花已经在她怀里' },
  { id: '5e', t0: 32.508, t1: 33.762, s: 'act5B', cam: [[32.508, 836, 470, 1672], [33.762, 860, 470, 1460]], snow: 1, in: 'cut', fireworks: [[32.508, .2, .18, '255,206,220'], [33.344, .5, .14, '255,226,170']], why: '补图 B：她抱着花，含泪微笑' },
  { id: '5f', t0: 33.762, t1: 34.598, s: 'act5B', cam: [[33.762, 830, 330, 900], [34.598, 835, 332, 820]], snow: .6, tear: [1128, 372], in: 'cut', why: '两人对视的温柔双人近景' },
  { id: '5g', t0: 34.598, t1: 36.619, s: 'act5B', cam: [[34.598, 836, 450, 1500], [36.619, 836, 450, 1440]], focus: [34.598, 34.6, 10], snow: 1, date: [34.6, 36.619], in: 'cut', why: '纪念日 2025.11.15' },
  { id: '6m1', t0: 36.619, t1: 39.13, s: 'custom', custom: 'memo', memo: 0, cam: [[36.619, 0, 0, 0]], in: 'brush', why: '回忆一：他从家里赶来给我送药' },
  { id: '6m2', t0: 39.13, t1: 42.469, s: 'custom', custom: 'memo', memo: 1, cam: [[39.13, 0, 0, 0]], in: 'brush', why: '回忆二：他不吃烤冷面，却专门去夜市买来送到楼下' },
  { id: '6b', t0: 42.469, t1: 43.305, s: 'act6', cam: [[42.469, 852, 196, 485], [43.305, 862, 190, 445]], in: 'brush', why: '一起吃火锅' },
  { id: '6c', t0: 43.305, t1: 44.141, s: 'act6', cam: [[43.305, 1395, 186, 470], [44.141, 1405, 186, 440]], snow: .4, in: 'flash', why: '他为她拍照' },
  { id: '6d', t0: 44.141, t1: 44.977, s: 'act6', cam: [[44.141, 772, 735, 515], [44.977, 766, 730, 470]], in: 'flash', why: '一起看电影，靠在肩上' },
  { id: '6e', t0: 44.977, t1: 46.115, s: 'act6', cam: [[44.977, 335, 236, 460], [46.115, 342, 240, 430]], in: 'flash', why: '亲吻脸颊' },
  { id: '7a', t0: 46.115, t1: 47.787, s: 'act7', split: 1, cam: [[46.115, 640, 250, 640], [47.787, 670, 255, 590]], bgBlur: 2, in: 'light', why: '旅行自拍特写，两张笑脸' },
  { id: '7c', t0: 47.787, t1: 49.459, s: 'act7', split: 1, cam: [[47.787, 1090, 250, 860], [49.459, 1240, 247, 878]], in: 'cut', sea: [255, 470], gulls: 1, why: '「画中画」双手相框、灯塔与海' },
  { id: '7d', t0: 49.459, t1: 51.27, s: 'act7', split: 1, cam: [[49.459, 1300, 247, 878], [51.27, 900, 247, 878]], in: 'cut', sea: [255, 470], gulls: 1, why: '横移回两人，蓝色海面铺满画面' },
  { id: '8a', t0: 51.27, t1: 53.36, s: 'act8', split: 1, cam: [[51.27, 585, 360, 430], [53.36, 595, 352, 470]], bgBlur: 3, in: 'brush', sea: [268, 436], warm: .15, why: '牵着的手' },
  { id: '8b', t0: 53.36, t1: 55.45, s: 'act8', split: 1, cam: [[53.36, 640, 250, 620], [55.45, 650, 238, 700]], bgBlur: 1, in: 'cut', sea: [268, 436], warm: .2, why: '背影，她的长发随风' },
  { id: '8c', t0: 55.45, t1: 59.04, s: 'act8', split: 1, cam: [[55.45, 660, 225, 700], [59.04, 664, 218, 775]], in: 'cut', sea: [268, 436], ending: 1, warm: .25, why: '拉远到夕阳与海面：「我们的故事，未来再续……」' },
];
export const LYRICS = [
  [1.56, 4.62, '我们都是渺小真实存在'], [4.70, 7.96, '祈愿小世界里不只有挫败'], [8.32, 11.44, '直到遇见你我以为就光明起来'],
  [11.80, 14.82, '眼睛里看到的都是广袤无垠的大海'], [15.60, 18.66, '有你在的日子不可能被取代'], [19.02, 22.04, '在最灰暗的日子你陪着我发呆'],
  [22.52, 24.98, '你让我学会如何拨开阴霾'], [25.42, 28.00, '将快乐全都收集将不开心全都淘汰'], [28.98, 31.40, '你对我说的情话'],
  [31.50, 34.60, '像转瞬即逝的烟花'], [35.66, 38.30, '只停在绽放一刹那'], [38.46, 41.40, '我却已无法自拔'],
  [42.58, 44.60, '我们的爱总有时差'], [44.64, 48.10, '也为你骗自己放下'], [48.56, 53.20, '爱炙热的你，却忘了爱自己'],
];

// ------------------------------------------------------------------ loading
const im = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
export async function load(w, h, g) {
  W = w; H = h; G = g;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  OFF = mk(); OG = OFF.getContext('2d'); BUF = mk();
  await loadCustom();
  const need = new Set(SHOTS.filter(s => s.t1 > T0 && s.t0 < T1 && s.s !== 'custom').map(s => s.s));
  if (SHOTS.some(s => s.custom === 'memo' && s.t1 > T0 && s.t0 < T1)) need.add('act6');
  await Promise.all([...need].map(async s => {
    if (s.startsWith('act5') && s.length > 4) { PL[s] = { plate: await im(`plates/${s}.png`) }; return; }
    if (s === 'act6') { PL[s] = { plate: await im('assets/up/act6.png') }; return; }
    const bgp = ['act7', 'act8'].includes(s) ? `plates/${s}_bg.png` : `assets/layers/${s}_bg.png`;
    PL[s] = { bg: await im(bgp), fg: await im(`assets/layers/${s}_fg.png`) };
  }));
  BG = mk(); const b = BG.getContext('2d'), R = mulberry(5), d = b.createImageData(W, H);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (R() - .5) * 38; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  b.putImageData(d, 0, 0);   // grain tile
}

// ------------------------------------------------------------------ camera
const EASE = { io: eio, in: u => ei(u) * .6 + u * .4, out: eo, lin: u => u };
function cam(sh, t) {
  const Kf = sh.cam, e = EASE[sh.ease || 'io'];
  if (t <= Kf[0][0]) return Kf[0].slice(1); if (t >= Kf[Kf.length - 1][0]) return Kf[Kf.length - 1].slice(1);
  let i = 0; while (t > Kf[i + 1][0]) i++; const a = Kf[i], b = Kf[i + 1], u = e((t - a[0]) / (b[0] - a[0]));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
}
function view(cx, cy, vw) { vw = Math.min(vw, GW, GH * 16 / 9); const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, GW - vw / 2); cy = clamp(cy, vh / 2, GH - vh / 2); return { x: (cx - vw / 2) * K, y: (cy - vh / 2) * K, w: vw * K, h: vh * K }; }
const toS = (v, x, y) => [(x * K - v.x) / v.w * W, (y * K - v.y) / v.h * H];

// ------------------------------------------------------------------ drawing one shot into ctx g
function drawShot(g, sh, t) {
  if (sh.custom) { CUSTOM[sh.custom](g, sh, t); return; }
  const P = PL[sh.s]; ({ k: K, w: GW, h: GH } = geo(sh.s)); const [cx, cy, vw] = cam(sh, t); const v = view(cx, cy, vw);
  const u = (t - sh.t0) / (sh.t1 - sh.t0);
  let focusBlur = 0; if (sh.focus) focusBlur = sh.focus[2] * (1 - ss(seg(t, sh.focus[0], sh.focus[1])));
  if (!sh.split) {
    g.filter = focusBlur > .3 ? `blur(${focusBlur}px)` : 'none'; g.drawImage(P.plate, v.x, v.y, v.w, v.h, 0, 0, W, H); g.filter = 'none';
    fxAll(g, sh, t, v); return v;
  }
  // background: lags the camera a little (parallax) and sits out of focus
  const para = (sh.para || 0) * (u - .5) * K, bb = (sh.bgBlur || 0) * (W / 1920) + focusBlur;
  g.filter = bb > .3 ? `blur(${bb}px)` : 'none';
  const pad = 30 * K; g.drawImage(P.bg, v.x - para - pad, v.y - pad, v.w + pad * 2, v.h + pad * 2, -pad / v.w * W, -pad / v.h * H, W + pad * 2 / v.w * W, H + pad * 2 / v.h * H);
  g.filter = 'none';
  if (sh.streaks) streaks(g, t, sh.streaks, false);
  if (sh.bokeh) bokeh(g, t, 1);
  if (sh.mallLights) bokeh(g, t, sh.mallLights, true);
  g.filter = focusBlur > .3 ? `blur(${focusBlur}px)` : 'none';
  g.drawImage(P.fg, v.x, v.y, v.w, v.h, 0, 0, W, H); g.filter = 'none';
  if (sh.streaks) streaks(g, t, sh.streaks * .5, true);
  fxAll(g, sh, t, v);
  return v;
}

function fxAll(g, sh, t, v) {
  if (sh.petals) petals(g, t);
  if (sh.snow) snow(g, t, sh.snow);
  if (sh.tear) tear(g, v, sh.tear, t);
  if (sh.flare) flare(g, v, sh.flare, seg(t, sh.t0, sh.t1));
  if (sh.night) nightRoom(g, v, t);
  if (sh.dots) dotsFade(g, v, t);
  if (sh.sea) sea(g, v, sh.sea, t);
  if (sh.gulls) gulls(g, t - sh.t0);
  if (sh.fireworks) fireworks(g, t, sh.fireworks);
  if (sh.warm) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = sh.warm * ss(seg(t, sh.t0, sh.t1)); g.fillStyle = '#ffb070'; g.fillRect(0, 0, W, H); g.restore(); }
  if (sh.cool) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = sh.cool; g.fillStyle = '#3a5a9a'; g.fillRect(0, 0, W, H); g.restore(); }
}
// ------------------------------------------------------------------ environment FX (never touching the characters' shapes)
function streaks(g, t, k, front) {
  const R = mulberry(front ? 91 : 31); g.save(); g.globalCompositeOperation = 'lighter';
  const n = front ? 8 : 26;
  for (let i = 0; i < n; i++) {
    const y = R() * H, l = (front ? 500 : 220) + R() * 420, sp = (front ? 4200 : 2600) * (.7 + R() * .6), x = ((R() * W * 2 - t * sp) % (W * 2) + W * 2) % (W * 2) - l;
    const a = (front ? .22 : .3) * k * (.5 + R() * .5), col = R() < .5 ? '255,214,170' : '220,200,255';
    const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.85, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x, y, l, front ? 3 : 2 + R() * 3);
  }
  g.restore();
}
function bokeh(g, t, k, warm) {
  const R = mulberry(warm ? 47 : 23); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26 * k; i++) {
    const x = (R() * W + t * (warm ? 6 : -60) * (R() + .3)) % W, y = R() * H * .85, r = 14 + R() * 46;
    const a = (.05 + .09 * R()) * (.55 + .45 * Math.sin(t * (1 + R() * 2.5) + i * 1.7));
    const c = warm ? (R() < .6 ? '255,206,150' : '255,180,200') : (R() < .5 ? '255,220,170' : '190,200,255');
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.7, `rgba(${c},${a * .7})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
}
function petals(g, t) {
  const R = mulberry(61); g.save();
  for (let i = 0; i < 18; i++) {
    const z = .5 + R() * .8, x = ((R() * (W + 300) - t * 900 * z) % (W + 300) + W + 300) % (W + 300) - 150, y = (R() * H + t * 60 * z) % H;
    g.save(); g.translate(x, y); g.rotate(t * 3 * z + i); g.scale(1, .5 + .5 * Math.sin(t * 4 + i));
    g.fillStyle = `rgba(255,${196 + (R() * 30 | 0)},${214 + (R() * 20 | 0)},${.8 * z})`; g.beginPath(); g.ellipse(0, 0, 13 * z, 8 * z, 0, 0, 7); g.fill(); g.restore();
  }
  g.restore();
}
function tear(g, v, [x, y], t) {
  const [sx, sy] = toS(v, x, y), a = .5 + .5 * Math.sin(t * 5.5), r = 10 + 8 * a;
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r * 3); gr.addColorStop(0, `rgba(255,255,255,${.75 * a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(sx - r * 3, sy - r * 3, r * 6, r * 6);
  g.strokeStyle = `rgba(255,255,255,${.85 * a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - r * 1.6, sy); g.lineTo(sx + r * 1.6, sy); g.moveTo(sx, sy - r * 1.6); g.lineTo(sx, sy + r * 1.6); g.stroke();
  g.restore();
}
function flare(g, v, [x, y], u) {
  const [sx, sy] = toS(v, x, y), a = .25 + .75 * ei(u), r = 160 + 900 * ei(u);
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(255,248,226,${a})`); gr.addColorStop(.35, `rgba(255,226,180,${a * .5})`); gr.addColorStop(1, 'rgba(255,220,180,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(255,236,200,${.35 * a})`; g.fillRect(0, sy - 2, W, 4);       // anamorphic streak
  g.restore();
}

function snow(g, t, k) {
  const R = mulberry(11); g.save();
  for (let i = 0; i < 120 * k; i++) {
    const z = R(), x = (R() * W + Math.sin(t * .7 + i) * 30 * z + t * 14 * z) % W, y = (R() * H + t * (30 + z * 80)) % (H + 40) - 20, r = 1.3 + z * 3.6;
    g.fillStyle = `rgba(255,255,255,${.3 + z * .5})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.restore();
}
function nightRoom(g, v, t) {   // act 1: her window stars twinkle, the crack of cold light flickers
  const R = mulberry(3); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const x = 1180 + R() * 440, y = 20 + R() * 300, a = Math.max(0, Math.sin(t * (1 + R() * 2) + R() * 6)) ** 4, [sx, sy] = toS(v, x, y); if (a > .05) { g.fillStyle = `rgba(255,250,230,${.8 * a})`; g.beginPath(); g.arc(sx, sy, (1.5 + 2.5 * a) * W / 1920 * 1672 / (v.w / K), 0, 7); g.fill(); } }
  const fl = .14 + .12 * Math.max(0, Math.sin(t * 7)) ** 3, [ax, ay] = toS(v, 950, 0), [bx, by] = toS(v, 655, 941);
  g.strokeStyle = `rgba(200,225,255,${fl})`; g.lineWidth = 26 * W / (v.w / K); g.filter = 'blur(14px)'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.filter = 'none';
  g.restore();
}
function dotsFade(g, v, t) {    // the two "…" bubbles breathe, then go still and dim
  const still = 1 - ss(seg(t, 7.6, 8.1));
  for (const [x, y, ph] of [[738, 450, 0], [868, 520, 1.6]]) { const [sx, sy] = toS(v, x, y), r = 90 * W / (v.w / K) * .8, a = (.2 + .18 * Math.sin(t * 4 + ph)) * still;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(sx - r, sy - r, r * 2, r * 2); g.restore(); }
  const d = ss(seg(t, 7.6, 8.2)) * .25; if (d > 0) { g.fillStyle = `rgba(20,25,50,${d})`; g.fillRect(0, 0, W, H); }
}
function sea(g, v, [y0, y1], t) {   // water rows shimmer sideways; glints dance (the plate's own pixels, no re-drawing)
  const P = PL[ACTIVE.s], src = P.bg; const top = y0 * K, bot = y1 * K, n = 48;
  for (let i = 0; i < n; i++) { const u = i / n, py = top + (bot - top) * u, dx = Math.sin(t * 1.6 + py / K * .09) * (.6 + u * 1.6) * K, sy0 = (py - v.y) / v.h * H; if (sy0 < -10 || sy0 > H + 10) continue;
    g.save(); g.beginPath(); g.rect(0, sy0, W, (bot - top) / n / v.h * H + 1); g.clip(); g.drawImage(src, v.x + dx, v.y, v.w, v.h, 0, 0, W, H); if (P.fg) g.drawImage(P.fg, v.x, v.y, v.w, v.h, 0, 0, W, H); g.restore(); }
  const R = mulberry(7); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) { const x = R() * 1672, y = y0 + (y1 - y0) * Math.pow(R(), .8), ph = R() * 6.28, sp = 1.5 + R() * 3, a = Math.max(0, Math.sin(t * sp + ph)) ** 6; if (a < .05) continue;
    const [sx, sy] = toS(v, x, y); if (sx < 0 || sx > W || sy < 0 || sy > H) continue; g.fillStyle = `rgba(255,246,220,${.55 * a})`; g.beginPath(); g.ellipse(sx, sy, 5 + 6 * a, 1.4, 0, 0, 7); g.fill(); }
  g.restore();
}
function gulls(g, u) {
  g.save(); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineCap = 'round';
  [[0, .16, 1], [.7, .24, .7], [1.4, .12, .8]].forEach(([d, y0, s]) => { const p = (u - d) / 4.2; if (p < 0 || p > 1) return; const x = lerp(-80, W + 80, p), y = H * y0 + Math.sin(p * 9) * 18, fl = Math.sin(u * 9 + d * 3) * 10 * s;
    g.lineWidth = 3.4 * s; g.beginPath(); g.moveTo(x - 26 * s, y - fl); g.quadraticCurveTo(x - 12 * s, y - 12 * s - fl * .4, x, y); g.quadraticCurveTo(x + 12 * s, y - 12 * s - fl * .4, x + 26 * s, y - fl); g.stroke(); });
  g.restore();
}
function fireworks(g, t, list) {
  list.forEach(([t0, fx, fy, col], i) => { const u = (t - t0) / 1.5; if (u < 0 || u > 1) return; const cx = fx * W, cy = fy * H, R = (50 + 150 * eo(u)) * W / 1920, a = (1 - u) ** 1.5;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 26; j++) { const an = j / 26 * 6.283 + i, x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R + u * u * 40; g.fillStyle = `rgba(${col},${.75 * a})`; g.beginPath(); g.arc(x, y, 3 * (1 - u * .5), 0, 7); g.fill(); }
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2); gr.addColorStop(0, `rgba(${col},${.3 * a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6); g.restore(); });
}
// watercolour brush wipe: ragged, soft-edged strokes sweep across and reveal the new shot (no double exposure)
let MASK; let ACTIVE;
function brushMask(u, seed) {   // watercolour bloom: soft ragged blobs spread from a few seeds and merge
  if (!MASK) { MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; }
  const m = MASK.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H); const R = mulberry(seed);
  m.fillStyle = '#000'; const e = eio(u);
  for (let i = 0; i < 5; i++) {
    const C = [[.02, .05], [.98, .08], [.03, .95], [.97, .93], [.5, 1.02]][i], cx = W * C[0], cy = H * C[1], d = R() * .15, r = Math.max(0, (e - d) / (1 - d)) * Math.hypot(W, H) * (.8 + R() * .25);
    if (r <= 0) continue; m.beginPath();
    for (let k = 0; k <= 40; k++) { const an = k / 40 * Math.PI * 2, rr = r * (1 + .12 * Math.sin(an * 5 + i * 2 + seed) + .07 * Math.sin(an * 11 + i)); m.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); }
    m.closePath(); m.fill();
  }
  return MASK;
}
// ------------------------------------------------------------------ finishing: bloom, grade, vignette, grain
function finish(g, t) {
  const b = BUF.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
  b.filter = 'blur(18px) brightness(1.15)'; b.drawImage(g.canvas, 0, 0, W, H); b.filter = 'none';
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; g.drawImage(BUF, 0, 0); g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(25,12,30,0)'); v.addColorStop(1, 'rgba(25,12,30,.34)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .06; const o = (Math.floor(t * 24) * 7919) % 300; g.drawImage(BG, -o, -o * .6, W + 300, H + 300); g.restore();
}

function dateCard(g, sh, t) {
  const [a, b] = sh.date; if (t < a) return; const k = ss(seg(t, a, a + .6)), out = 1 - ss(seg(t, b - .35, b));
  g.save(); g.globalAlpha = .5 * k * out; g.fillStyle = '#1c1022'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalAlpha = k * out; g.translate(W / 2, H * .44 - (1 - k) * 20); g.font = '500 128px DateF'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(255,190,200,.9)'; g.shadowBlur = 40; g.fillStyle = '#fff8f0'; g.fillText('2025.11.15', 0, 0);
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,230,235,.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-330, 86); g.lineTo(330, 86); g.stroke();
  g.fillStyle = '#ffb3c4'; g.beginPath(); const hy = 120, s2 = 16; g.moveTo(0, hy + s2 * .35); g.bezierCurveTo(-s2 * 1.1, hy - s2 * .35, -s2 * .5, hy - s2 * 1.05, 0, hy - s2 * .45); g.bezierCurveTo(s2 * .5, hy - s2 * 1.05, s2 * 1.1, hy - s2 * .35, 0, hy + s2 * .35); g.fill();
  g.restore();
}
const END = '我们的故事，未来再续……';
function ending(g, t) {
  const a = 55.9; if (t < a) return;
  g.save(); g.font = '78px HandZh'; g.shadowColor = 'rgba(120,60,90,.55)'; g.shadowBlur = 16;
  const lines = [END.slice(0, 6), END.slice(6)], X = [W * .6, W * .64], Y = [H * .3, H * .3 + 98]; let n = 0;
  lines.forEach((ln, li) => { let x = X[li]; for (const ch of ln) { const t0 = a + n * .12; n++; const k = ss(seg(t, t0, t0 + .5)); if (k > 0) { g.globalAlpha = k; g.fillStyle = '#fffaf2'; g.fillText(ch, x, Y[li] + (1 - k) * 10); } x += g.measureText(ch).width; } });
  const k = ss(seg(t, a + 1.5, a + 2.3)); if (k > 0) { g.globalAlpha = k * .85; g.strokeStyle = '#fffaf2'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * .63, Y[1] + 34); g.quadraticCurveTo(W * .76, Y[1] + 18, W * .63 + W * .27 * k, Y[1] + 8); g.stroke(); }
  g.restore();
}
// ------------------------------------------------------------------ lyrics: white serif, soft shadow, lower third
function lyric(g, t) {
  for (const [a, b, s] of LYRICS) {
    if (t < a - .15 || t > b + .3) continue;
    const k = Math.min(ss(seg(t, a - .15, a + .2)), 1 - ss(seg(t, b, b + .3)));
    g.save(); g.globalAlpha = k; g.font = '600 46px Lyric'; g.textAlign = 'center';
    const y = H - 64 + (1 - k) * 8; g.shadowColor = 'rgba(25,10,35,.8)'; g.shadowBlur = 16; g.fillStyle = '#fffcf6'; g.fillText(s, W / 2, y); g.shadowBlur = 3; g.fillText(s, W / 2, y);
    g.restore();
  }
}

// ------------------------------------------------------------------ frame
export function frame(lt) {
  const t = lt + T0, g = G; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = t < SHOTS[0].t0 ? 0 : SHOTS.length - 1;
  const sh = SHOTS[i], prev = SHOTS[i - 1], dt = t - sh.t0;
  ACTIVE = sh; drawShot(g, sh, t);
  // transitions into this shot
  if (prev && sh.in === 'dissolve' && dt < (sh.xf || .3)) {
    OG.setTransform(1, 0, 0, 1, 0, 0); drawShot(OG, prev, t); g.save(); g.globalAlpha = 1 - eio(dt / (sh.xf || .3)); g.drawImage(OFF, 0, 0); g.restore();
  }
  if (prev && sh.in === 'light' && dt < .7) {     // the previous shot's light blooms out and reveals the new one
    const a = 1 - ss(dt / .7); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,244,222,${.72 * a})`; g.fillRect(0, 0, W, H); g.restore();
  }
  if (prev && sh.in === 'whip') {                 // whip pan: a directional smear across the cut
    const w = .22, k = dt < w ? 1 - dt / w : 0;
    if (k > 0) { OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.drawImage(g.canvas, 0, 0); g.save(); g.globalAlpha = .16; for (let j = 1; j <= 7; j++) g.drawImage(OFF, -j * 70 * k, 0); g.restore(); }
  }
  const nx = SHOTS[i + 1];
  if (nx && nx.in === 'whip' && sh.t1 - t < .2) { const k = 1 - (sh.t1 - t) / .2; OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.drawImage(g.canvas, 0, 0); g.save(); g.globalAlpha = .16; for (let j = 1; j <= 7; j++) g.drawImage(OFF, j * 70 * k, 0); g.restore(); }
  if (prev && sh.in === 'brush' && dt < .9) {      // previous shot on top, eaten away by the brush strokes
    OG.setTransform(1, 0, 0, 1, 0, 0); OG.globalCompositeOperation = 'source-over'; OG.clearRect(0, 0, W, H); ACTIVE = prev; drawShot(OG, prev, t); ACTIVE = sh;
    const mk = brushMask(dt / .9, i * 7 + 3); OG.globalCompositeOperation = 'destination-out'; OG.filter = 'blur(40px)'; OG.drawImage(mk, 0, 0); OG.filter = 'none'; OG.globalCompositeOperation = 'source-over';
    g.drawImage(OFF, 0, 0);
  }
  if (sh.in === 'flash' && prev) { const a = (1 - clamp(dt / .4)) ** 2 * .85; if (a > 0) { g.fillStyle = `rgba(255,250,244,${a})`; g.fillRect(0, 0, W, H); } }
  if (sh.in === 'cut' && prev && dt < 1 / 24 * 2) { g.fillStyle = 'rgba(255,250,244,.12)'; g.fillRect(0, 0, W, H); }
  finish(g, t); if (sh.date) dateCard(g, sh, t); if (sh.ending) ending(g, t); lyric(g, t);
  if (T0 > 0 && lt < .25) { g.fillStyle = `rgba(8,6,14,${1 - lt / .25})`; g.fillRect(0, 0, W, H); }
  if (lt > DUR - .3) { g.fillStyle = `rgba(8,6,14,${(lt - (DUR - .3)) / .3})`; g.fillRect(0, 0, W, H); }
}

// =====================================================================================================
// Custom shots: the anniversary-card opening and the two Act 6 memory notes
// =====================================================================================================
const CI = {};
async function loadCustom() {
  const need = SHOTS.filter(s => s.custom && s.t1 > T0 && s.t0 < T1).map(s => s.custom);
  if (need.includes('opening')) {
    const L = { cover: 'obj/cover_obj.png', page: 'card/layers/inner_page.png', couple: 'card/layers/pop_couple.png', cats: 'card/layers/pop_cats.png', bike: 'card/layers/pop_bike.png', plaque: 'card/layers/pop_plaque.png' };
    await Promise.all(Object.entries(L).map(async ([k, s]) => { CI[k] = await im(s); }));
  }
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

// ---- Act 6 memory notes: a keepsake note card over a softly blurred everyday scene from the Act 6 illustration
const MEMOS = [
  { lines: ['那天你从家里赶来', '给我送药'], bg: [772, 735, 515], tilt: -2.2 },
  { lines: ['你自己不吃烤冷面', '却专门去夜市买来', '送到我家楼下'], bg: [852, 196, 485], tilt: 1.8 },
];
function memo(g, sh, t) {
  const M = MEMOS[sh.memo], u = seg(t, sh.t0, sh.t1), P = PL.act6; ({ k: K, w: GW, h: GH } = geo('act6'));
  const v = view(M.bg[0] + 20 * u, M.bg[1], M.bg[2] * (1 - .06 * eio(u)));
  g.filter = 'blur(14px) brightness(.82) saturate(1.1)'; g.drawImage(P.plate, v.x - 60, v.y - 40, v.w + 120, v.h + 80, 0, 0, W, H); g.filter = 'none';
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = .3; g.fillStyle = '#ffb27a'; g.fillRect(0, 0, W, H); g.restore();
  bokeh(g, t, .8, true);
  const lt = t - sh.t0, k = back(seg(lt, 0, .5), 1.4), cw = 960, ch = 130 + 112 * M.lines.length;
  g.save(); g.translate(W / 2, lerp(H * .78, H * .43, k)); g.rotate((M.tilt + (1 - k) * 4) * Math.PI / 180); g.globalAlpha = ss(seg(lt, 0, .3));
  g.shadowColor = 'rgba(40,15,30,.5)'; g.shadowBlur = 36; g.shadowOffsetY = 16;
  const R = mulberry(sh.memo + 3); g.beginPath();
  for (let i = 0; i <= 120; i++) { const d = i / 120 * 2 * (cw + ch); let x, y; if (d < cw) { x = -cw / 2 + d; y = -ch / 2; } else if (d < cw + ch) { x = cw / 2; y = -ch / 2 + d - cw; } else if (d < 2 * cw + ch) { x = cw / 2 - (d - cw - ch); y = ch / 2; } else { x = -cw / 2; y = ch / 2 - (d - 2 * cw - ch); } const j = (R() - .5) * 3; i ? g.lineTo(x + j, y + j) : g.moveTo(x + j, y + j); }
  g.closePath(); g.fillStyle = '#fbf3e8'; g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(214,170,120,.85)'; g.lineWidth = 2; g.strokeRect(-cw / 2 + 20, -ch / 2 + 20, cw - 40, ch - 40);
  g.fillStyle = 'rgba(246,196,206,.8)'; g.save(); g.translate(-cw / 2 + 70, -ch / 2 + 4); g.rotate(-.3); g.fillRect(-60, -16, 120, 32); g.restore();   // washi tape
  g.save(); g.translate(cw / 2 - 70, -ch / 2 + 4); g.rotate(.3); g.fillRect(-60, -16, 120, 32); g.restore();
  g.font = '78px HandZh'; g.fillStyle = '#5a2e2a'; g.textAlign = 'left'; g.textBaseline = 'middle';
  let n = 0; const total = M.lines.join('').length, per = Math.min(.09, 1.1 / total);
  M.lines.forEach((ln, li) => { const w = g.measureText(ln).width; let x = -w / 2; const y = -ch / 2 + 104 + li * 112;
    for (const c of ln) { const a = ss(seg(lt, .45 + n * per, .45 + n * per + .25)); n++; if (a > 0) { g.globalAlpha = a; g.fillText(c, x, y + (1 - a) * 6); } x += g.measureText(c).width; } });
  g.globalAlpha = ss(seg(lt, .45 + total * per, .9 + total * per)); g.fillStyle = '#e88aa0'; const hy = ch / 2 - 34, s2 = 13;
  g.beginPath(); g.moveTo(0, hy + s2 * .35); g.bezierCurveTo(-s2 * 1.1, hy - s2 * .35, -s2 * .5, hy - s2 * 1.05, 0, hy - s2 * .45); g.bezierCurveTo(s2 * .5, hy - s2 * 1.05, s2 * 1.1, hy - s2 * .35, 0, hy + s2 * .35); g.fill();
  g.restore();
}
const CUSTOM = { opening, memo };
