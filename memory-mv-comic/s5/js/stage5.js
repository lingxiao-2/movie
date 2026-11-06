// Act 5 — paper-theater motion comic test (film 30.00–37.50 s). Every layer is a rigid paper card:
// translate / rotate / uniform scale only (the far wall may hinge up as a flat card). No warping of characters.
import { seg, ss, eio, eo, back, clamp, lerp, mulberry } from '/core/lib.js';

export const T0 = 30.0, DUR = 7.5;
const K = 2400 / 941;                       // plate px per original px
let W, H, G, TMP, TG;
const IM = {};
const im = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + s)); i.src = s; });

export async function load(w, h, g) {
  W = w; H = h; G = g; TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H; TG = TMP.getContext('2d');
  for (const n of ['act5A', 'act5B']) { IM[n + 'bg'] = await im(`stage5/${n}_bg.png`); IM[n + 'fg'] = await im(`stage5/${n}_fg.png`); }
}

// ------------------------------------------------------------------ camera + layer drawing
function view(cx, cy, vw) { const vh = vw * 9 / 16; cx = clamp(cx, vw / 2, 1672 - vw / 2); cy = clamp(cy, vh / 2, 941 - vh / 2); return { x: (cx - vw / 2) * K, y: (cy - vh / 2) * K, w: vw * K, h: vh * K }; }
const S = (v, x, y) => [(x * K - v.x) / v.w * W, (y * K - v.y) / v.h * H];
// a layer image drawn through view v, with its own rigid offset (dx, dy in screen px), rotation (deg, about pivot px) and scale
function layer(g, img, v, { dx = 0, dy = 0, rot = 0, sc = 1, px = W / 2, py = H, alpha = 1, blur = 0, shadow = 0, hinge = 1 } = {}) {
  g.save(); g.globalAlpha = alpha;
  g.translate(px + dx, py + dy); g.rotate(rot * Math.PI / 180); g.scale(sc, sc * hinge); g.translate(-px, -py);
  if (shadow) { g.shadowColor = 'rgba(60,25,40,.45)'; g.shadowBlur = shadow; g.shadowOffsetY = shadow * .35; }
  if (blur > .3) g.filter = `blur(${blur}px)`;
  g.drawImage(img, v.x, v.y, v.w, v.h, 0, 0, W, H);
  g.restore();
}

// ------------------------------------------------------------------ paper FX (rigid paper pieces)
function paperDisc(g, x, y, r, col, a) { g.save(); g.globalAlpha = a; g.fillStyle = '#fffaf2'; g.beginPath(); g.arc(x, y, r * 1.28, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
function garland(g, t, depth, a) {      // out-of-focus paper string lights hanging across the top: the front of the stage
  const R = mulberry(17 + depth); g.save(); g.filter = `blur(${depth * 3 + 3}px)`;
  for (const [y0, sag, ph] of [[-20, 120, 0], [-40, 90, 1.7]]) {
    const sway = Math.sin(t * 1.1 + ph) * .012; g.save(); g.translate(W / 2, y0); g.rotate(sway); g.translate(-W / 2, -y0);
    g.strokeStyle = `rgba(70,40,40,${.55 * a})`; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = -60 + (W + 120) * i / 40, y = y0 + sag * Math.sin(Math.PI * i / 40); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let i = 1; i < 14; i++) { const u = i / 14, x = -60 + (W + 120) * u, y = y0 + sag * Math.sin(Math.PI * u) + 18, fl = .75 + .25 * Math.sin(t * (2 + R() * 3) + i);
      const gr = g.createRadialGradient(x, y, 0, x, y, 60); gr.addColorStop(0, `rgba(255,214,150,${.45 * a * fl})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(x - 60, y - 60, 120, 120);
      paperDisc(g, x, y, 13 + R() * 5, i % 3 ? '#ffd79a' : '#ffb7c8', a); }
    g.restore();
  }
  g.restore();
}
function snow(g, t, k, front) {
  const R = mulberry(front ? 3 : 11); g.save();
  for (let i = 0; i < (front ? 14 : 90) * k; i++) {
    const z = R(), x = (R() * W + Math.sin(t * .7 + i) * 26 + t * 12 * z) % W, y = (R() * H + t * (front ? 140 : 30 + z * 60)) % (H + 80) - 40, r = front ? 7 + z * 7 : 1.2 + z * 3;
    if (front) { g.filter = 'blur(5px)'; g.fillStyle = 'rgba(255,255,255,.55)'; } else g.fillStyle = `rgba(255,255,255,${.3 + z * .5})`;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.restore();
}
function bokeh(g, t, k) {
  const R = mulberry(47); g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 24 * k; i++) { const x = (R() * W + t * 8 * (R() - .5)) % W, y = R() * H * .7, r = 18 + R() * 50, a = (.06 + .09 * R()) * (.6 + .4 * Math.sin(t * (1 + R() * 2) + i));
    const c = R() < .6 ? '255,206,150' : '255,180,200', gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.7, `rgba(${c},${a * .7})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.restore();
}
// paper petals: little rigid cut-paper petals (white rim) tumbling
function petals(g, t, t0, cx, cy, n, spread) {
  const u = t - t0; if (u < 0) return; const R = mulberry(Math.round(t0 * 100)); g.save();
  for (let i = 0; i < n; i++) {
    const an = -Math.PI / 2 + (R() - .5) * spread, sp = 260 + R() * 420, x = cx + Math.cos(an) * sp * eo(Math.min(1, u / 1.4)) + Math.sin(u * 2 + i) * 20, y = cy + Math.sin(an) * sp * eo(Math.min(1, u / 1.4)) + u * u * 90;
    const a = Math.min(1, u * 5) * (1 - seg(u, 2.2, 3)); if (a <= 0) continue;
    g.save(); g.translate(x, y); g.rotate(u * (2 + R() * 3) + i); g.scale(1, .55 + .45 * Math.sin(u * 5 + i)); g.globalAlpha = a;
    g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(0, 0, 15, 10, 0, 0, 7); g.fill(); g.fillStyle = R() < .5 ? '#ff9fb5' : '#ffc2d0'; g.beginPath(); g.ellipse(0, 0, 12, 7.5, 0, 0, 7); g.fill(); g.restore();
  }
  g.restore();
}
// paper firework: a cut-paper star-burst card popping open (rigid scale with overshoot) between the wall and the couple
function paperBurst(g, t, t0, x, y, r, col) {
  const u = t - t0; if (u < 0 || u > 1.8) return; const k = back(seg(u, 0, .35), 2.4), a = 1 - seg(u, 1.2, 1.8);
  g.save(); g.translate(x, y); g.rotate(u * .25); g.scale(k, k); g.globalAlpha = a;
  for (let j = 0; j < 12; j++) { g.save(); g.rotate(j / 12 * Math.PI * 2);
    g.fillStyle = '#fffaf2'; g.beginPath(); g.moveTo(r * .22, -9); g.lineTo(r + 8, 0); g.lineTo(r * .22, 9); g.closePath(); g.fill();
    g.fillStyle = j % 2 ? col : '#ffe7a8'; g.beginPath(); g.moveTo(r * .25, -6); g.lineTo(r, 0); g.lineTo(r * .25, 6); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = '#fffaf2'; g.beginPath(); g.arc(0, 0, r * .2, 0, 7); g.fill(); g.fillStyle = '#ffd36e'; g.beginPath(); g.arc(0, 0, r * .15, 0, 7); g.fill();
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.6); gr.addColorStop(0, 'rgba(255,230,190,.35)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
  g.restore();
}
function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * .35); g.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .5, y - s * 1.05, x, y - s * .45); g.bezierCurveTo(x + s * .5, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); g.closePath(); }

// the anniversary card: a deckle-edged paper card that slides up, tilts and settles, with gold-foil date
function dateCard(g, t, t0) {
  const u = t - t0; if (u < 0) return;
  const k = back(seg(u, 0, .55), 1.5), rot = lerp(-7, -2.2, eo(seg(u, 0, .8))) + Math.sin(u * 1.4) * .4;
  const cw = 620, ch = 330, cx = W / 2, cy = lerp(H + ch, H * .5, k);
  g.save(); g.globalAlpha = .5 * ss(seg(u, 0, .5)); g.fillStyle = '#1c1022'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.translate(cx, cy); g.rotate(rot * Math.PI / 180);
  g.shadowColor = 'rgba(40,15,30,.55)'; g.shadowBlur = 34; g.shadowOffsetY = 16;
  const R = mulberry(5); g.beginPath();
  for (let i = 0; i <= 120; i++) { const s = i / 120, per = 2 * (cw + ch), d = s * per; let x, y;
    if (d < cw) { x = -cw / 2 + d; y = -ch / 2; } else if (d < cw + ch) { x = cw / 2; y = -ch / 2 + d - cw; } else if (d < 2 * cw + ch) { x = cw / 2 - (d - cw - ch); y = ch / 2; } else { x = -cw / 2; y = ch / 2 - (d - 2 * cw - ch); }
    const j = (R() - .5) * 3.2; i ? g.lineTo(x + j, y + j) : g.moveTo(x + j, y + j); }
  g.closePath(); g.fillStyle = '#fbf3e8'; g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(214,170,120,.9)'; g.lineWidth = 2; g.strokeRect(-cw / 2 + 22, -ch / 2 + 22, cw - 44, ch - 44); g.strokeRect(-cw / 2 + 30, -ch / 2 + 30, cw - 60, ch - 60);
  const gold = g.createLinearGradient(-220, -50, 220, 50); gold.addColorStop(0, '#b8862f'); gold.addColorStop(.45, '#f3d58c'); gold.addColorStop(.55, '#fff0c2'); gold.addColorStop(1, '#b8862f');
  g.font = '500 112px DateF'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = gold; g.fillText('2025.11.15', 0, -12);
  // foil glint sweeping across
  const gx = lerp(-cw, cw, seg(u, .6, 1.6)); g.save(); g.globalCompositeOperation = 'source-atop'; const gl = g.createLinearGradient(gx - 36, 0, gx + 36, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,250,225,.32)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillText('2025.11.15', 0, -12); g.restore();
  g.fillStyle = '#e88aa0'; heart(g, 0, 92, 15); g.fill();
  g.strokeStyle = 'rgba(214,170,120,.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-170, 92); g.lineTo(-30, 92); g.moveTo(30, 92); g.lineTo(170, 92); g.stroke();
  // little paper rose stickers popping onto two corners
  [[-cw / 2 + 8, -ch / 2 + 8, .55], [cw / 2 - 10, ch / 2 - 6, .8]].forEach(([x, y, d]) => { const s = back(seg(u, d, d + .35), 2.2); if (s <= 0) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#fffaf2'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill();
    for (let p = 0; p < 5; p++) { g.fillStyle = p % 2 ? '#ff9fb5' : '#ffb9c9'; g.beginPath(); g.ellipse(Math.cos(p * 1.256) * 10, Math.sin(p * 1.256) * 10, 13, 10, p, 0, 7); g.fill(); }
    g.fillStyle = '#f07b98'; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore(); });
  g.restore();
}

// ------------------------------------------------------------------ lyrics (same style as the film)
const LYR = [[28.98, 31.40, '你对我说的情话'], [31.50, 34.60, '像转瞬即逝的烟花'], [35.66, 38.30, '只停在绽放一刹那']];
function lyric(g, T) { for (const [a, b, s] of LYR) { if (T < a - .15 || T > b + .3) continue; const k = Math.min(ss(seg(T, a - .15, a + .2)), 1 - ss(seg(T, b, b + .3)));
  g.save(); g.globalAlpha = k; g.font = '600 46px Lyric'; g.textAlign = 'center'; const y = H - 64; g.shadowColor = 'rgba(25,10,35,.8)'; g.shadowBlur = 16; g.fillStyle = '#fffcf6'; g.fillText(s, W / 2, y); g.shadowBlur = 3; g.fillText(s, W / 2, y); g.restore(); } }

function finish(g, warm) {
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = warm; g.fillStyle = '#ffb070'; g.fillRect(0, 0, W, H); g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(25,12,30,0)'); v.addColorStop(1, 'rgba(25,12,30,.36)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ the shot plan (local seconds; beats at film 31.67, 33.34, 34.18, 35.43)
//  1  0.00–1.67  paper stage unfolds: the mall wall hinges up, the garland swings in, the couple's card slides up into place
//  2  1.67–3.34  "finally face to face": slow push on the two-shot, his card leans in, hers rises a breath
//  3  3.34–4.18  insert: the bouquet + scarf, petals burst from the bouquet (paper fireworks behind)
//  4  4.18–5.43  she has it in her arms: two-shot B, paper fireworks pop between the wall and the couple
//  5  5.43–7.50  closer on their eyes, then the deckle-edged anniversary card slides up: 2025.11.15
export function frame(lt) {
  const g = G, t = lt, T = T0 + lt; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = '#20131f'; g.fillRect(0, 0, W, H);
  if (t < 3.34) {
    // opens tight on the lit mall facade, then tilts down and pulls out to the two-shot as the couple's card rises
    const o = eio(seg(t, .2, 1.6)), u = seg(t, 1.6, 3.34);
    const v = view(lerp(830, 836, o), lerp(175, 470, o), lerp(600, 1672, o) - 250 * eio(u));
    const hinge = .25 + .75 * back(seg(t, 0, .55), 1.3);                 // the back wall stands up like a theatre flat
    layer(g, IM.act5Abg, v, { hinge, py: H, blur: lerp(0, 3, o), alpha: ss(seg(t, 0, .25)) });
    bokeh(g, t, ss(seg(t, .3, .9)));
    snow(g, t, ss(seg(t, .2, .8)), false);
    const rise = 1 - back(seg(t, .55, 1.45), 1.25), lean = t > 1.67 ? Math.sin(Math.PI * seg(t, 1.9, 3.3)) : 0;
    layer(g, IM.act5Afg, v, { dy: rise * H * .55 + Math.sin(t * 2.2) * 2, rot: lean * .6, px: W * .3, py: H, shadow: 28, alpha: ss(seg(t, .55, .8)) });
    snow(g, t, 1, true);
    finish(g, .12);
  } else if (t < 4.18) {
    const u = seg(t, 3.34, 4.18), v = view(lerp(790, 805, u), lerp(520, 505, u), lerp(700, 610, eio(u)));
    layer(g, IM.act5Abg, v, { blur: 8 });
    paperBurst(g, t, 3.4, W * .18, H * .2, 120, '#ffb7c8'); paperBurst(g, t, 3.62, W * .84, H * .16, 95, '#ffd79a');
    layer(g, IM.act5Afg, v, { shadow: 30, sc: 1 + .02 * u, px: W / 2, py: H * .55, dy: -14 * eo(u) });     // the gift lifts toward her
    petals(g, t, 3.42, W * .52, H * .34, 26, 2.6);
    snow(g, t, .6, false);
    finish(g, .16);
  } else {
    const u = seg(t, 4.18, 7.5), v = t < 5.43 ? view(836, 470, lerp(1672, 1520, eio(seg(t, 4.18, 5.43)))) : view(lerp(836, 820, eio(seg(t, 5.43, 7.5))), lerp(470, 360, eio(seg(t, 5.43, 7.5))), lerp(1520, 980, eio(seg(t, 5.43, 6.3))));
    layer(g, IM.act5Bbg, v, { blur: 4 });
    bokeh(g, t, 1);
    paperBurst(g, t, 4.2, W * .26, H * .18, 130, '#ffb7c8'); paperBurst(g, t, 4.5, W * .78, H * .13, 105, '#ffd79a'); paperBurst(g, t, 5.0, W * .55, H * .08, 80, '#ffc2d0');
    snow(g, t, .8, false);
    const settle = 1 - eo(seg(t, 4.18, 4.6));                              // the new card arrives with a soft paper slide
    layer(g, IM.act5Bfg, v, { dx: settle * 40, shadow: 30, dy: Math.sin(t * 2.1) * 2 });
    petals(g, t, 4.25, W * .62, H * .55, 16, 3.2);
    snow(g, t, .8, true);
    finish(g, .2);
    if (t < 4.18 + .12) { g.fillStyle = `rgba(255,248,240,${.5 * (1 - (t - 4.18) / .12)})`; g.fillRect(0, 0, W, H); }
    dateCard(g, t, 5.9);
  }
  if (t >= 3.34 && t < 3.34 + .1) { g.fillStyle = `rgba(255,248,240,${.4 * (1 - (t - 3.34) / .1)})`; g.fillRect(0, 0, W, H); }
  lyric(g, T);
  if (t < .2) { g.fillStyle = `rgba(8,6,14,${1 - t / .2})`; g.fillRect(0, 0, W, H); }
  if (t > DUR - .35) { g.fillStyle = `rgba(8,6,14,${(t - (DUR - .35)) / .35})`; g.fillRect(0, 0, W, H); }
}
