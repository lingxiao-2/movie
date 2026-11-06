// His red sport motorcycle (from the riding photo), side view facing right, as a paper card.
// state: 'ride' (him riding: white helmet, black jacket, khaki trousers, white shoes), 'empty'.
import { INK, mk, finish, fillStroke, limb, rrect } from './paper.js';
import { helmetArt } from './chars.js';

export const MW = 920, MH = 560;
const RED = '#d8232e', RED_S = '#a8161f', BLK = '#1d1d21';

function wheel(g, x, y, ang, front) {
  g.save(); g.translate(x, y);
  g.beginPath(); g.arc(0, 0, 104, 0, 7); fillStroke(g, '#1a1a1c', 5);
  g.beginPath(); g.arc(0, 0, 80, 0, 7); g.fillStyle = '#2e2e33'; g.fill();
  g.beginPath(); g.arc(0, 0, 80, 0, 7); g.lineWidth = 5; g.strokeStyle = RED; g.stroke(); // red rim stripe
  if (front) { g.beginPath(); g.arc(0, 0, 50, 0, 7); g.fillStyle = '#c9ccd2'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#8d9097'; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + ang; g.beginPath(); g.arc(Math.cos(a) * 38, Math.sin(a) * 38, 4, 0, 7); g.fill(); } }
  g.rotate(ang); g.strokeStyle = '#46464d'; g.lineWidth = 10; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.beginPath(); g.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); g.quadraticCurveTo(Math.cos(a + .25) * 45, Math.sin(a + .25) * 45, Math.cos(a + .1) * 76, Math.sin(a + .1) * 76); g.stroke(); }
  g.beginPath(); g.arc(0, 0, 16, 0, 7); fillStroke(g, '#bfc2c8', 3);
  // tyre tread marks so the spin reads
  g.strokeStyle = '#3a3a3e'; g.lineWidth = 3; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; g.beginPath(); g.moveTo(Math.cos(a) * 90, Math.sin(a) * 90); g.lineTo(Math.cos(a) * 100, Math.sin(a) * 100); g.stroke(); }
  g.restore();
}

export function drawMoto(ang, state, S = 1.6) {
  const c = mk(MW * S, MH * S), g = c.getContext('2d'); g.scale(S, S); g.lineJoin = 'round'; g.lineCap = 'round';
  const RW = [210, 440], FW = [712, 440];
  // swingarm, exhaust
  limb(g, [RW, [400, 392]], 22, BLK, 4);
  g.beginPath(); g.moveTo(330, 410); g.lineTo(150, 352); g.lineTo(138, 382); g.lineTo(320, 440); g.closePath(); fillStroke(g, '#c3c6cc', 4.5);
  g.fillStyle = '#e9ebef'; g.fillRect(170, 362, 90, 6);
  wheel(g, RW[0], RW[1], ang, false);
  // front fork (gold) + wheel
  limb(g, [[668, 270], FW], 20, '#d6a838', 4);
  wheel(g, FW[0], FW[1], ang, true);
  // engine block
  rrect(g, 360, 330, 180, 120, 22); fillStroke(g, '#2a2a2f', 4.5);
  g.beginPath(); g.arc(430, 400, 26, 0, 7); fillStroke(g, '#55555c', 3.5); g.beginPath(); g.arc(500, 380, 16, 0, 7); fillStroke(g, '#6a6a72', 3);
  // tail section (upswept, red), seat (black)
  g.beginPath(); g.moveTo(150, 206); g.lineTo(196, 204); g.lineTo(420, 258); g.lineTo(404, 300); g.lineTo(236, 290); g.quadraticCurveTo(190, 262, 150, 206); g.closePath(); fillStroke(g, RED, 4.5);
  g.beginPath(); g.moveTo(186, 236); g.lineTo(260, 252); g.lineTo(252, 270); g.lineTo(200, 260); g.closePath(); g.fillStyle = BLK; g.fill();
  g.beginPath(); g.moveTo(240, 250); g.quadraticCurveTo(330, 236, 430, 256); g.lineTo(430, 270); g.quadraticCurveTo(330, 262, 236, 268); g.closePath(); fillStroke(g, BLK, 4);
  // tail light + plate holder
  g.fillStyle = '#ff5a5a'; g.fillRect(146, 208, 14, 9);
  limb(g, [[170, 280], [150, 330]], 7, BLK, 3); rrect(g, 128, 322, 44, 36, 4); fillStroke(g, '#2a2a2f', 3.5);
  // tank
  g.beginPath(); g.moveTo(420, 258); g.bezierCurveTo(450, 214, 540, 204, 590, 232); g.lineTo(560, 300); g.lineTo(430, 300); g.closePath(); fillStroke(g, RED, 4.5);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(462, 236); g.quadraticCurveTo(510, 220, 556, 230); g.stroke();
  // front fairing: big red shell, black lower, white/black graphics, sharp nose
  const fair = () => { g.beginPath(); g.moveTo(540, 238); g.lineTo(700, 226); g.bezierCurveTo(760, 236, 812, 264, 836, 300); g.lineTo(800, 318); g.bezierCurveTo(740, 330, 700, 360, 680, 420); g.lineTo(560, 430); g.bezierCurveTo(520, 380, 470, 340, 430, 330); g.lineTo(460, 296); g.closePath(); };
  fair(); g.fillStyle = RED; g.fill();
  g.save(); fair(); g.clip(); g.fillStyle = RED_S; g.beginPath(); g.moveTo(430, 330); g.lineTo(800, 318); g.lineTo(700, 440); g.lineTo(430, 440); g.fill();
  g.fillStyle = BLK; g.beginPath(); g.moveTo(520, 360); g.lineTo(700, 340); g.lineTo(690, 440); g.lineTo(540, 440); g.fill();
  g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(560, 300); g.lineTo(760, 290); g.lineTo(752, 300); g.lineTo(566, 312); g.fill();
  g.fillStyle = BLK; g.beginPath(); g.moveTo(600, 252); g.lineTo(720, 244); g.lineTo(700, 268); g.lineTo(620, 272); g.fill();
  g.restore();
  fair(); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke();
  // headlight (sharp LED) and front fender
  g.beginPath(); g.moveTo(770, 278); g.lineTo(830, 296); g.lineTo(812, 306); g.lineTo(764, 292); g.closePath(); fillStroke(g, '#eef8ff', 3);
  g.beginPath(); g.moveTo(640, 340); g.quadraticCurveTo(712, 300, 800, 352); g.lineTo(790, 364); g.quadraticCurveTo(712, 320, 650, 356); g.closePath(); fillStroke(g, RED, 4);
  // smoked black windscreen
  g.beginPath(); g.moveTo(690, 228); g.bezierCurveTo(712, 178, 750, 158, 772, 162); g.lineTo(790, 250); g.closePath(); g.fillStyle = 'rgba(30,30,36,.88)'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(724, 196); g.lineTo(752, 178); g.stroke();
  // mirror
  limb(g, [[700, 232], [716, 196]], 5, BLK, 2.5); g.beginPath(); g.ellipse(722, 190, 16, 9, -.3, 0, 7); fillStroke(g, BLK, 3);
  // footpeg
  g.fillStyle = '#9a9ca2'; g.fillRect(410, 380, 34, 8);
  if (state === 'ride') {
    // him riding: lean forward, gloves on the clip-ons
    const hip = [372, 230], sh = [520, 150], knee = [512, 302], foot = [430, 378];
    limb(g, [hip, knee], 54, '#c9b48e', 4.5); // khaki thigh
    limb(g, [knee, [foot[0] + 6, foot[1] - 20]], 46, '#c9b48e', 4.5);
    g.beginPath(); g.ellipse(foot[0] + 4, foot[1] - 4, 32, 16, 0, 0, 7); fillStroke(g, '#f7f7f3', 4.5);
    g.beginPath(); g.moveTo(hip[0] - 34, hip[1] + 24); g.bezierCurveTo(hip[0] - 40, hip[1] - 60, sh[0] - 70, sh[1] - 34, sh[0] + 6, sh[1] - 22);
    g.bezierCurveTo(sh[0] + 38, sh[1], sh[0] + 20, sh[1] + 40, sh[0] - 6, sh[1] + 60); g.bezierCurveTo(hip[0] + 60, hip[1] + 10, hip[0] + 40, hip[1] + 40, hip[0] - 34, hip[1] + 24); g.closePath();
    fillStroke(g, '#232327', 4.5);
    g.strokeStyle = '#3d3d44'; g.lineWidth = 3; g.beginPath(); g.moveTo(hip[0] - 10, hip[1] - 20); g.quadraticCurveTo(sh[0] - 70, sh[1] - 10, sh[0] - 10, sh[1] - 8); g.stroke();
    limb(g, [[sh[0] - 8, sh[1] + 6], [600, 214], [664, 228]], 34, '#232327', 4.5); // arm
    g.beginPath(); g.ellipse(672, 230, 18, 15, 0, 0, 7); fillStroke(g, '#1a1a1d', 4); g.fillStyle = '#d23c3c'; g.fillRect(662, 222, 10, 6); // glove
    helmetArt(g, sh[0] + 34, sh[1] - 52, 1.18, 1);
  }
  return c;
}
const CACHE = new Map();
export function motoCard(ang, state = 'ride') {
  const q = Math.round(((ang % (Math.PI * 2 / 5)) + Math.PI * 2 / 5) % (Math.PI * 2 / 5) / (Math.PI * 2 / 5) * 8) % 8; // 5-fold spokes, 8 steps
  const key = state + q;
  let v = CACHE.get(key);
  if (!v) { v = finish(drawMoto(q / 8 * Math.PI * 2 / 5, state), { border: 9, edge: 4 }); CACHE.set(key, v); }
  return v;
}
