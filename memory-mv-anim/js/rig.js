// Draws ARAP-deformed puppet layers (tools/rig.py): each rest-mesh triangle is mapped (exact affine) to its
// position in this frame. Textures are cropped to the layer (ox, oy = crop origin in plate px).
const RIGS = {};
export async function loadRig(name) {
  if (RIGS[name]) return RIGS[name];
  const r = await (await fetch(`rig/${name}.json`)).json();
  const im = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
  for (const L of r.layers) { L.img = await im(`rig/${L.tex}.png`); L.altImg = {}; for (const st of L.alt || []) L.altImg[st] = await im(`rig/${L.tex}_${st}.png`); }
  r.layers.sort((a, b) => a.z - b.z); RIGS[name] = r; return r;
}
function tri(g, img, ox, oy, s0, s1, s2, d0, d1, d2) {
  s0 = [s0[0] - ox, s0[1] - oy]; s1 = [s1[0] - ox, s1[1] - oy]; s2 = [s2[0] - ox, s2[1] - oy];
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, gr = q => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1; return [q[0] + dx / l * .9, q[1] + dy / l * .9]; };
  const q0 = gr(d0), q1 = gr(d1), q2 = gr(d2);
  const x0 = Math.max(0, Math.floor(Math.min(s0[0], s1[0], s2[0])) - 2), y0 = Math.max(0, Math.floor(Math.min(s0[1], s1[1], s2[1])) - 2);
  const x1 = Math.min(img.width, Math.ceil(Math.max(s0[0], s1[0], s2[0])) + 2), y1 = Math.min(img.height, Math.ceil(Math.max(s0[1], s1[1], s2[1])) + 2);
  if (x1 <= x0 || y1 <= y0) return;
  g.save(); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.lineTo(q2[0], q2[1]); g.closePath(); g.clip();
  g.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]);
  g.drawImage(img, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); g.restore();
}
// v: visible rect in plate px; t: film time
export function drawRig(g, r, t, v, W, H) {
  const f = Math.max(0, Math.min(r.n - 1, Math.round((t - r.t0) * r.fps)));
  const sx = W / v.w, sy = H / v.h, S = p => [(p[0] - v.x) * sx, (p[1] - v.y) * sy];
  for (const L of r.layers) {
    let img = L.img;
    for (const [bt] of L.blinks || []) { const k = Math.floor((t - bt) * 24); if (k >= 0 && k <= 4) img = L.altImg[k === 0 || k === 4 ? 'half' : 'closed'] || img; }
    const U = L.U[f], V = L.V;
    for (const [i, j, k] of L.F) tri(g, img, L.ox, L.oy, V[i], V[j], V[k], S(U[i]), S(U[j]), S(U[k]));
  }
}
