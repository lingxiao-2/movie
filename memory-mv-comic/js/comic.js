// 《把回忆拼好给你》Motion Comic — camera language over the user's illustrations (no character deformation).
// Every shot = one framing of an act plate (wide / medium / close-up / insert), keyed camera, optional fg/bg
// parallax with depth of field (rigid layers only), environment FX, and a beat-cut transition.
// Coordinates are ORIGINAL plate px (1672 × 941); plates are 2400 px tall (k = 2400 / 941).
import { seg, ss, eio, eo, ei, clamp, lerp, mulberry } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
export const T0 = Q.get('t0') ? +Q.get('t0') : 0, T1 = Q.get('t1') ? +Q.get('t1') : 59.04;
export const DUR = T1 - T0;
let W, H, G, OFF, OG, BUF, BG;
const K = 2400 / 941, PL = {};

// ------------------------------------------------------------------ shots (film seconds; cuts on the beat grid, 0.418 s)
export const SHOTS = [
  // ---- Act 3: the ride
  { id: '3a', t0: 16.0, t1: 17.67, s: 'act3', split: 1, cam: [[16.0, 470, 690, 560], [17.67, 760, 690, 500]], bgBlur: 7, streaks: 1.0, in: 'cut',
    why: '近景跟拍：白色球鞋、排气管与旋转的车轮掠过——速度感' },
  { id: '3b', t0: 17.67, t1: 19.34, s: 'act3', split: 1, cam: [[17.67, 785, 222, 360], [19.34, 800, 218, 310]], bgBlur: 11, streaks: .6, in: 'cut', bokeh: 1,
    why: '头盔面罩里的眼神特写：他下定决心' },
  { id: '3c', t0: 19.34, t1: 20.6, s: 'act3', split: 1, cam: [[19.34, 760, 470, 1672], [20.6, 880, 470, 1480]], para: 70, bgBlur: 1.5, streaks: .8, in: 'whip', petals: 1,
    why: '全景：骑手、红色摩托和城市夜景，前后景视差拉开距离' },
  { id: '3d', t0: 20.6, t1: 21.455, s: 'act3', split: 1, cam: [[20.6, 930, 455, 620], [21.455, 1045, 515, 330]], ease: 'in', bgBlur: 6, streaks: 1.4, in: 'cut', flare: [1045, 527],
    why: '车头与手套特写，镜头加速冲向车灯——奔赴的终点' },
  // ---- Act 4: the meeting
  { id: '4a', t0: 21.455, t1: 23.13, s: 'act4', split: 1, cam: [[21.455, 836, 470, 1672], [23.13, 836, 478, 1460]], focus: [21.455, 22.35, 16], in: 'light', mallLights: 1,
    why: '商场全景：车灯的光化开，焦点由虚到实——两个人终于面对面' },
  { id: '4b', t0: 23.13, t1: 24.38, s: 'act4', split: 1, cam: [[23.13, 600, 430, 700], [24.38, 625, 425, 610]], bgBlur: 7, in: 'cut', mallLights: .5,
    why: '男主侧脸特写：他认真地把话说清楚' },
  { id: '4c', t0: 24.38, t1: 25.6, s: 'act4', split: 1, cam: [[24.38, 1110, 445, 640], [25.6, 1118, 448, 560]], bgBlur: 7, in: 'cut', tear: [1146, 456], mallLights: .5,
    why: '女主眼睛与泪光特写：委屈慢慢化开' },
  { id: '4d', t0: 25.6, t1: 26.5, s: 'act4', split: 1, cam: [[25.6, 870, 440, 1220], [26.5, 870, 446, 1140]], bgBlur: 3, in: 'dissolve', xf: .35, mallLights: 1,
    why: '双人中景：两人对视，情绪落定' },
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
  const need = new Set(SHOTS.filter(s => s.t1 > T0 && s.t0 < T1).map(s => s.s));
  await Promise.all([...need].map(async s => { PL[s] = { bg: await im(`assets/layers/${s}_bg.png`), fg: await im(`assets/layers/${s}_fg.png`), plate: await im(`assets/up/${s}.png`) }; }));
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
function view(cx, cy, vw) { const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2); return { x: (cx - vw / 2) * K, y: (cy - vh / 2) * K, w: vw * K, h: vh * K }; }
const toS = (v, x, y) => [(x * K - v.x) / v.w * W, (y * K - v.y) / v.h * H];

// ------------------------------------------------------------------ drawing one shot into ctx g
function drawShot(g, sh, t) {
  const P = PL[sh.s]; const [cx, cy, vw] = cam(sh, t); const v = view(cx, cy, vw);
  const u = (t - sh.t0) / (sh.t1 - sh.t0);
  let focusBlur = 0; if (sh.focus) focusBlur = sh.focus[2] * (1 - ss(seg(t, sh.focus[0], sh.focus[1])));
  if (!sh.split) { g.filter = focusBlur > .3 ? `blur(${focusBlur}px)` : 'none'; g.drawImage(P.plate, v.x, v.y, v.w, v.h, 0, 0, W, H); g.filter = 'none'; return v; }
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
  if (sh.petals) petals(g, t);
  if (sh.tear) tear(g, v, sh.tear, t);
  if (sh.flare) flare(g, v, sh.flare, seg(t, sh.t0, sh.t1));
  return v;
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

// ------------------------------------------------------------------ finishing: bloom, grade, vignette, grain
function finish(g, t) {
  const b = BUF.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
  b.filter = 'blur(18px) brightness(1.15)'; b.drawImage(g.canvas, 0, 0, W, H); b.filter = 'none';
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .16; g.drawImage(BUF, 0, 0); g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(25,12,30,0)'); v.addColorStop(1, 'rgba(25,12,30,.34)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .06; const o = (Math.floor(t * 24) * 7919) % 300; g.drawImage(BG, -o, -o * .6, W + 300, H + 300); g.restore();
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
  drawShot(g, sh, t);
  // transitions into this shot
  if (prev && sh.in === 'dissolve' && dt < (sh.xf || .3)) {
    OG.setTransform(1, 0, 0, 1, 0, 0); drawShot(OG, prev, t); g.save(); g.globalAlpha = 1 - eio(dt / (sh.xf || .3)); g.drawImage(OFF, 0, 0); g.restore();
  }
  if (prev && sh.in === 'light' && dt < .7) {     // the previous shot's light blooms out and reveals the new one
    const a = 1 - ss(dt / .7); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,244,222,${.95 * a})`; g.fillRect(0, 0, W, H); g.restore();
  }
  if (prev && sh.in === 'whip') {                 // whip pan: a directional smear across the cut
    const w = .22, k = dt < w ? 1 - dt / w : 0;
    if (k > 0) { OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.drawImage(g.canvas, 0, 0); g.save(); g.globalAlpha = .16; for (let j = 1; j <= 7; j++) g.drawImage(OFF, -j * 70 * k, 0); g.restore(); }
  }
  const nx = SHOTS[i + 1];
  if (nx && nx.in === 'whip' && sh.t1 - t < .2) { const k = 1 - (sh.t1 - t) / .2; OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.drawImage(g.canvas, 0, 0); g.save(); g.globalAlpha = .16; for (let j = 1; j <= 7; j++) g.drawImage(OFF, j * 70 * k, 0); g.restore(); }
  if (sh.in === 'cut' && prev && dt < 1 / 24 * 2) { g.fillStyle = 'rgba(255,250,244,.12)'; g.fillRect(0, 0, W, H); }
  finish(g, t); lyric(g, t);
  if (T0 > 0 && lt < .25) { g.fillStyle = `rgba(8,6,14,${1 - lt / .25})`; g.fillRect(0, 0, W, H); }
  if (lt > DUR - .3) { g.fillStyle = `rgba(8,6,14,${(lt - (DUR - .3)) / .3})`; g.fillRect(0, 0, W, H); }
}
