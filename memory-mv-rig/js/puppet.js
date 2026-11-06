// Rigid 2D cut-out puppet (no mesh warp): every part is an untouched PNG from the user's parts sheet,
// placed by a joint hierarchy and moved only by rotation/translation about its pivot.
// Model units = px of the ×4-upscaled sheet. Pose angles in degrees; positive = clockwise on screen.
export const MALE = {
  name: 'male',
  // part: [image, scale, pivotX, pivotY (px in the image), parent, jointX, jointY (in the parent's frame, model units), rot0, z]
  parts: {
    hip:        [null,              1,    0,   0, null,       0, -560,   0,  0],
    thigh_r:    ['m_thigh_R',       1.05, 77,  10, 'hip',   -66,   -6,   0,  4],   // his right = viewer's left
    shin_r:     ['m_shin_R',        .92,  62,  10, 'thigh_r',  0,  238,   0,  5],
    shoe_r:     ['m_shoe_white_R',  .78,  94,  36, 'shin_r',  -4,  198,   0,  6],
    thigh_l:    ['m_thigh_L',       1.05, 70,  10, 'hip',    66,   -6,   0,  4],
    shin_l:     ['m_shin_L',        .92,  64,  10, 'thigh_l',  0,  238,   0,  5],
    shoe_l:     ['m_shoe_white_L',  .78, 100,  36, 'shin_l',   4,  198,   0,  6],
    lower:      ['m_lower_dark',    1.22, 136,  4, 'hip',     0,  -52,   0,  7],
    torso:      ['m_torso_tee',     1.12, 213, 292, 'hip',    0,  -14,   0,  8],
    head:       ['m_head_base',     1.0, 205, 428, 'torso',   0, -300,   0, 11],
    hair_back:  ['m_hair_back',     1.04, 260, 228, 'head',   0, -238,   0,  1],
    hair_front: ['m_hair_front',    1.0, 230, 200, 'head',   6, -372,   0, 14],
    glasses:    ['m_glasses',       .96, 222,  64, 'head',    0, -150,   0, 15],
    uparm_r:    ['m_arm_upper_v',   1.0,  44,  22, 'torso', -150, -222,  12,  2],
    fore_r:     ['m_arm_fore_v',    1.0,  43,  20, 'uparm_r',  0,  176,   0,  3],
    hand_r:     ['m_hand_relax',    .66,  26,  92, 'fore_r',   0,  168,  96,  9],
    uparm_l:    ['m_arm_upper_v',   1.0,  44,  22, 'torso',  150, -222, -12,  2],
    fore_l:     ['m_arm_fore_v',    1.0,  43,  20, 'uparm_l',  0,  176,   0,  3],
    hand_l:     ['m_hand_relax',    .66,  26,  92, 'fore_l',   0,  168, -90,  9, 1],   // last flag: mirrored
  },
  // alternative images a part can switch to (same joint), with their own pivot/scale/base rotation
  alt: { hand_r: { open: ['m_hand_open', .7, 30, 140, -52] } },
  eyes: 'm_head_base', blink: 'm_eye_smile',
};

const IMG = {};
export async function loadPuppet(M, base = 'parts/') {
  const names = new Set(); for (const p of Object.values(M.parts)) if (p[0]) names.add(p[0]);
  for (const a of Object.values(M.alt || {})) for (const v of Object.values(a)) names.add(v[0]);
  names.add(M.blink + '_L'); names.add(M.blink + '_R');
  await Promise.all([...names].map(n => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[n] = i; ok(); }; i.onerror = () => no(new Error('missing part ' + n)); i.src = base + n + '.png'; })));
  M.eyeData = (await (await fetch(base + 'head_eyes.json')).json())[M.eyes];
}

// pose: {joint: {r: deg, x, y}}, swaps: {part: altName}, blink: 0 | .5 | 1
export function drawPuppet(g, M, pose = {}, swaps = {}, blink = 0) {
  const P = M.parts, world = {};
  const mat = name => {
    if (world[name]) return world[name];
    const p = P[name], q = pose[name] || {}; const par = p[4] ? mat(p[4]) : new DOMMatrix();
    const m = par.translate(p[5] + (q.x || 0), p[6] + (q.y || 0)).rotate(p[7] + (q.r || 0));
    return (world[name] = m);
  };
  const order = Object.keys(P).filter(n => P[n][0]).sort((a, b) => P[a][8] - P[b][8]);
  for (const n of order) {
    const p = P[n]; let [img, s, px, py] = p, extra = 0;
    const sw = swaps[n] && M.alt[n] && M.alt[n][swaps[n]]; if (sw) { [img, s, px, py, extra] = sw; }
    const im = IMG[img]; const m = mat(n).rotate(extra);
    g.save(); g.setTransform(g.getTransform().multiply(m));
    if (p[9]) g.scale(-1, 1);
    g.drawImage(im, -px * s, -py * s, im.width * s, im.height * s);
    if (n === 'head' && blink > 0) drawBlink(g, M, s, px, py, blink);
    g.restore();
  }
}
// eyelids: cover each painted eye with the face's own skin, then lay the sheet's closed-eye stroke on it
function drawBlink(g, M, s, px, py, k) {
  const E = M.eyeData, [r, gg, b] = E.skin;
  E.eyes.forEach(([x, y, w, h], i) => {
    const cx = (x + w / 2 - px) * s, cy = (y + h / 2 - py) * s, rx = w / 2 * s * 1.04, ry = h / 2 * s * 1.0;
    g.save(); g.beginPath(); g.ellipse(cx, cy - (1 - k) * ry * .9, rx, ry * (k > .9 ? 1 : .55 + .45 * k), 0, 0, 7);
    const gr = g.createLinearGradient(0, cy - ry, 0, cy + ry); gr.addColorStop(0, `rgb(${r - 6},${gg - 10},${b - 10})`); gr.addColorStop(1, `rgb(${r},${gg},${b})`);
    g.fillStyle = gr; g.filter = 'blur(1.2px)'; g.fill(); g.filter = 'none';
    const lid = IMG[M.blink + (i ? '_R' : '_L')], lw = w * s * 1.02, lh = lid.height * lw / lid.width;
    g.drawImage(lid, cx - lw / 2, cy + (k > .9 ? 0 : -ry * .25) - lh * .35, lw, lh);
    g.restore();
  });
}

// paper-doll outline around the whole character (like the stickers on the sheet)
export function withOutline(g, W, H, draw, px = 7) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const cg = c.getContext('2d'); cg.setTransform(g.getTransform()); draw(cg);
  const w = document.createElement('canvas'); w.width = W; w.height = H; const wg = w.getContext('2d'); wg.drawImage(c, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#fffaf2'; wg.fillRect(0, 0, W, H);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.drawImage(w, Math.cos(a) * px, Math.sin(a) * px); }
  g.drawImage(c, 0, 0); g.restore();
}
