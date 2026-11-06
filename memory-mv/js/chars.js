// The two paper puppets, drawn from the user's photos. One function draws every pose, so every shot reuses
// the same face, glasses, hair, cat prints and clothes. Design units: 360 × 640, feet at y = 616.
import { INK, mk, finish, blob, fillStroke, limb, ik, rrect, crescent } from './paper.js';

export const DW = 360, DH = 640;
const SK_HIM = '#f1cdb1', SK_HIM_S = '#e2b394', SK_HER = '#f8ddcc', SK_HER_S = '#ecc3ad';
const HAIR_HIM = '#1e1b1c', HAIR_HER = '#3a2a24', HAIR_HER_L = '#5a4136';
const SHIRT_HIM = '#2a2a2e', SHIRT_HER = '#fbf9f2', PANTS_HIM = '#25252a', PANTS_HER = '#9db6d4';
const BLUSH = 'rgba(240,130,130,.45)';

// ---------- cat prints (from the photos) ----------
// him: black cat head outlined in white, a small white kitten peeking below with two paws
function catHim(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  // white kitten (below)
  g.beginPath(); g.ellipse(0, 14, 17, 12, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2.4; g.strokeStyle = '#1b1b1d'; g.stroke();
  g.fillStyle = '#1b1b1d'; g.beginPath(); g.arc(-6, 13, 2.2, 0, 7); g.arc(6, 13, 2.2, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-12, 24, 6, 4.5, 0, 0, 7); g.ellipse(12, 24, 6, 4.5, 0, 0, 7); g.fill(); g.stroke();
  // black cat head (top) with white outline, white face patch
  g.beginPath(); g.moveTo(-22, 2); g.lineTo(-24, -24); g.lineTo(-11, -14); g.quadraticCurveTo(0, -18, 11, -14); g.lineTo(24, -24); g.lineTo(22, 2); g.quadraticCurveTo(0, 10, -22, 2); g.closePath();
  g.fillStyle = '#1b1b1d'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-8, -6, 3, 3.4, 0, 0, 7); g.ellipse(8, -6, 3, 3.4, 0, 0, 7); g.fill();
  g.restore();
}
// her: big white cat with a fuzzy black outline, pink cheeks, two paws
function catHer(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const head = () => { g.beginPath(); g.moveTo(-30, 8); g.quadraticCurveTo(-34, -10, -28, -20); g.lineTo(-30, -40); g.lineTo(-12, -28); g.quadraticCurveTo(0, -31, 12, -28); g.lineTo(30, -40); g.lineTo(28, -20); g.quadraticCurveTo(34, -10, 30, 8); g.quadraticCurveTo(0, 20, -30, 8); g.closePath(); };
  head(); g.fillStyle = '#fff'; g.fill();
  g.setLineDash([2.2, 1.6]); g.lineWidth = 4.2; g.strokeStyle = '#262323'; g.stroke(); g.setLineDash([]); g.lineWidth = 2; g.stroke();
  g.fillStyle = 'rgba(245,160,170,.8)'; g.beginPath(); g.ellipse(-17, 0, 6, 4, 0, 0, 7); g.ellipse(17, 0, 6, 4, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(245,170,180,.7)'; g.beginPath(); g.moveTo(-26, -32); g.lineTo(-17, -26); g.lineTo(-25, -22); g.fill(); g.beginPath(); g.moveTo(26, -32); g.lineTo(17, -26); g.lineTo(25, -22); g.fill();
  g.fillStyle = '#262323'; g.beginPath(); g.ellipse(-10, -9, 3.4, 4.6, 0, 0, 7); g.ellipse(10, -9, 3.4, 4.6, 0, 0, 7); g.fill();
  // paws
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 17, 17, 9, 6.5, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.setLineDash([2, 1.5]); g.lineWidth = 3.2; g.stroke(); g.setLineDash([]); g.lineWidth = 1.4; g.stroke(); }
  g.restore();
}
export { catHim, catHer };

// ---------- faces ----------
function eyesHim(g, cx, cy, k, expr, blink, look) {
  const ex = 40, ox = k * 22 + look * 5;
  for (const s of [-1, 1]) {
    const x = cx + s * ex + ox, y = cy;
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    if (blink || expr === 'laugh' || expr === 'shy') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, y + 4, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (expr === 'surprise' || expr === 'bite') { g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 2, y - 3, 2.4, 0, 7); g.fill(); }
    else if (expr === 'miss') { g.beginPath(); g.ellipse(x, y + 3, 6, 6.5, 0, 0, 7); g.fill(); g.lineWidth = 3; g.beginPath(); g.moveTo(x - 9, y - 6); g.lineTo(x + 8, y - 4); g.stroke(); }
    else { g.beginPath(); g.ellipse(x, y + 1, 8.5, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 3, y - 3, 3, 0, 7); g.fill(); g.beginPath(); g.arc(x + 3, y + 5, 1.4, 0, 7); g.fill(); }
  }
}
function glasses(g, cx, cy, k) {
  // the identity anchor: big black square frames
  const ox = k * 22, w = 82, h = 64, ex = 44;
  g.save(); g.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const x = cx + s * ex + ox, ww = w * (1 - s * k * .18);
    rrect(g, x - ww / 2, cy - h / 2, ww, h, 17);
    g.fillStyle = 'rgba(205,225,240,.22)'; g.fill();
    g.lineWidth = 9.5; g.strokeStyle = '#151314'; g.stroke();
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(x - ww / 2 + 14, cy - h / 2 + 12); g.lineTo(x - ww / 2 + 26, cy - h / 2 + 8); g.stroke(); // glint on the frame
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + ww / 2 - 22, cy - 18); g.lineTo(x + ww / 2 - 34, cy + 14); g.stroke(); // lens glare
  }
  // bridge + temples
  g.strokeStyle = '#151314'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx + ox - 6, cy - 12); g.quadraticCurveTo(cx + ox, cy - 17, cx + ox + 6, cy - 12); g.stroke();
  g.lineWidth = 7; g.beginPath();
  if (k < .45) { g.moveTo(cx + ox - ex - w / 2 + 2, cy - 18); g.lineTo(cx - 100 + Math.max(0, k) * 30, cy - 10); }
  if (k > -.45) { g.moveTo(cx + ox + ex + w / 2 - 2, cy - 18); g.lineTo(cx + 100 + Math.min(0, k) * 30, cy - 10); }
  g.stroke(); g.restore();
}
function mouthHim(g, x, y, expr) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (expr === 'bite') { g.beginPath(); g.ellipse(x, y + 6, 20, 22, 0, 0, 7); fillStroke(g, '#8a3a36', 4.5); g.beginPath(); g.ellipse(x, y + 18, 12, 7, 0, 0, 7); g.fillStyle = '#d9686a'; g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 12, y - 14, 24, 7); return; }
  if (expr === 'surprise') { g.beginPath(); g.ellipse(x, y + 4, 9, 11, 0, 0, 7); fillStroke(g, '#8a3a36', 4); return; }
  if (expr === 'miss' || expr === 'calm') { g.lineWidth = 4.5; g.strokeStyle = INK; g.beginPath(); g.moveTo(x - 12, y + 2); g.quadraticCurveTo(x, y + (expr === 'calm' ? 9 : 3), x + 12, y + 2); g.stroke(); return; }
  // big open smile with teeth (from the photos)
  const w = expr === 'shy' ? 22 : 32, h = expr === 'shy' ? 14 : 22;
  g.beginPath(); g.moveTo(x - w, y - 4); g.quadraticCurveTo(x, y - 8, x + w, y - 4); g.quadraticCurveTo(x + w * .8, y + h, x, y + h + 2); g.quadraticCurveTo(x - w * .8, y + h, x - w, y - 4); g.closePath();
  g.fillStyle = '#8a3a36'; g.fill();
  g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - w, y - 10, w * 2, h * .45 + 4); g.fillStyle = '#e07274'; g.beginPath(); g.ellipse(x, y + h + 2, w * .55, h * .38, 0, 0, 7); g.fill(); g.restore();
  g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke();
}
function headHim(g, p) {
  const cx = 180 + (p.headDx || 0), cy = 196 + (p.bob || 0), k = p.turn || 0;
  if (p.view === 'back') {
    blob(g, cx, cy - 16, 118, 110, 11, .07, 40); fillStroke(g, HAIR_HIM, 5.5);
    // tufts
    g.strokeStyle = '#3a3536'; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const a = -2.6 + i * .37; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.quadraticCurveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70 + 8, cx + Math.cos(a) * 92, cy + Math.sin(a) * 86); g.stroke(); }
    g.beginPath(); g.ellipse(cx - 100, cy + 18, 11, 16, 0, 0, 7); g.ellipse(cx + 100, cy + 18, 11, 16, 0, 0, 7); fillStroke(g, SK_HIM, 4);
    return;
  }
  // hair mass behind: fluffy, a little wider than the face
  blob(g, cx + k * 6, cy - 22, 120, 108, 3, .07, 40); fillStroke(g, HAIR_HIM, 5.5);
  // ears
  g.beginPath(); g.ellipse(cx - 100 + Math.max(0, k) * 26, cy + 18, 13, 18, 0, 0, 7); g.ellipse(cx + 100 + Math.min(0, k) * 26, cy + 18, 13, 18, 0, 0, 7); fillStroke(g, SK_HIM, 4.5);
  // face: round, a little wide
  const face = () => { g.beginPath(); g.ellipse(cx + k * 6, cy + 14, 98, 88, 0, 0, 7); };
  face(); g.fillStyle = SK_HIM; g.fill();
  crescent(g, face, SK_HIM, SK_HIM_S, 8 - k * 6, -6);
  face(); g.lineWidth = 5.5; g.strokeStyle = INK; g.stroke();
  // blush
  g.fillStyle = BLUSH; g.beginPath(); g.ellipse(cx - 58 + k * 22, cy + 52, 16, 9, 0, 0, 7); g.ellipse(cx + 58 + k * 22, cy + 52, 16, 9, 0, 0, 7); g.fill();
  if (p.expr === 'shy') { g.fillStyle = 'rgba(240,110,110,.45)'; g.beginPath(); g.ellipse(cx - 58 + k * 22, cy + 50, 22, 12, 0, 0, 7); g.ellipse(cx + 58 + k * 22, cy + 50, 22, 12, 0, 0, 7); g.fill(); }
  eyesHim(g, cx, cy + 26, k, p.expr, p.blink, p.look || 0);
  glasses(g, cx, cy + 24, k);
  // nose
  g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx + k * 30 - 4, cy + 62); g.quadraticCurveTo(cx + k * 30 + 2, cy + 66, cx + k * 30 + 6, cy + 61); g.stroke();
  mouthHim(g, cx + k * 26, cy + 80, p.expr);
  // fluffy, messy fringe in clumps; forehead shows a little above the frames
  const fr = [[-104, 4, 16], [-90, -30, 22], [-70, -40, 26], [-48, -46, 24], [-26, -44, 30], [-4, -48, 26], [18, -42, 32], [40, -46, 26], [62, -40, 28], [84, -34, 22], [102, -6, 16]];
  g.beginPath(); g.moveTo(cx - 112, cy + 10);
  g.bezierCurveTo(cx - 124, cy - 84, cx - 54, cy - 128, cx + 8, cy - 124);
  g.bezierCurveTo(cx + 76, cy - 120, cx + 128, cy - 80, cx + 112, cy + 10);
  for (let i = fr.length - 1; i >= 0; i--) {
    const [tx, ty, l] = fr[i], nx = i ? fr[i - 1][0] : -112;
    g.quadraticCurveTo(cx + tx + k * 10 + 4, cy + ty + l * .55, cx + tx + k * 10, cy + ty + l * .2);
    g.quadraticCurveTo(cx + (tx + nx) / 2 + k * 10, cy + ty - l * .5, cx + nx + k * 10 + 6, cy + (i ? fr[i - 1][1] : 10));
  }
  g.closePath(); fillStroke(g, HAIR_HIM, 5.5);
  // strands
  g.strokeStyle = '#4a4446'; g.lineWidth = 3;
  for (const [a, b] of [[-70, -96], [-28, -110], [16, -108], [58, -92], [92, -60]]) { g.beginPath(); g.moveTo(cx + a + k * 8, cy + b); g.quadraticCurveTo(cx + a + 16, cy + b + 24, cx + a + 8 + k * 8, cy + b + 50); g.stroke(); }
  // side tufts over the ears
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 108, cy - 30); g.quadraticCurveTo(cx + sx * 122, cy + 2, cx + sx * 106, cy + 22); g.quadraticCurveTo(cx + sx * 104, cy - 2, cx + sx * 96, cy - 10); fillStroke(g, HAIR_HIM, 4.5); }
  // top cowlick tufts
  g.beginPath(); g.moveTo(cx - 24, cy - 118); g.quadraticCurveTo(cx - 18, cy - 150, cx + 6, cy - 146); g.quadraticCurveTo(cx - 6, cy - 134, cx + 8, cy - 122); fillStroke(g, HAIR_HIM, 4.5); g.beginPath(); g.moveTo(cx + 30, cy - 118); g.quadraticCurveTo(cx + 46, cy - 140, cx + 62, cy - 128); g.quadraticCurveTo(cx + 48, cy - 124, cx + 48, cy - 112); fillStroke(g, HAIR_HIM, 4.5);
}

function eyesHer(g, cx, cy, k, expr, blink, look) {
  const ex = 40, ox = k * 22 + look * 6;
  for (const s of [-1, 1]) {
    const x = cx + s * ex + ox * (s * k > 0 ? 1.05 : .95), y = cy, ww = 1 - s * k * .2;
    g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round';
    if (blink || expr === 'shy' || expr === 'laugh') {
      g.lineWidth = 5; g.beginPath(); g.arc(x, y - 4, 15 * ww, Math.PI * .15, Math.PI * .85); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(x + s * 14, y + 2); g.lineTo(x + s * 20, y - 2); g.stroke(); continue;
    }
    const lid = expr === 'pout' ? 5 : expr === 'miss' ? 7 : 0, open = expr === 'surprise' ? 1.12 : 1;
    // white
    g.beginPath(); g.ellipse(x, y + 2, 21 * ww, 19 * open, 0, 0, 7); g.fillStyle = '#fffaf6'; g.fill();
    // iris (big, dark brown) + pupil + highlights
    g.save(); g.beginPath(); g.ellipse(x, y + 2, 21 * ww, 19 * open, 0, 0, 7); g.clip();
    const lx = x + look * 4 + (expr === 'miss' ? 0 : 0), ly = y + 4 + (expr === 'miss' ? 4 : 0);
    const gr = g.createRadialGradient(lx, ly + 6, 2, lx, ly, 18); gr.addColorStop(0, '#8a5a3c'); gr.addColorStop(.6, '#4a2c1e'); gr.addColorStop(1, '#2a1812');
    g.beginPath(); g.ellipse(lx, ly, 15.5 * ww, 17.5 * open, 0, 0, 7); g.fillStyle = gr; g.fill();
    g.beginPath(); g.ellipse(lx, ly, 6.5, 7.5, 0, 0, 7); g.fillStyle = '#1b0f0a'; g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(lx - 6, ly - 7, 5, 6, -.3, 0, 7); g.fill(); g.beginPath(); g.arc(lx + 6, ly + 7, 2.4, 0, 7); g.fill();
    if (lid) { g.fillStyle = SK_HER; g.fillRect(x - 25, y - 24, 50, 6 + lid * 1.6); }
    g.restore();
    // upper lash line, thick with a little flick
    g.lineWidth = 5.5; g.strokeStyle = '#24160f';
    g.beginPath(); g.moveTo(x - s * 22 * ww, y + 2 - (lid ? 0 : 0)); g.quadraticCurveTo(x, y - 22 + lid * 1.6, x + s * 22 * ww, y - 3 + lid * .5); g.lineTo(x + s * 28 * ww, y - 9); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(x - 12, y + 21); g.quadraticCurveTo(x, y + 24, x + 12, y + 21); g.strokeStyle = 'rgba(60,35,25,.5)'; g.stroke();
  }
}
function mouthHer(g, x, y, expr) {
  g.lineCap = 'round';
  if (expr === 'surprise') { g.beginPath(); g.ellipse(x, y + 3, 7, 9, 0, 0, 7); fillStroke(g, '#b9505a', 3.5); return; }
  if (expr === 'laugh') { g.beginPath(); g.moveTo(x - 16, y - 2); g.quadraticCurveTo(x, y - 4, x + 16, y - 2); g.quadraticCurveTo(x, y + 20, x - 16, y - 2); fillStroke(g, '#b9505a', 3.5); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - 16, y - 6, 32, 7); g.restore(); return; }
  if (expr === 'pout') { g.beginPath(); g.ellipse(x, y + 2, 9, 5.5, 0, 0, 7); g.fillStyle = '#e98f95'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#a5505a'; g.beginPath(); g.moveTo(x - 9, y + 2); g.lineTo(x + 9, y + 2); g.stroke(); return; }
  if (expr === 'miss') { g.lineWidth = 3.5; g.strokeStyle = '#a5505a'; g.beginPath(); g.moveTo(x - 9, y + 3); g.quadraticCurveTo(x, y + 1, x + 9, y + 3); g.stroke(); return; }
  g.beginPath(); g.moveTo(x - 13, y); g.quadraticCurveTo(x, y + 11, x + 13, y); g.quadraticCurveTo(x, y + 4, x - 13, y); g.fillStyle = '#e07c86'; g.fill();
  g.lineWidth = 3.5; g.strokeStyle = '#a5505a'; g.beginPath(); g.moveTo(x - 13, y); g.quadraticCurveTo(x, y + 11, x + 13, y); g.stroke();
}
function hairHerBack(g, p) {
  const cx = 180 + (p.headDx || 0), cy = 198 + (p.bob || 0), k = p.turn || 0, sw = p.hairSway || 0;
  // long dark-brown hair falling past the shoulders (behind the body)
  g.beginPath();
  g.moveTo(cx - 98, cy - 40);
  g.bezierCurveTo(cx - 130, cy + 60, cx - 128 + sw, cy + 170, cx - 112 + sw, cy + 236);
  g.quadraticCurveTo(cx - 90 + sw, cy + 252, cx - 70 + sw, cy + 232);
  g.lineTo(cx + 70 + sw, cy + 232);
  g.quadraticCurveTo(cx + 90 + sw, cy + 252, cx + 112 + sw, cy + 236);
  g.bezierCurveTo(cx + 128 + sw, cy + 170, cx + 130, cy + 60, cx + 98, cy - 40);
  g.closePath(); fillStroke(g, HAIR_HER, 5.5);
  g.strokeStyle = HAIR_HER_L; g.lineWidth = 3;
  for (const a of [-84, -62, 62, 84]) { g.beginPath(); g.moveTo(cx + a, cy + 40); g.quadraticCurveTo(cx + a * 1.15 + sw * .5, cy + 140, cx + a * 1.05 + sw, cy + 220); g.stroke(); }
}
function headHer(g, p) {
  const cx = 180 + (p.headDx || 0), cy = 198 + (p.bob || 0), k = p.turn || 0;
  if (p.view === 'back') {
    // the back: just the long hair, centre part at the crown
    blob(g, cx, cy - 8, 102, 104, 21, .03); fillStroke(g, HAIR_HER, 5.5);
    g.strokeStyle = HAIR_HER_L; g.lineWidth = 3; for (const a of [-60, -30, 0, 30, 60]) { g.beginPath(); g.moveTo(cx + a * .4, cy - 96); g.quadraticCurveTo(cx + a * 1.2, cy - 20, cx + a * 1.3, cy + 90); g.stroke(); }
    return;
  }
  // face: soft oval, slightly narrower chin
  const fx = cx + k * 6;
  const face = () => { g.beginPath(); g.moveTo(fx - 88, cy - 6); g.bezierCurveTo(fx - 92, cy + 70, fx - 40, cy + 104, fx, cy + 106); g.bezierCurveTo(fx + 40, cy + 104, fx + 92, cy + 70, fx + 88, cy - 6); g.bezierCurveTo(fx + 86, cy - 86, fx - 86, cy - 86, fx - 88, cy - 6); g.closePath(); };
  face(); g.fillStyle = SK_HER; g.fill(); crescent(g, face, SK_HER, SK_HER_S, 7 - k * 6, -5);
  face(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  g.fillStyle = p.expr === 'shy' ? 'rgba(240,110,120,.5)' : BLUSH;
  const bw = p.expr === 'shy' ? 22 : 15; g.beginPath(); g.ellipse(cx - 54 + k * 22, cy + 52, bw, bw * .55, 0, 0, 7); g.ellipse(cx + 54 + k * 22, cy + 52, bw, bw * .55, 0, 0, 7); g.fill();
  // brows: soft, thin
  g.strokeStyle = '#5a3a2c'; g.lineWidth = 4; g.lineCap = 'round';
  const bd = p.expr === 'miss' ? 4 : p.expr === 'surprise' ? -6 : 0, bt = p.expr === 'pout' ? 3 : 0;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 22 + k * 22, cy - 10 + bd + (s < 0 ? bt : -bt) * 0); g.quadraticCurveTo(cx + s * 40 + k * 22, cy - 18 + bd - (p.expr === 'miss' ? -s * 0 : 0), cx + s * 58 + k * 22, cy - 12 + bd + (p.expr === 'miss' ? 4 : 0) - bt); g.stroke(); }
  eyesHer(g, cx, cy + 22, k, p.expr, p.blink, p.look || 0);
  g.strokeStyle = 'rgba(150,90,70,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + k * 30, cy + 56); g.quadraticCurveTo(cx + k * 30 + 4, cy + 62, cx + k * 30 - 2, cy + 64); g.stroke();
  mouthHer(g, cx + k * 26, cy + 78, p.expr);
  // top hair with centre part (two halves curving down past the temples), loose wisps
  const part = cx + k * 14;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(part, cy - 98);
    g.bezierCurveTo(part + s * 60, cy - 104, cx + s * 108, cy - 60, cx + s * 104, cy + 30);
    g.bezierCurveTo(cx + s * 100, cy + 90, cx + s * 98, cy + 130, cx + s * 96, cy + 150);
    g.lineTo(cx + s * 80, cy + 120);
    g.bezierCurveTo(cx + s * 86, cy + 60, cx + s * 84, cy + 10, cx + s * 70, cy - 26);
    g.bezierCurveTo(cx + s * 52, cy - 60, part + s * 24, cy - 68, part, cy - 84);
    g.closePath(); fillStroke(g, HAIR_HER, 5);
    g.strokeStyle = HAIR_HER_L; g.lineWidth = 2.6; g.beginPath(); g.moveTo(part + s * 20, cy - 86); g.quadraticCurveTo(cx + s * 86, cy - 54, cx + s * 92, cy + 40); g.stroke();
  }
  // wisps
  g.strokeStyle = HAIR_HER; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 74, cy - 20); g.quadraticCurveTo(cx + s * 62, cy + 30, cx + s * 70, cy + 80); g.stroke(); }
  g.beginPath(); g.moveTo(part, cy - 98); g.lineTo(part + 1, cy - 82); g.strokeStyle = SK_HER_S; g.lineWidth = 3; g.stroke();
}
function hairHerFront(g, p) {
  if (p.view === 'back') return;
  const cx = 180 + (p.headDx || 0), cy = 198 + (p.bob || 0), sw = p.hairSway || 0;
  // two long strands falling in front of the shoulders
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * 96, cy + 110);
    g.bezierCurveTo(cx + s * 104, cy + 160, cx + s * 100 + sw, cy + 200, cx + s * 92 + sw, cy + 236);
    g.quadraticCurveTo(cx + s * 82 + sw, cy + 250, cx + s * 70 + sw, cy + 230);
    g.bezierCurveTo(cx + s * 76, cy + 190, cx + s * 78, cy + 150, cx + s * 78, cy + 112);
    g.closePath(); fillStroke(g, HAIR_HER, 4.5);
  }
}

// ---------- body ----------
const ARM = { him: [74, 62, 36], her: [66, 56, 29] };
function armTargets(who, p, cx, sy, sw) {
  const t = p.t || 0, a = p.arms || 'down';
  const L = [cx - sw, sy], R = [cx + sw, sy];
  const down = [[cx - sw - 14, sy + 128], [cx + sw + 14, sy + 128]];
  switch (a) {
    case 'wave': return [down[0], [cx + sw + 52, sy - 70 + Math.sin(t * 12) * 6], { waveR: Math.sin(t * 12) }];
    case 'phone': return [[cx - 20, sy + 80], [cx + 20, sy + 80], { phone: 1 }];
    case 'chin': return [[cx - 50, sy - 52], [cx + 50, sy - 52], { fists: 1 }];
    case 'crossed': return [[cx + 52, sy + 110], [cx - 52, sy + 118], { crossed: 1 }];
    case 'reachR': return [down[0], [cx + sw + 82, sy + 96]];
    case 'reachL': return [[cx - sw - 82, sy + 96], down[1]];
    case 'offer': return [[cx + 30, sy + 70], [cx + 80, sy + 56], { flowers: 1 }];
    case 'behind': return [[cx - 24, sy + 120], [cx + 24, sy + 120], { hidden: 1 }];
    case 'feed': return [down[0], [cx + sw + 96, sy - 4], { burger: 1 }];
    case 'helmet': return [[cx - sw - 30, sy + 104], down[1], { helmet: 1 }];
    case 'heart': return [down[0], [cx + sw + 30, sy - 70], { heart: 1 }];
    case 'photo': return [[cx + 50, sy - 30], [cx + 96, sy - 40], { phoneUp: 1 }];
    case 'bottle': return [[cx - sw - 6, sy + 150], [cx + sw + 4, sy + 150], { bottle: 1 }];
    case 'hug': return [[cx + 10, sy + 70], [cx + 70, sy + 60]];
    case 'cheer': return [[cx - sw - 50, sy - 80], [cx + sw + 50, sy - 80]];
    default: return [down[0], down[1]];
  }
}
function drawArm(g, who, s, h, bend, sleeve, cx = 180) {
  const [a, b, w] = ARM[who], skin = who === 'him' ? SK_HIM : SK_HER;
  const A = ik(s, h, a, b, 1), B = ik(s, h, a, b, -1), out = Math.sign(s[0] - cx) || 1;
  const sc = q => (q.e[0] - cx) * out + q.e[1] * .35;      // elbows go outward and down
  const { e, h: hand } = sc(A) >= sc(B) ? A : B;
  limb(g, [s, e, hand], w, skin, 4.5);
  // short sleeve over the upper arm
  const sx = s[0] + (e[0] - s[0]) * .42, sy = s[1] + (e[1] - s[1]) * .42;
  limb(g, [[s[0], s[1] + 6], [sx, sy]], w + 5, sleeve, 4.5);
  return hand;
}
function hand(g, who, x, y, r = 15) { g.beginPath(); g.ellipse(x, y, r, r * .92, 0, 0, 7); fillStroke(g, who === 'him' ? SK_HIM : SK_HER, 4.5); }
function bracelets(g, x, y) {
  // her wooden bead bracelet (from the photos)
  for (let i = 0; i < 7; i++) { const a = -Math.PI * .9 + i * .3; g.beginPath(); g.arc(x + Math.cos(a) * 15, y - 12 + Math.sin(a) * 6 + 10, 4.2, 0, 7); g.fillStyle = '#b9794e'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#6e4127'; g.stroke(); }
}

export function helmetArt(g, x, y, s = 1, facing = 1) {
  // white full-face helmet with amber visor (from the riding photo)
  g.save(); g.translate(x, y); g.scale(s * facing, s);
  g.beginPath(); g.moveTo(-44, 26); g.bezierCurveTo(-56, -30, -20, -56, 8, -54); g.bezierCurveTo(44, -50, 56, -18, 52, 16); g.lineTo(46, 34); g.lineTo(-30, 40); g.closePath(); fillStroke(g, '#f6f5f1', 5);
  g.beginPath(); g.moveTo(-6, -24); g.bezierCurveTo(20, -30, 46, -22, 52, -2); g.lineTo(50, 14); g.bezierCurveTo(30, 12, 6, 8, -6, 4); g.closePath();
  const gr = g.createLinearGradient(0, -26, 0, 14); gr.addColorStop(0, '#ffb347'); gr.addColorStop(.5, '#f07a2a'); gr.addColorStop(1, '#a8471d'); g.fillStyle = gr; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, -20); g.lineTo(30, -20); g.stroke();
  g.fillStyle = '#2b2b2f'; g.beginPath(); g.ellipse(-24, -8, 6, 4, 0, 0, 7); g.fill(); // logo dot
  g.strokeStyle = '#c9c7c0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-40, 14); g.quadraticCurveTo(0, 22, 44, 22); g.stroke();
  g.restore();
}
function phoneArt(g, x, y, s = 1, lit = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rrect(g, -20, -36, 40, 72, 8); fillStroke(g, '#2c2c34', 4);
  rrect(g, -15, -30, 30, 60, 5); g.fillStyle = lit ? '#bfe3ff' : '#55606e'; g.fill();
  if (lit) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-6, -4); g.lineTo(-6, 8); g.lineTo(6, 2); g.fill(); }
  g.restore();
}
function flowersArt(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-26, -6); g.lineTo(26, -6); g.lineTo(8, 62); g.lineTo(-8, 62); g.closePath(); fillStroke(g, '#f4c9d4', 4);
  g.strokeStyle = '#6aa66a'; g.lineWidth = 4; for (const a of [-14, 0, 14]) { g.beginPath(); g.moveTo(0, 40); g.lineTo(a, -10); g.stroke(); }
  for (const [fx, fy, c] of [[-18, -24, '#f26d7d'], [2, -34, '#ffd36e'], [20, -22, '#f59ab0'], [-6, -14, '#ff8fa3'], [12, -8, '#ffffff']]) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.beginPath(); g.ellipse(fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 6.5, 6.5, 0, 0, 7); g.fillStyle = c; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); }
    g.beginPath(); g.arc(fx, fy, 4, 0, 7); g.fillStyle = '#f7b733'; g.fill();
  }
  rrect(g, -12, 18, 24, 10, 4); fillStroke(g, '#e8495d', 3);
  g.restore();
}
export function burgerArt(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // pink flower wrapper (from the photo)
  g.beginPath(); g.moveTo(-40, 6); g.lineTo(40, 6); g.lineTo(30, 46); g.lineTo(-30, 46); g.closePath(); fillStroke(g, '#f37ab0', 4);
  g.fillStyle = '#fff'; for (const [fx, fy] of [[-20, 22], [6, 32], [22, 16]]) { g.beginPath(); g.arc(fx, fy, 4, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(0, 2, 38, 12, 0, 0, 7); fillStroke(g, '#c9853f', 4);
  g.beginPath(); g.ellipse(0, -6, 40, 7, 0, 0, 7); fillStroke(g, '#9fd36a', 3.5);
  g.beginPath(); g.ellipse(0, -12, 38, 9, 0, 0, 7); fillStroke(g, '#b8642a', 4);
  g.beginPath(); g.moveTo(-36, -16); g.bezierCurveTo(-34, -48, 34, -48, 36, -16); g.closePath(); fillStroke(g, '#e7a24b', 4);
  g.fillStyle = '#fff3d6'; for (const [fx, fy] of [[-14, -30], [4, -36], [18, -26]]) { g.beginPath(); g.ellipse(fx, fy, 2.6, 1.5, .4, 0, 7); g.fill(); }
  g.restore();
}
export function bottleArt(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rrect(g, -9, -36, 18, 62, 7); g.fillStyle = 'rgba(220,240,255,.85)'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  rrect(g, -6, -46, 12, 10, 3); fillStroke(g, '#9ad25a', 3); rrect(g, -9, -14, 18, 12, 2); fillStroke(g, '#ffffff', 2);
  g.restore();
}

function legs(g, who, p, cx) {
  const pants = who === 'him' ? PANTS_HIM : PANTS_HER, w = who === 'him' ? 50 : 40, hipY = 452;
  const ph = p.walk ?? -1, walking = ph >= 0;
  for (const s of [-1, 1]) {
    let fx = cx + s * (who === 'him' ? 30 : 24), fy = 596, kx = 0;
    if (walking) { const sw = Math.sin(ph + (s > 0 ? Math.PI : 0)); fx += 0; fy -= Math.max(0, sw) * 16; kx = sw * 10; }
    if (p.sit) { fx = cx + s * (who === 'him' ? 52 : 34); fy = 560; }
    const hip = [cx + s * (who === 'him' ? 30 : 22), hipY], knee = [(hip[0] + fx) / 2 + kx + (p.sit ? s * 14 : 0), (hipY + fy) / 2];
    limb(g, [hip, knee, [fx, fy - 18]], w, pants, 4.5);
    if (who === 'him') { // small white flower prints at the hem (from the photo)
      g.fillStyle = '#fff'; for (const d of [0, 1]) { const x0 = fx - 10 + d * 14, y0 = fy - 34 + d * 3; for (let i = 0; i < 4; i++) { const a = i * 1.57; g.beginPath(); g.arc(x0 + Math.cos(a) * 4, y0 + Math.sin(a) * 4, 3.2, 0, 7); g.fill(); } }
    }
    // shoes
    g.beginPath(); g.ellipse(fx + s * 4, fy - 4, who === 'him' ? 34 : 28, 17, 0, 0, 7);
    fillStroke(g, who === 'him' ? '#6b6e74' : '#fbfbf7', 4.5);
    g.beginPath(); g.ellipse(fx + s * 4, fy + 6, who === 'him' ? 32 : 26, 7, 0, 0, Math.PI); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    if (who === 'him') { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx - 12, fy - 14); g.lineTo(fx + 10, fy - 8); g.stroke(); }
  }
}
function torso(g, who, p, cx) {
  const him = who === 'him', tw = him ? 172 : 140, top = 296, hem = him ? 470 : 462, shirt = him ? SHIRT_HIM : SHIRT_HER, k = p.turn || 0;
  const path = () => {
    g.beginPath();
    g.moveTo(cx - 26, top); g.quadraticCurveTo(cx, top + 14, cx + 26, top);
    g.bezierCurveTo(cx + tw * .42, top + 2, cx + tw / 2 + 4, top + 14, cx + tw / 2 + 2, top + 40);
    g.bezierCurveTo(cx + tw / 2 - 2, top + 90, cx + tw / 2 + 8, hem - 40, cx + tw / 2 + 8, hem);
    g.quadraticCurveTo(cx, hem + 10, cx - tw / 2 - 8, hem);
    g.bezierCurveTo(cx - tw / 2 - 8, hem - 40, cx - tw / 2 + 2, top + 90, cx - tw / 2 - 2, top + 40);
    g.bezierCurveTo(cx - tw / 2 - 4, top + 14, cx - tw * .42, top + 2, cx - 26, top);
    g.closePath();
  };
  path(); g.fillStyle = shirt; g.fill();
  crescent(g, path, shirt, him ? '#1b1b1e' : '#e9e4d6', 10, -4);
  path(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  // collar
  g.beginPath(); g.moveTo(cx - 26, top); g.quadraticCurveTo(cx, top + 18, cx + 26, top); g.lineWidth = 4; g.strokeStyle = him ? '#55555c' : '#d8d2c2'; g.stroke();
  if (p.view === 'back') return;
  if (him) catHim(g, cx + 44 + k * 16, top + 62, 1.05);
  else catHer(g, cx + k * 14, top + 82, 1.25);
}
function neck(g, who, cx) { const skin = who === 'him' ? SK_HIM : SK_HER; rrect(g, cx - 20, 270, 40, 36, 10); fillStroke(g, skin, 4.5); }

// pose → art canvas (design units × S)
export function drawCharacter(who, p, S = 2) {
  const c = mk(DW * S, DH * S), g = c.getContext('2d'); g.scale(S, S);
  const cx = 180, bob = p.walk >= 0 ? -Math.abs(Math.sin(p.walk)) * 6 : 0;
  const P = { ...p, bob: (p.bob || 0) };
  const him = who === 'him', sw = him ? 80 : 64, sy = 318;
  g.save(); if (p.flip) { g.translate(DW, 0); g.scale(-1, 1); }
  if (!him) hairHerBack(g, { ...P, bob: P.bob + bob });
  legs(g, who, p, cx);
  g.save(); g.translate(0, bob);
  const [hl, hr, fx = {}] = armTargets(who, p, cx, sy, sw);
  if (fx.hidden) { drawArm(g, who, [cx - sw, sy], hl, 1, him ? SHIRT_HIM : SHIRT_HER); drawArm(g, who, [cx + sw, sy], hr, -1, him ? SHIRT_HIM : SHIRT_HER); }
  neck(g, who, cx);
  torso(g, who, p, cx);
  if (him) headHim(g, P); else headHer(g, P);
  if (!him) hairHerFront(g, P);
  if (!fx.hidden) {
    const sl = him ? SHIRT_HIM : SHIRT_HER;
    const back = p.view === 'back';
    const h1 = drawArm(g, who, [cx - sw, sy], hl, 1, sl, cx);
    const h2 = drawArm(g, who, [cx + sw, sy], hr, 1, sl, cx);
    if (fx.phone) phoneArt(g, cx, sy + 62, 1.1, 1);
    hand(g, who, h1[0], h1[1]); hand(g, who, h2[0], h2[1]);
    if (!him) bracelets(g, (p.flip ? h2 : h1)[0] + 0, (p.flip ? h2 : h1)[1] - 14);
    if (!him) { g.beginPath(); g.ellipse((p.flip ? h1 : h2)[0], (p.flip ? h1 : h2)[1] - 16, 15, 5, 0, 0, 7); g.lineWidth = 3.5; g.strokeStyle = '#d7dde3'; g.stroke(); }
    if (fx.flowers) flowersArt(g, h2[0] - 10, h2[1] - 30, 1.3);
    if (fx.helmet) helmetArt(g, h1[0] - 10, h1[1] + 10, .85, 1);
    if (fx.burger) burgerArt(g, h2[0] + 4, h2[1] - 16, 1.05);
    if (fx.bottle) bottleArt(g, h2[0] + 4, h2[1] - 6, 1.05);
    if (fx.phoneUp) phoneArt(g, h2[0] - 18, h2[1] - 30, 1.15, 0);
    if (fx.heart) { g.save(); g.translate(h2[0], h2[1] - 30); g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-16, -4, -8, -18, 0, -8); g.bezierCurveTo(8, -18, 16, -4, 0, 8); fillStroke(g, '#ff6f8a', 3); g.restore(); }
  }
  g.restore(); g.restore();
  return c;
}

// cached cut-paper card for a pose
const CACHE = new Map();
export function charCard(who, p, S = 2) {
  const key = who + JSON.stringify(p) + S;
  let v = CACHE.get(key);
  if (!v) { v = finish(drawCharacter(who, p, S), { border: 9 * S / 2 + 4, edge: 3 * S / 2 + 1 }); CACHE.set(key, v); if (CACHE.size > 260) CACHE.delete(CACHE.keys().next().value); }
  return v;
}
