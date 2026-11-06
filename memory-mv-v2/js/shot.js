// V2 test shot (5 s, 1920×1080): the argument on the phones → he puts the phone down, picks up the helmet →
// page turn → the red motorcycle pops up and rides off on the 28.0 s drop. Audio: song 25.0–30.0 s.
import { setSize, setCam, proj, drawRoom, drawBookBase, drawBackdrop, drawGround, drawCards, drawLeaf, finishFrame, dof, PW } from './engine.js';
import { seg, back, ss, eio, eo, ei, clamp, lerp, track } from '/core/lib.js';
import { mk } from './paper.js';

export const T0 = 25.0, DUR = 5.0;
const IMG = {};
const card = k => ({ c: IMG[k], pad: 0 });
const pop = (t, t0, d = .4, s = 1.7) => t < t0 ? 0 : 90 * back(seg(t, t0, t0 + d), s);
const al = a => clamp(a / 14);

export async function loadAssets() {
  const im = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => j(new Error('missing ' + src)); i.src = src; });
  const P = 'assets/paint/', C = 'assets/cut/';
  const list = { bd_night: P, gr_room: P, phone_him: P, phone_her: P, bub_l: P, bub_r: P, bub_dots: P, plant_a: P, lamp: P, star_gold: P, star_pale: P,
    bd_day: P, city_far: P, city_mid: P, tree_a: P, tree_b: P, tree_c: P, overpass: P, gr_road: P, dash: P, flowers_a: P, flowers_b: P, lamppost: P,
    him_down: C, her_flat: C, helmet_polaroid: C, rider_spin: C };
  await Promise.all(Object.entries(list).map(async ([k, d]) => { IMG[k] = await im(d + k + '.png'); }));
  // phone screens: their own busts from the character sheet, under the painted phone body
  IMG.ph_him_on = screen(IMG.phone_him, IMG.him_down, ['#d9e6f7', '#aec4e6'], 1);
  IMG.ph_him_off = screen(IMG.phone_him, null, ['#3a4258', '#232a3c'], 0);
  IMG.ph_her_on = screen(IMG.phone_her, IMG.her_flat, ['#fbe3ea', '#e9bccb'], 1);
  IMG.ph_her_dim = screen(IMG.phone_her, IMG.her_flat, ['#fbe3ea', '#e9bccb'], .45);
  IMG.polaroid = framed(IMG.helmet_polaroid);
  // rider card: canvas copy so shadows can be generated from it
  IMG.rider = toCanvas(IMG.rider_spin);
}
function toCanvas(i) { const c = mk(i.width, i.height); c.getContext('2d').drawImage(i, 0, 0); return c; }
function screen(phone, bust, cols, lit) {
  const c = mk(phone.width, phone.height), g = c.getContext('2d'), x0 = 66, y0 = 120, x1 = phone.width - 66, y1 = phone.height - 110;
  g.save(); g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 46); g.clip();
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (bust) { const w = x1 - x0 + 10, h = bust.height * w / bust.width; g.drawImage(bust, x0 - 5, y1 - h - 120, w, h); }
  // a calm UI: status bar and the input field
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.roundRect(x0 + 30, y1 - 96, x1 - x0 - 60, 62, 31); g.fill();
  g.fillStyle = 'rgba(60,60,80,.25)'; g.fillRect(x0 + 40, y0 + 26, 70, 10); g.fillRect(x1 - 110, y0 + 26, 70, 10);
  if (lit < 1) { g.fillStyle = `rgba(20,24,40,${1 - lit})`; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
  if (!bust) { const r = g.createLinearGradient(x0, y0, x1, y1); r.addColorStop(0, 'rgba(255,255,255,.18)'); r.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
  g.restore(); g.drawImage(phone, 0, 0); return c;
}
function framed(photo) { // a polaroid with two strips of washi tape
  const c = mk(photo.width + 40, photo.height + 60), g = c.getContext('2d'); g.drawImage(photo, 20, 40);
  g.fillStyle = 'rgba(246,206,150,.78)'; g.save(); g.translate(c.width * .3, 46); g.rotate(-.18); g.fillRect(-90, -24, 180, 48); g.restore();
  g.save(); g.translate(c.width * .74, 42); g.rotate(.14); g.fillRect(-80, -22, 160, 44); g.restore(); return c;
}

// ---------------------------------------------------------------- timeline (local seconds)
const TURN = [2.62, 2.99];
const camA = track([[0, [0, 8.5, 16, 44, 18, 0, 1500]], [1.3, [-.5, 8.2, 16, 38, 16, 0, 1500]], [1.75, [-8, 8, 15.5, 27, 13, -4, 1500]], [2.45, [-8.3, 8.2, 15.5, 25.5, 13, -4, 1500]], [2.99, [-4, 7, 13, 38, 14, 0, 1500]]]);
const camB = track([[2.98, [-6, 6.4, 12.5, 30, 9, 0, 1500]], [3.4, [-5, 6.2, 12.5, 27, 8, 0, 1500]], [5.0, [4.5, 6.2, 12.5, 26, 7, 2, 1500]]]);
const lampOn = t => 1 - .62 * ss(seg(t, .95, 1.45)) + .62 * ss(seg(t, 1.8, 2.2));
const dim = t => ss(seg(t, 1.0, 1.5)) * (1 - ss(seg(t, 1.8, 2.25)));

function cardsA(t) {
  const L = [], out = 1 - eio(seg(t, 2.48, 2.62));
  L.push({ img: card('lamp'), X: -17, Z: 22, h: 8.6, a: 90 * out, alpha: al(90 * out) });
  L.push({ img: card('plant_a'), X: 17, Z: 22, h: 7, a: 90 * out, alpha: al(90 * out) });
  [[-20, 22, 'star_pale', 1.8], [-6, 25, 'star_gold', 1.5], [7, 24, 'star_pale', 1.4], [21, 21, 'star_gold', 1.9]].forEach(([x, y, k, h], i) => L.push({ img: card(k), X: x, Z: 29.2, y0: y - 4 + Math.sin(t * 1.4 + i) * .25, h, a: 90 * out, alpha: al(90 * out), rot: Math.sin(t * 1.1 + i * 2) * .08, shadowA: .5 }));
  // his phone: on → dark → laid down; the helmet photo rises in its place
  const down = eio(seg(t, 1.62, 1.9));
  const hisImg = t < 1.58 ? 'ph_him_on' : 'ph_him_off';
  L.push({ img: card(hisImg), X: -9, Z: 15, h: 13.5, a: 90 * (1 - down), dir: -1, alpha: 1 });
  if (t > 1.78) { const a = pop(t, 1.78, .4, 1.9) * out; L.push({ img: card('polaroid'), X: -8.7, Z: 16.5, h: 12.5, a, alpha: al(a), rot: -.06 }); }
  L.push({ img: card(t < 1.2 ? 'ph_her_on' : 'ph_her_dim'), X: 9, Z: 17, h: 13.5, a: 90 * out, alpha: al(90 * out) });
  // the chat: bubbles cross back and forth… then stop
  const fade = (1 - .62 * ss(seg(t, 1.1, 1.5))) * (1 - ss(seg(t, 1.6, 1.9)));
  [[.12, 'bub_l', -2.6, 13.6], [.42, 'bub_r', 2.2, 12.2], [.7, 'bub_l', -2.2, 10.8]].forEach(([t0, k, x, y], i) => {
    if (t < t0) return; const k1 = back(seg(t, t0, t0 + .28), 2.2);
    L.push({ img: card(k), X: x - (1 - k1) * (k === 'bub_l' ? 3 : -3), Z: 15.6 + i * .3, y0: y - (t - t0) * .5, h: 2.6 * k1, a: 90, alpha: fade * clamp((t - t0) * 6), shadow: false, layer: -1 });
  });
  if (t > .95 && t < 1.95) { const k1 = back(seg(t, .95, 1.18), 2), freeze = ss(seg(t, 1.2, 1.5)) ;  L.push({ img: card('bub_dots'), X: 2.8, Z: 16.4, y0: 8.6 - freeze * .6, h: 2.1 * k1, a: 90, alpha: (1 - freeze * .7) * clamp((t - .95) * 6) * (1 - ss(seg(t, 1.65, 1.95))), shadow: false, layer: -1 }); }
  return L;
}

const dist = t => { const v = u => u < 3.05 ? 0 : 26 * ss(seg(u, 3.05, 3.45)); let s = 0, n = 40; for (let i = 0; i < n; i++) s += v(3.0 + (i + .5) * (t - 3) / n) * (t - 3) / n; return t > 3 ? s : 0; };
const wrap = (x, span) => ((x % span) + span) % span - span / 2;
function cardsB(t) {
  const L = [], s = dist(t);
  const put = (k, x0, Z, h, span, par, extra = {}) => { const X = wrap(x0 - s * par, span); if (Math.abs(X) < 35) L.push({ img: card(k), X, Z, h, a: 90, alpha: clamp((34 - Math.abs(X)) / 2), ...extra }); };
  // pieces stand up back to front as the page lands
  const up = (z) => pop(t, 2.9 + (30 - z) * .012, .35, 1.4);
  const P = (k, x0, Z, h, span, par, ex = {}) => { const a = up(Z); put(k, x0, Z, h, span, par, { a, alpha: al(a), ...ex }); };
  [0, 24, 48].forEach(x => P('city_far', x, 29, 8.4, 72, .15, { shadow: false }));
  [-30, -6, 18].forEach(x => P('city_mid', x, 27.5, 6, 72, .25));
  P('overpass', 12, 25, 13, 80, .4);
  [['tree_a', -28, 22, 10], ['tree_c', -16, 21, 9], ['tree_b', -4, 22.5, 10.5], ['tree_a', 8, 21.5, 9.5], ['tree_c', 21, 22, 10], ['tree_b', 32, 21, 9.5]].forEach(([k, x, z, h]) => P(k, x, z, h, 72, .65));
  [-26, -10, 6, 22].forEach(x => P('lamppost', x, 18.5, 9, 64, .8));
  for (let i = 0; i < 12; i++) put('dash', i * 6, 12.3, .55, 72, 1, { a: 0, dir: 1, shadow: false });
  [['flowers_a', -24, 4.5, 3.6], ['flowers_b', -8, 3.6, 3.2], ['flowers_a', 8, 5, 3.8], ['flowers_b', 24, 4, 3.4]].forEach(([k, x, z, h]) => P(k, x, z, h, 72, 1.35));
  // the red motorcycle: pops up from the page right on the beat, then rides off
  const a = pop(t, 2.96, .32, 2.0), go = ei(seg(t, 3.15, 5.0)) * .55 + eio(seg(t, 3.15, 5.0)) * .45;
  const X = lerp(-7.5, 6.5, go), bob = t > 3.1 ? Math.sin(t * 22) * .06 : 0, lean = t > 3.1 ? -.025 * ss(seg(t, 3.1, 3.4)) : 0;
  L.push({ img: { c: IMG.rider, pad: 0 }, X, Z: 12.3, y0: Math.max(0, bob), h: 8.2, a, alpha: al(a), rot: lean });
  return L;
}

let G, W, H;
export function init(g, w, h) { G = g; W = w; H = h; setSize(w, h); }
const cam = arr => { const [tx, ty, tz, d, pitch, yaw, f] = arr; return { tx, ty, tz, d, pitch, yaw, f }; };

export function frame(t) {
  const g = G; g.setTransform(1, 0, 0, 1, 0, 0);
  const inB = t >= TURN[1], inTurn = t >= TURN[0] && t < TURN[1];
  setCam(cam(inB ? camB(t) : camA(t)));
  dof.focus = inB ? 26 : t < 1.55 ? 36 : 26; dof.ap = inB ? 4.2 : 2.6;
  if (t > 3.0 && t < 4.9) { const k = ss(seg(t, 3.0, 3.3)); g.translate(Math.sin(t * 51) * 2.2 * k, Math.cos(t * 43) * 2.2 * k); }
  drawRoom(g, inB ? .7 : .45);
  drawBookBase(g, true);
  if (!inB) {
    drawBackdrop(g, IMG.bd_night, 5);
    drawGround(g, inTurn ? IMG.gr_road : IMG.gr_room);
    if (inTurn) drawCards(g, cardsB(t));
    else drawCards(g, cardsA(t));
    if (inTurn) drawLeaf(g, 90 * eio(seg(t, TURN[0], TURN[1])), '#ece2d0', IMG.bd_day);
  } else {
    drawBackdrop(g, IMG.bd_day, 3);
    drawGround(g, IMG.gr_road);
    drawCards(g, cardsB(t));
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  light(g, t, inB);
  finishFrame(g, inB ? .45 : .25 * lampOn(t), inB ? 0 : .35 + .3 * dim(t));
  if (inB) speedLines(g, t);
  lyric(g, t + T0);
}

function light(g, t, inB) {
  if (!inB) {
    // the desk lamp's warm pool and the phone screens' cool glow; a cooler, dimmer room while they fall silent
    const lp = proj(-17, 7.4, 22), k = lampOn(t);
    let gr = g.createRadialGradient(lp[0], lp[1], 10, lp[0], lp[1], 900);
    gr.addColorStop(0, `rgba(255,214,150,${.42 * k})`); gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
    for (const [x, z, on] of [[-9, 15, t < 1.58 ? 1 : 0], [9, 17, t < 1.2 ? 1 : .45]]) {
      const p = proj(x, 6, z - .4); gr = g.createRadialGradient(p[0], p[1], 10, p[0], p[1], 420);
      gr.addColorStop(0, `rgba(190,215,255,${.16 * on})`); gr.addColorStop(1, 'rgba(190,215,255,0)');
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
    }
    const d = dim(t); if (d > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(150,160,200,${.5 * d})`; g.fillRect(0, 0, W, H); g.restore(); }
  } else {
    // morning sun from the left
    const gr = g.createLinearGradient(0, 0, W, H * .6); gr.addColorStop(0, 'rgba(255,236,190,.38)'); gr.addColorStop(.6, 'rgba(255,236,190,0)');
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
}
function speedLines(g, t) {
  const k = ss(seg(t, 3.05, 3.4)); if (k <= 0) return;
  g.save(); g.globalAlpha = .55 * k;
  for (let i = 0; i < 14; i++) { const y = 120 + ((i * 431) % 860), x = ((i * 293 - t * 2600) % 2400 + 2400) % 2400 - 400, l = 180 + (i * 97) % 240; const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.85)'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, l, 4, 2); g.fill(); }
  g.restore();
}
const LYR = [[25.42, 28.00, '将快乐全都收集将不开心全都淘汰'], [28.98, 31.40, '你对我说的情话']];
function lyric(g, T) {
  for (const [a, b, s] of LYR) {
    if (T < a - .1 || T > b + .25) continue;
    const kIn = back(seg(T, a - .1, a + .18), 2), kOut = seg(T, b, b + .25);
    g.save(); g.font = '48px LyricZh'; const tw = g.measureText(s).width, bw = tw + 80, bh = 92;
    g.translate(W / 2, H - 92 + kOut * 24); g.rotate(-.01); g.scale(.75 + .25 * kIn, .75 + .25 * kIn); g.globalAlpha = clamp(kIn * 2) * (1 - kOut);
    g.shadowColor = 'rgba(40,25,10,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.roundRect(-bw / 2 - 7, -bh / 2 - 7, bw + 14, bh + 14, 16); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = '#f3e3c4'; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, 10); g.fill();
    g.fillStyle = 'rgba(246,206,150,.75)'; g.fillRect(-bw / 2 - 16, -bh / 2 - 5, 60, 22);
    g.fillStyle = '#3b2a22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 3); g.restore();
  }
}
