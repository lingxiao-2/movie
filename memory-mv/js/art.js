// Paper art for every spread: backdrops, ground pages and pop-up props. Each card is drawn once and cached.
import { INK, mk, finish, blob, fillStroke, rrect, grain, limb } from './paper.js';
import { catHim, catHer, charCard } from './chars.js';
import { mulberry } from '/core/lib.js';

const CACHE = new Map();
export function cached(key, fn) { let v = CACHE.get(key); if (!v) { v = fn(); CACHE.set(key, v); } return v; }
const card = (key, w, h, draw, opt) => cached(key, () => { const c = mk(w, h), g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; draw(g, w, h); return finish(c, opt); });
const plain = (key, w, h, draw) => cached(key, () => { const c = mk(w, h), g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round'; draw(g, w, h); return c; });

// watercolour wash: many soft translucent blobs
export function wash(g, x, y, w, h, col, seed = 1, n = 40, alpha = .08) {
  const r = mulberry(seed); g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++) { g.globalAlpha = alpha * (.5 + r()); blob(g, x + r() * w, y + r() * h, w * (.12 + r() * .25), h * (.12 + r() * .25), i + seed, .18); g.fill(); }
  g.restore();
}
function paperTex(g, w, h, a = .12) { g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(grain(), 'repeat'); g.fillRect(0, 0, w, h); g.restore(); }
function vgrad(g, w, h, stops) { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
function star5(g, x, y, r, rot = 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
export function heartPath(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * .35); g.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .5, y - s * 1.05, x, y - s * .45); g.bezierCurveTo(x + s * .5, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); g.closePath(); }

// ======================= backdrops (1000 × 750) =======================
export const BD = {
  sky1: () => plain('bd_sky1', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#aebfd3'], [1, '#e3e6e6']]); wash(g, 0, 0, w, h * .7, '#8ea4c0', 3, 50, .07); paperTex(g, w, h); }),
  night: () => plain('bd_night', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#24345a'], [1, '#4b5c86']]); wash(g, 0, 0, w, h, '#1b2747', 8, 40, .1);
    const r = mulberry(4); g.fillStyle = '#fff6cf'; for (let i = 0; i < 60; i++) { g.globalAlpha = .4 + r() * .6; g.beginPath(); g.arc(r() * w, r() * h * .8, 1 + r() * 2.2, 0, 7); g.fill(); } g.globalAlpha = 1; paperTex(g, w, h);
  }),
  day: () => plain('bd_day', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#8fc3ea'], [.7, '#d7ecf5'], [1, '#f6efdc']]); wash(g, 0, 0, w, h * .6, '#6fa9d8', 5, 40, .06); paperTex(g, w, h); }),
  warm: () => plain('bd_warm', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#f3b9a6'], [.55, '#fbd9b0'], [1, '#fff1d6']]); wash(g, 0, 0, w, h, '#f6a3a8', 9, 40, .06); paperTex(g, w, h); }),
  golden: () => plain('bd_gold', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#f6c98a'], [.6, '#ffe6b8'], [1, '#fff6e0']]);
    const gr = g.createRadialGradient(w / 2, h * .78, 10, w / 2, h * .78, 420); gr.addColorStop(0, 'rgba(255,255,235,1)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    wash(g, 0, 0, w, h * .5, '#f2a970', 12, 30, .05); paperTex(g, w, h);
  }),
  cafe: () => plain('bd_cafe', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#f4ead8'], [1, '#efe1c7']]); g.fillStyle = '#6b4a3a'; g.fillRect(0, h * .62, w, h * .38); g.fillStyle = '#5a3c2e'; for (let x = 0; x < w; x += 60) g.fillRect(x, h * .62, 3, h); for (const x of [180, 480, 780]) { g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(x, 40, 16, 0, 7); g.fill(); const gr = g.createRadialGradient(x, 40, 5, x, 120, 200); gr.addColorStop(0, 'rgba(255,240,190,.5)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(x - 220, 0, 440, 400); } rrect(g, 640, 120, 120, 160, 6); fillStroke(g, '#d9c3a0', 6, '#8a6a4a'); paperTex(g, w, h); }),
  burger: () => plain('bd_burger', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#2f3a4a'], [.5, '#3d4d5e'], [1, '#e9e4dc']]); for (const x of [200, 500, 800]) { const gr = g.createRadialGradient(x, 120, 4, x, 120, 160); gr.addColorStop(0, 'rgba(255,226,150,.9)'); gr.addColorStop(1, 'rgba(255,226,150,0)'); g.fillStyle = gr; g.fillRect(x - 160, 0, 320, 300); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(x, 110, 14, 0, 7); g.fill(); } g.fillStyle = '#f4a640'; rrect(g, 600, 280, 180, 100, 10); g.fill(); g.fillStyle = '#fff3d6'; for (let i = 0; i < 3; i++) g.fillRect(620, 300 + i * 26, 140, 10); g.fillStyle = 'rgba(255,255,255,.15)'; for (let x = 0; x < w; x += 140) g.fillRect(x, 0, 4, h * .62); g.fillStyle = '#e9e4dc'; g.fillRect(0, h * .68, w, h * .32); paperTex(g, w, h); }),
  sunny: () => plain('bd_sunny', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#7fc0ee'], [.75, '#cfe9f7'], [1, '#e9dcc0']]); g.fillStyle = '#fff7c9'; g.beginPath(); g.arc(800, 120, 70, 0, 7); g.fill(); for (const [x, y] of [[200, 140], [520, 90]]) { g.fillStyle = 'rgba(255,255,255,.9)'; blob(g, x, y, 90, 34, x, .2); g.fill(); } paperTex(g, w, h); }),
  booth: () => plain('bd_booth', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#f9cfd8'], [1, '#fde8ea']]); const r = mulberry(14); for (let i = 0; i < 40; i++) { g.fillStyle = ['#ff9db1', '#ffd36e', '#ffffff'][i % 3]; heartPath(g, r() * w, r() * h, 10 + r() * 14); g.globalAlpha = .55; g.fill(); } g.globalAlpha = 1; paperTex(g, w, h); }),
  letter: () => plain('bd_letter', 1000, 750, (g, w, h) => { vgrad(g, w, h, [[0, '#f3e7cc'], [1, '#efe0c0']]); wash(g, 0, 0, w, h, '#e8c98f', 21, 30, .05); paperTex(g, w, h, .16); }),
};

// ======================= grounds (1000 × 750: x = X, y = depth from gutter (top) to front edge (bottom)) =======================
export const GR = {
  meadow: () => plain('gr_meadow', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#dfe3dc'], [1, '#eef0e6']]);
    wash(g, 0, 0, w / 2, h, '#b9c9de', 2, 30, .07); wash(g, w / 2, 0, w / 2, h, '#e7c9cf', 3, 30, .07);
    g.strokeStyle = 'rgba(120,140,110,.35)'; g.lineWidth = 3; const r = mulberry(9); for (let i = 0; i < 120; i++) { const x = r() * w, y = 60 + r() * (h - 60); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 10); g.moveTo(x, y); g.lineTo(x + 4, y - 9); g.stroke(); }
    g.setLineDash([10, 12]); g.strokeStyle = 'rgba(160,130,90,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); g.setLineDash([]); paperTex(g, w, h);
  }),
  rooms: () => plain('gr_rooms', 1000, 750, (g, w, h) => {
    g.fillStyle = '#b48a66'; g.fillRect(0, 0, w / 2, h); g.strokeStyle = 'rgba(80,50,30,.35)'; g.lineWidth = 3; for (let y = 0; y < h; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(w / 2, y); g.stroke(); }
    g.fillStyle = '#e9d6d2'; g.fillRect(w / 2, 0, w / 2, h); g.fillStyle = '#f3b6c0'; blob(g, w * .76, h * .62, 170, 110, 5, .05); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.setLineDash([8, 10]); blob(g, w * .76, h * .62, 150, 92, 5, .05); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#8fa9c9'; blob(g, w * .24, h * .62, 150, 96, 6, .05); g.fill();
    g.fillStyle = 'rgba(40,30,60,.25)'; g.fillRect(0, 0, w, h); paperTex(g, w, h);
  }),
  map: () => plain('gr_map', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#efe3c2'], [1, '#f4ead1']]);
    wash(g, 0, 0, w, h, '#cfd9b0', 31, 40, .1);
    g.strokeStyle = '#8fc0de'; g.lineWidth = 22; g.beginPath(); g.moveTo(-20, 160); g.bezierCurveTo(260, 230, 380, 90, 560, 200); g.bezierCurveTo(720, 300, 820, 220, 1020, 300); g.stroke();
    g.strokeStyle = '#d9c39a'; g.lineWidth = 10; for (const [a, b, c, d] of [[0, 520, 1000, 470], [300, 0, 340, 750], [700, 0, 640, 750]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    const r = mulberry(33); for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h; g.fillStyle = '#9cbf86'; blob(g, x, y, 16, 12, i, .2); g.fill(); }
    // dotted route: his pin (left front) → her pin (right back)
    g.setLineDash([16, 14]); g.strokeStyle = '#d8232e'; g.lineWidth = 7; g.beginPath(); g.moveTo(170, 600); g.bezierCurveTo(380, 640, 420, 380, 600, 400); g.bezierCurveTo(760, 410, 800, 260, 830, 200); g.stroke(); g.setLineDash([]);
    // compass
    g.save(); g.translate(880, 640); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke(); g.fillStyle = '#d8232e'; g.beginPath(); g.moveTo(0, -36); g.lineTo(9, 0); g.lineTo(-9, 0); g.fill(); g.fillStyle = INK; g.beginPath(); g.moveTo(0, 36); g.lineTo(9, 0); g.lineTo(-9, 0); g.fill(); g.restore();
    g.strokeStyle = 'rgba(120,90,50,.25)'; g.lineWidth = 2; g.strokeRect(20, 20, w - 40, h - 40); paperTex(g, w, h, .16);
  }),
  road: () => plain('gr_road', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#a8c98a'], [1, '#bcd79c']]); wash(g, 0, 0, w, h, '#8db46e', 41, 40, .08);
    g.fillStyle = '#6f6e72'; g.fillRect(0, 330, w, 230); wash(g, 0, 330, w, 230, '#5c5b60', 42, 30, .1);
    g.fillStyle = '#d9d6cc'; g.fillRect(0, 322, w, 10); g.fillRect(0, 556, w, 10);
    paperTex(g, w, h, .18);
  }),
  plaza: () => plain('gr_plaza', 1000, 750, (g, w, h) => {
    g.fillStyle = '#e8dccb'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(150,120,90,.35)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    wash(g, 0, 0, w, h, '#f2c6a0', 51, 30, .08); paperTex(g, w, h);
  }),
  scrap: () => plain('gr_scrap', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#f6ecd8'], [1, '#fbf4e6']]); wash(g, 0, 0, w, h, '#f4c7c3', 61, 30, .06);
    const r = mulberry(62); g.strokeStyle = 'rgba(200,120,120,.35)'; g.lineWidth = 3; for (let i = 0; i < 18; i++) { heartPath(g, r() * w, r() * h, 8 + r() * 8); g.stroke(); }
    g.fillStyle = 'rgba(255,220,150,.6)'; for (let i = 0; i < 16; i++) { star5(g, r() * w, r() * h, 8 + r() * 6, r()); g.fill(); } paperTex(g, w, h);
  }),
  path: () => plain('gr_path', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#f5dfae'], [1, '#f3e6c6']]); wash(g, 0, 0, w, h, '#e9c27a', 71, 30, .07);
    g.fillStyle = '#fff4dc'; g.beginPath(); g.moveTo(w * .44, 0); g.lineTo(w * .56, 0); g.lineTo(w * .72, h); g.lineTo(w * .28, h); g.closePath(); g.fill();
    g.strokeStyle = '#e2b56a'; g.lineWidth = 4; g.stroke(); g.setLineDash([18, 20]); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.strokeStyle = 'rgba(226,181,106,.6)'; g.stroke(); g.setLineDash([]);
    paperTex(g, w, h);
  }),
  letter: () => plain('gr_letter', 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#f6ecd6'], [1, '#fbf3e3']]); g.strokeStyle = 'rgba(190,150,110,.35)'; g.lineWidth = 2; for (let y = 120; y < h - 40; y += 70) { g.beginPath(); g.moveTo(70, y); g.lineTo(w - 70, y); g.stroke(); }
    g.strokeStyle = 'rgba(230,140,140,.5)'; g.beginPath(); g.moveTo(120, 30); g.lineTo(120, h - 30); g.stroke(); paperTex(g, w, h, .14);
  }),
};

// ======================= props =======================
export const P = {
  cloud: (n = 0, col = '#f4f6f8') => card('cloud' + n + col, 360, 200, (g, w, h) => { blob(g, w / 2, h * .62, w * .42, h * .3, n + 3, .06); fillStroke(g, col, 6); blob(g, w * .38, h * .45, w * .2, h * .26, n + 9, .06); fillStroke(g, col, 6); blob(g, w * .62, h * .42, w * .22, h * .3, n + 11, .06); fillStroke(g, col, 6); g.fillStyle = col; g.fillRect(w * .2, h * .52, w * .6, h * .2); }),
  star: (col = '#ffd36e') => card('star' + col, 120, 120, (g, w, h) => { star5(g, w / 2, h / 2 + 4, 50); fillStroke(g, col, 6); }, { border: 6, edge: 2 }),
  heart: (col = '#ff7d96') => card('heart' + col, 120, 120, (g, w, h) => { heartPath(g, w / 2, h / 2 + 18, 54); fillStroke(g, col, 6); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(w * .34, h * .36, 9, 6, -.5, 0, 7); g.fill(); }, { border: 6, edge: 2 }),
  plane: () => card('plane', 260, 160, (g, w, h) => { g.beginPath(); g.moveTo(10, 90); g.lineTo(250, 20); g.lineTo(120, 150); g.lineTo(100, 108); g.closePath(); fillStroke(g, '#ffffff', 5); g.beginPath(); g.moveTo(10, 90); g.lineTo(250, 20); g.lineTo(100, 108); g.closePath(); fillStroke(g, '#e8eef5', 4); g.strokeStyle = 'rgba(180,140,140,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(100, 108); g.lineTo(250, 20); g.stroke(); heartPath(g, 150, 80, 12); g.fillStyle = '#ff7d96'; g.fill(); }),
  bubble: (kind = 0) => card('bubble' + kind, 300, 200, (g, w, h) => {
    rrect(g, 10, 10, w - 20, h - 60, 40); g.moveTo(kind ? w - 70 : 70, h - 52); fillStroke(g, kind ? '#ffe3ea' : '#e2f1ff', 6);
    g.beginPath(); g.moveTo(kind ? w - 90 : 60, h - 54); g.lineTo(kind ? w - 40 : 40, h - 12); g.lineTo(kind ? w - 54 : 104, h - 54); fillStroke(g, kind ? '#ffe3ea' : '#e2f1ff', 6);
    g.fillStyle = kind ? '#ff7d96' : '#5a8fd6'; if (kind === 2) { heartPath(g, w / 2, h / 2 - 2, 34); g.fill(); } else for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(w / 2 + i * 50, h / 2 - 22, 13, 0, 7); g.fill(); }
  }),
  // phone standing on the page, screen content by mode: 'feed' (her video), 'chat', 'off', 'call'
  phone: (mode, side = 0) => card('phone' + mode + side, 300, 560, (g, w, h) => {
    rrect(g, 12, 12, w - 24, h - 24, 46); fillStroke(g, side ? '#f5d3db' : '#2d3340', 7);
    rrect(g, 30, 46, w - 60, h - 92, 26);
    const scr = () => { g.beginPath(); g.roundRect(30, 46, w - 60, h - 92, 26); };
    if (mode === 'off') { g.fillStyle = '#3a4152'; g.fill(); return; }
    g.save(); scr(); g.clip();
    if (mode === 'feed') { // a short-video feed (generic UI, no logo) showing her
      vgrad(g, w, h, [[0, '#ffd6de'], [1, '#c8dcf5']]);
      const her = charCard('her', { expr: 'smile', arms: 'wave', t: .3 }, 1).c, s = 220 / her.width; g.drawImage(her, w / 2 - 110 - 10, 120, 220, her.height * s);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(30, h - 150, w - 60, 104);
      for (let i = 0; i < 3; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(w - 64, 230 + i * 74, 20, 0, 7); g.fill(); }
      heartPath(g, w - 64, 236, 13); g.fillStyle = '#ff5e7e'; g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(52, h - 128, 120, 12); g.fillRect(52, h - 104, 170, 10); g.fillRect(52, h - 84, 90, 10);
    } else if (mode === 'chat' || mode === 'chat2') {
      vgrad(g, w, h, [[0, side ? '#fff0f3' : '#eef5ff'], [1, side ? '#ffe3ea' : '#dfeafa']]);
      const rows = mode === 'chat2' ? 5 : 3;
      for (let i = 0; i < rows; i++) { const mine = (i + side) % 2 === 0, bw = 120 + (i * 37 % 60), y = 90 + i * 74; rrect(g, mine ? w - 50 - bw : 50, y, bw, 46, 20); g.fillStyle = mine ? (side ? '#ff9db1' : '#7fb2f0') : '#ffffff'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(80,60,60,.35)'; g.stroke(); }
    } else if (mode === 'night') {
      vgrad(g, w, h, [[0, '#cfe6ff'], [1, '#ffd9e2']]);
      for (let i = 0; i < 4; i++) { const mine = (i + side) % 2 === 0, bw = 110 + (i * 41 % 70), y = 110 + i * 80; rrect(g, mine ? w - 50 - bw : 50, y, bw, 50, 22); g.fillStyle = mine ? '#ffffff' : (side ? '#ff9db1' : '#7fb2f0'); g.fill(); }
      heartPath(g, w / 2, h - 110, 26); g.fillStyle = '#ff6f8a'; g.fill();
    }
    g.restore();
    g.fillStyle = '#1d2129'; rrect(g, w / 2 - 44, 24, 88, 14, 7); g.fill();
  }),
  // short paper human-made props
  lamp: () => card('lamp', 220, 360, (g, w, h) => { g.beginPath(); g.moveTo(40, 20); g.lineTo(180, 20); g.lineTo(150, 120); g.lineTo(70, 120); g.closePath(); fillStroke(g, '#f3d27a', 6); limb(g, [[110, 120], [110, 320]], 12, '#7a6a5a', 4); rrect(g, 50, 320, 120, 26, 10); fillStroke(g, '#7a6a5a', 5); }),
  window: (kind) => card('win' + kind, 420, 380, (g, w, h) => {
    rrect(g, 14, 14, w - 28, h - 28, 12); fillStroke(g, '#f2e6cf', 7);
    rrect(g, 40, 40, w - 80, h - 80, 6); g.save(); g.clip();
    if (kind === 'sea') { vgrad(g, w, h, [[0, '#2f416e'], [.55, '#4d6a9c'], [.56, '#3b78a8'], [1, '#2e5d86']]); g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(w * .7, 110, 30, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); for (let x = 40; x < w - 40; x += 10) g.lineTo(x, 240 + i * 26 + Math.sin(x * .06 + i) * 6); g.stroke(); } g.fillStyle = 'rgba(255,240,180,.5)'; g.fillRect(w * .7 - 8, 200, 16, 140); }
    else { vgrad(g, w, h, [[0, '#26375e'], [1, '#43557f']]); g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(w * .32, 120, 34, 0, 7); g.fill(); g.fillStyle = '#26375e'; g.beginPath(); g.arc(w * .32 + 16, 108, 30, 0, 7); g.fill(); const r = mulberry(3); g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(50 + r() * (w - 100), 50 + r() * 240, 2, 0, 7); g.fill(); } g.fillStyle = '#1d2a49'; for (let i = 0; i < 6; i++) g.fillRect(40 + i * 60, 260 - (i * 37 % 90), 46, 200); g.fillStyle = '#ffd36e'; for (let i = 0; i < 10; i++) g.fillRect(52 + (i * 53 % 330), 280 + (i * 29 % 50), 8, 10); }
    g.restore(); g.strokeStyle = '#d7c6a8'; g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w / 2, h - 40); g.moveTo(40, h / 2); g.lineTo(w - 40, h / 2); g.stroke();
  }),
  bed: () => card('bed', 520, 260, (g, w, h) => { rrect(g, 20, 80, w - 40, 140, 20); fillStroke(g, '#f7c9d2', 6); rrect(g, 30, 60, 150, 70, 30); fillStroke(g, '#fff', 6); rrect(g, 170, 90, w - 200, 120, 24); fillStroke(g, '#f9a8bb', 6); limb(g, [[40, 220], [40, 250]], 14, '#c79b7a', 4); limb(g, [[w - 40, 220], [w - 40, 250]], 14, '#c79b7a', 4); }),
  desk: () => card('desk', 520, 300, (g, w, h) => { rrect(g, 10, 60, w - 20, 40, 8); fillStroke(g, '#c8996c', 6); limb(g, [[50, 100], [50, 290]], 18, '#a77b55', 4); limb(g, [[w - 50, 100], [w - 50, 290]], 18, '#a77b55', 4); rrect(g, 330, 10, 120, 50, 6); fillStroke(g, '#8fb3d9', 5); }),
  calendarWall: (d) => card('calw' + d, 200, 230, (g, w, h) => { rrect(g, 14, 30, w - 28, h - 44, 14); fillStroke(g, '#fffaf0', 6); rrect(g, 14, 30, w - 28, 50, 14); fillStroke(g, '#ff8a9c', 6); g.fillStyle = INK; g.font = '96px Digits'; g.textAlign = 'center'; g.fillText(String(d), w / 2, 180); limb(g, [[60, 18], [60, 44]], 8, '#888', 3); limb(g, [[140, 18], [140, 44]], 8, '#888', 3); }, { border: 6, edge: 3 }),
  wall: () => card('wall', 120, 520, (g, w, h) => { rrect(g, 20, 10, 80, 500, 10); fillStroke(g, '#d9cdb8', 6); g.strokeStyle = 'rgba(120,100,70,.3)'; g.lineWidth = 3; for (let y = 40; y < 500; y += 40) { g.beginPath(); g.moveTo(24, y); g.lineTo(96, y); g.stroke(); } }),
  cup: (col) => card('cup' + col, 120, 140, (g, w, h) => { g.beginPath(); g.moveTo(20, 20); g.lineTo(100, 20); g.lineTo(88, 130); g.lineTo(32, 130); g.closePath(); fillStroke(g, col, 6); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(36, 40); g.lineTo(42, 110); g.stroke(); }, { border: 6, edge: 3 }),
  mpin: (who) => card('pin' + who, 200, 290, (g, w, h) => {
    g.beginPath(); g.moveTo(w / 2, h - 10); g.bezierCurveTo(20, 150, 10, 30, w / 2, 20); g.bezierCurveTo(w - 10, 30, w - 20, 150, w / 2, h - 10); fillStroke(g, who === 'him' ? '#2d3340' : '#fff9f2', 6);
    g.beginPath(); g.arc(w / 2, 100, 62, 0, 7); g.fillStyle = who === 'him' ? '#2d3340' : '#fff'; g.fill(); g.save(); g.translate(w / 2, 108); if (who === 'him') catHim(g, 0, 0, 1.8); else catHer(g, 0, 0, 1.25); g.restore();
  }),
  tree: (n = 0, col = '#7fb267') => card('tree' + n + col, 300, 460, (g, w, h) => { limb(g, [[w / 2, h - 10], [w / 2, h * .5]], 34, '#8b6244', 5); blob(g, w / 2, h * .36, 128, 140, n + 2, .08); fillStroke(g, col, 6); blob(g, w * .4, h * .3, 60, 50, n + 7, .1); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); }),
  bush: (n = 0) => card('bush' + n, 300, 160, (g, w, h) => { blob(g, w / 2, h * .6, 136, 64, n + 4, .1); fillStroke(g, '#6fa557', 6); }),
  // the overpass from the riding photo: concrete deck on an ivy-covered pillar
  overpass: () => card('overpass', 900, 600, (g, w, h) => {
    g.beginPath(); g.moveTo(0, 30); g.lineTo(w, 60); g.lineTo(w, 150); g.lineTo(0, 130); g.closePath(); fillStroke(g, '#c9c4bb', 7);
    g.beginPath(); g.moveTo(0, 130); g.lineTo(w, 150); g.lineTo(w, 180); g.lineTo(0, 160); g.closePath(); fillStroke(g, '#8f8a82', 6);
    rrect(g, w * .42, 150, 140, h - 160, 8); fillStroke(g, '#bdb7ad', 7);
    const r = mulberry(77); for (let i = 0; i < 140; i++) { g.fillStyle = ['#4f8f3a', '#6aa84f', '#3d7a2c'][i % 3]; blob(g, w * .42 + 10 + r() * 120, 170 + r() * (h - 200), 10 + r() * 14, 8 + r() * 10, i, .3); g.fill(); }
  }),
  building: (n, col) => card('bld' + n + col, 300, 600, (g, w, h) => { const bh = 300 + (n * 97 % 280); rrect(g, 20, h - bh, w - 40, bh - 10, 8); fillStroke(g, col, 6); g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = h - bh + 30; y < h - 50; y += 56) for (let x = 46; x < w - 60; x += 56) g.fillRect(x, y, 30, 34); }),
  lamppost: () => card('lpost', 120, 520, (g, w, h) => { limb(g, [[60, h - 10], [60, 60], [90, 40]], 12, '#d5d2cc', 4); g.beginPath(); g.ellipse(96, 44, 22, 10, 0, 0, 7); fillStroke(g, '#f2efe8', 4); }),
  dash: () => card('dash', 240, 40, (g, w, h) => { rrect(g, 10, 8, w - 20, 24, 6); g.fillStyle = '#f6f3ea'; g.fill(); }, { border: 0, edge: 0, grainA: .05 }),
  speed: () => card('speed', 600, 30, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.95)'); g.fillStyle = gr; rrect(g, 0, 8, w, 14, 7); g.fill(); }, { border: 0, edge: 0, grainA: 0 }),
  mall: () => card('mall', 1000, 640, (g, w, h) => {
    rrect(g, 20, 120, w - 40, h - 130, 14); fillStroke(g, '#f1e3cf', 7);
    rrect(g, 60, 40, w - 120, 110, 12); fillStroke(g, '#e98f80', 7);
    g.fillStyle = '#fff'; g.font = '72px LyricZh'; g.textAlign = 'center'; g.fillText('商场', w / 2, 120);
    for (let i = 0; i < 4; i++) { rrect(g, 70 + i * 220, 200, 200, 200, 8); const gr = g.createLinearGradient(0, 200, 0, 400); gr.addColorStop(0, '#bfe0f2'); gr.addColorStop(1, '#fbe9c8'); fillStroke(g, gr, 6); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 8; g.beginPath(); g.moveTo(90 + i * 220, 380); g.lineTo(150 + i * 220, 220); g.stroke(); }
    rrect(g, w / 2 - 110, 430, 220, h - 440, 8); fillStroke(g, '#d7ecf6', 6); g.beginPath(); g.moveTo(w / 2, 430); g.lineTo(w / 2, h - 10); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    for (const x of [120, w - 220]) { rrect(g, x, 440, 100, 170, 8); fillStroke(g, '#f6c7b9', 5); }
    // string lights
    g.strokeStyle = '#8a6a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, 170); g.quadraticCurveTo(w / 2, 230, w - 30, 170); g.stroke(); for (let i = 1; i < 14; i++) { const x = 30 + i * (w - 60) / 14, y = 170 + Math.sin(i / 14 * Math.PI) * 30; g.fillStyle = i % 2 ? '#ffe08a' : '#ffb3c1'; g.beginPath(); g.arc(x, y + 8, 9, 0, 7); g.fill(); }
  }),
  planter: () => card('planter', 260, 240, (g, w, h) => { rrect(g, 40, 130, 180, 100, 14); fillStroke(g, '#d9a066', 6); blob(g, w / 2, 110, 110, 80, 8, .1); fillStroke(g, '#6fa557', 6); for (let i = 0; i < 5; i++) { g.fillStyle = ['#ff8fa3', '#ffd36e', '#fff'][i % 3]; g.beginPath(); g.arc(70 + i * 30, 80 + (i % 2) * 40, 10, 0, 7); g.fill(); } }),
  flower: (col = '#ff8fa3', n = 0) => card('flower' + col + n, 180, 300, (g, w, h) => { limb(g, [[w / 2, h - 6], [w / 2 + 6, 130]], 8, '#6aa66a', 3.5); g.beginPath(); g.ellipse(w / 2 - 22, 210, 26, 12, -.5, 0, 7); fillStroke(g, '#7fbf6a', 4); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + n; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 34, 96 + Math.sin(a) * 34, 28, 22, a, 0, 7); fillStroke(g, col, 5); } g.beginPath(); g.arc(w / 2, 96, 20, 0, 7); fillStroke(g, '#ffd36e', 5); }),
  firework: (col, n = 0) => card('fw' + col + n, 400, 400, (g, w, h) => { const r = mulberry(n + 1); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, l = 150 + r() * 30; g.save(); g.translate(w / 2, h / 2); g.rotate(a); g.beginPath(); g.moveTo(30, -6); g.lineTo(l, -12); g.lineTo(l + 18, 0); g.lineTo(l, 12); g.lineTo(30, 6); g.closePath(); fillStroke(g, i % 2 ? col : '#fff4c9', 4); g.restore(); } star5(g, w / 2, h / 2, 34); fillStroke(g, '#ffd36e', 4); }),
  // the anniversary calendar: big tear-off pad, page shows m.d
  calendar: (txt, small) => card('cal' + txt, 640, 760, (g, w, h) => {
    rrect(g, 20, 70, w - 40, h - 90, 34); fillStroke(g, '#fffaf0', 8);
    rrect(g, 20, 70, w - 40, 170, 34); fillStroke(g, '#e8495d', 8); g.fillStyle = '#e8495d'; g.fillRect(28, 180, w - 56, 56);
    for (const x of [160, w - 160]) { rrect(g, x - 18, 30, 36, 90, 18); fillStroke(g, '#c9c3b6', 6); }
    g.fillStyle = '#fff'; g.font = '86px Digits'; g.textAlign = 'center'; g.fillText(small, w / 2, 200);
    let fs = txt.length > 2 ? 300 : 330; g.font = fs + 'px Digits'; while (g.measureText(txt).width > w - 90) { fs -= 4; g.font = fs + 'px Digits'; }
    g.fillStyle = INK; g.fillText(txt, w / 2, h - 170 + (txt.length > 2 ? -40 : 50));
    g.strokeStyle = 'rgba(120,100,80,.25)'; g.lineWidth = 3; for (let y = 280; y < h - 40; y += 140) { g.beginPath(); g.moveTo(60, y); g.lineTo(w - 60, y); g.stroke(); }
  }),
  stamp: () => card('stamp', 220, 220, (g, w, h) => { heartPath(g, w / 2, h / 2 + 40, 92); fillStroke(g, '#f2b632', 7, '#a8741a'); g.strokeStyle = '#fff7d8'; g.lineWidth = 5; heartPath(g, w / 2, h / 2 + 34, 70); g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]); }, { border: 6, edge: 3 }),
  table: (col = '#c8996c') => card('table' + col, 760, 300, (g, w, h) => { rrect(g, 10, 20, w - 20, 70, 14); fillStroke(g, col, 7); rrect(g, 40, 90, w - 80, 190, 10); fillStroke(g, '#8a5f40', 7); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(30, 30, w - 60, 12); }),
  tea: () => card('tea', 150, 300, (g, w, h) => { limb(g, [[w / 2 + 8, 10], [w / 2 + 2, 120]], 8, '#ffffff', 3); g.beginPath(); g.moveTo(20, 90); g.lineTo(130, 90); g.lineTo(116, 290); g.lineTo(34, 290); g.closePath(); fillStroke(g, 'rgba(255,250,250,.85)', 5); g.beginPath(); g.moveTo(26, 170); g.lineTo(124, 170); g.lineTo(116, 290); g.lineTo(34, 290); g.closePath(); g.fillStyle = '#f6b9c2'; g.fill(); rrect(g, 30, 200, 90, 80, 6); g.fillStyle = '#f2e3c4'; g.fill(); g.beginPath(); g.ellipse(w / 2, 90, 58, 14, 0, 0, 7); fillStroke(g, 'rgba(255,255,255,.9)', 5); }, { border: 6, edge: 3 }),
  fries: () => card('fries', 140, 200, (g, w, h) => { for (let i = 0; i < 7; i++) { rrect(g, 24 + i * 14, 20 + (i % 3) * 12, 14, 100, 4); fillStroke(g, '#ffd166', 3); } g.beginPath(); g.moveTo(14, 80); g.lineTo(126, 80); g.lineTo(110, 190); g.lineTo(30, 190); g.closePath(); fillStroke(g, '#e8495d', 5); }, { border: 6, edge: 3 }),
  barrier: () => card('barrier', 160, 260, (g, w, h) => { g.beginPath(); g.moveTo(30, 250); g.lineTo(40, 20); g.lineTo(120, 20); g.lineTo(130, 250); g.closePath(); fillStroke(g, '#f2c230', 6); g.save(); g.clip(); g.fillStyle = '#2b2f3a'; for (let y = 10; y < 260; y += 70) g.fillRect(0, y, w, 34); g.restore(); }),
  bench: () => card('bench', 640, 240, (g, w, h) => { for (let i = 0; i < 4; i++) { rrect(g, 20, 40 + i * 30, w - 40, 20, 6); fillStroke(g, '#cfd2d6', 5); } limb(g, [[60, 150], [60, 230]], 14, '#7b7f86', 4); limb(g, [[w - 60, 150], [w - 60, 230]], 14, '#7b7f86', 4); }),
  polaroid: (src, key, rot) => cached('pol' + key, () => { const iw = 300, ih = 340, c = mk(iw, ih + 70), g = c.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, iw, ih + 70); const s = Math.max((iw - 30) / src.width, (ih - 30) / src.height), sw = (iw - 30) / s, sh = (ih - 30) / s; g.drawImage(src, (src.width - sw) / 2, Math.max(0, (src.height - sh) * .35), sw, sh, 15, 15, iw - 30, ih - 30); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; g.strokeRect(15, 15, iw - 30, ih - 30); heartPath(g, iw - 40, ih + 36, 14); g.fillStyle = '#ff7d96'; g.fill(); return finish(c, { border: 3, edge: 3, grainA: .06 }); }),
  tape: () => card('tape', 160, 60, (g, w, h) => { g.fillStyle = 'rgba(255,214,140,.75)'; g.fillRect(10, 10, w - 20, h - 20); }, { border: 0, edge: 0 }),
  cupPhone: (flip) => card('cupph' + flip, 140, 160, (g, w, h) => { g.beginPath(); g.moveTo(20, 30); g.lineTo(120, 30); g.lineTo(100, 150); g.lineTo(40, 150); g.closePath(); fillStroke(g, flip ? '#ffb3c1' : '#9fc4ee', 6); g.beginPath(); g.ellipse(70, 30, 50, 12, 0, 0, 7); fillStroke(g, '#fff', 5); }, { border: 6, edge: 3 }),
  sun: () => card('sun', 300, 300, (g, w, h) => { for (let i = 0; i < 12; i++) { g.save(); g.translate(w / 2, h / 2); g.rotate(i / 12 * 6.28); g.beginPath(); g.moveTo(80, -14); g.lineTo(136, 0); g.lineTo(80, 14); g.closePath(); fillStroke(g, '#ffd36e', 4); g.restore(); } g.beginPath(); g.arc(w / 2, h / 2, 78, 0, 7); fillStroke(g, '#ffc94d', 6); }),
  frame: () => card('pframe', 420, 760, (g, w, h) => { g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 60); g.roundRect(44, 70, w - 88, h - 140, 30); g.fillStyle = '#2d3340'; g.fill('evenodd'); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#1d2129'; rrect(g, w / 2 - 50, 30, 100, 18, 9); g.fill(); heartPath(g, w - 90, h - 110, 22); g.fillStyle = '#ff5e7e'; g.fill(); }),
  // cover with the two cats (black cat ♥ white cat) and the title
  cover: (end) => plain('coverart' + (end ? 1 : 0), 1000, 750, (g, w, h) => {
    vgrad(g, w, h, [[0, '#9a4545'], [1, '#7a3030']]); g.globalAlpha = .25; g.fillStyle = g.createPattern(grain(), 'repeat'); g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    g.strokeStyle = '#e9c27a'; g.lineWidth = 5; rrect(g, 40, 40, w - 80, h - 80, 26); g.stroke(); g.lineWidth = 2; rrect(g, 56, 56, w - 112, h - 112, 20); g.stroke();
    // two cats from their shirts, gold foil framed
    g.fillStyle = '#f6edd8'; blob(g, w / 2, h * .52, 270, 190, 4, .02); g.fill();
    catHim(g, w / 2 - 110, h * .55, 4.2); catHer(g, w / 2 + 110, h * .56, 3.3);
    heartPath(g, w / 2, h * .41, 30); g.fillStyle = '#e8495d'; g.fill();
    g.fillStyle = '#f2d08a'; g.font = '84px LyricZh'; g.textAlign = 'center'; g.fillText('把回忆拼好给你', w / 2, 170);
    if (end) { rrect(g, w / 2 - 380, h - 190, 760, 110, 16); g.fillStyle = '#f6edd8'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#e9c27a'; g.stroke(); g.fillStyle = '#5a2a22'; g.font = '58px HandZh'; g.fillText('我们的故事，未来再续……', w / 2, h - 116); }
  }),
};
