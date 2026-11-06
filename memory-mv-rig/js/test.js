// 5-second male test: stand → blink → lift head → raise right arm → wave → back to the starting stance.
import { MALE, loadPuppet, drawPuppet, withOutline } from './puppet.js';
const eio = u => { u = Math.min(1, Math.max(0, u)); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const back = (u, s = 1.3) => { u = Math.min(1, Math.max(0, u)) - 1; return 1 + u * u * ((s + 1) * u + s); };
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
// keyframes [t, value] with ease-in-out between keys (holds outside)
const K = (...k) => t => { if (t <= k[0][0]) return k[0][1]; for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * eio((t - k[i][0]) / (k[i + 1][0] - k[i][0])); return k[k.length - 1][1]; };
const head = K([0, 0], [1.25, 0], [1.75, -6], [3.9, -6], [4.45, 0]);
const headY = K([0, 0], [1.25, 0], [1.75, -6], [3.9, -6], [4.45, 0]);
const sh = K([0, 0], [1.75, 0], [2.0, -8], [2.45, 150], [3.75, 150], [4.35, 4], [4.6, 0]);    // shoulder: raise (anticipation dip first)
const el = K([0, 0], [1.95, 0], [2.45, -24], [3.75, -24], [4.35, 0]);                                  // elbow bends a little as the arm goes up
const handUp = K([0, 0], [2.15, 0], [2.45, -48], [3.75, -48], [4.05, 0]);
const torsoLean = K([0, 0], [1.9, 0], [2.4, -2], [3.8, -2], [4.4, 0]);
export function pose(t) {
  const wave = t > 2.45 && t < 3.8 ? Math.sin((t - 2.45) * Math.PI * 2 / .5) * Math.min(1, (t - 2.45) / .2, (3.8 - t) / .2) : 0;
  const breath = Math.sin(t * Math.PI * 2 / 3.2);
  const p = {
    hip: { y: 0 }, torso: { r: torsoLean(t), y: -1.5 * breath }, head: { r: head(t) * .4, y: headY(t) * .6 },
    uparm_r: { r: sh(t) }, fore_r: { r: el(t) - 22 * wave }, hand_r: { r: -8 * wave + handUp(t) },
    uparm_l: { r: 1.5 * breath }, fore_l: { r: 0 }, hair_front: { r: .6 * Math.sin(t * 2.1) }, hair_back: { r: .4 * Math.sin(t * 2.1 + .5) },
  };
  // the head tilts back (looking up) — a rigid rotation of the whole head about the neck
  p.head.r = head(t);
  return p;
}
export function swaps(t) { return { hand_r: t > 2.15 && t < 4.05 ? 'open' : undefined }; }
export function blink(t) { for (const b of [.95, 4.62]) { const f = Math.floor((t - b) * 24); if (f >= 0 && f <= 4) return f === 0 || f === 4 ? .5 : 1; } return 0; }
export { MALE, loadPuppet, drawPuppet, withOutline };
