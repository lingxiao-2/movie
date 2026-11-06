// The film: spreads, page turns, camera keys and every card's choreography, as pure functions of t.
import { seg, back, ss, eio, eo, clamp, lerp, track, spring } from '/core/lib.js';
import { charCard } from './chars.js';
import { motoCard } from './moto.js';
import { P, BD, GR, cached } from './art.js';
import { mk } from './paper.js';

// lyric cues (measured from the audio, see TREATMENT.md)
export const LYRICS = [
  [1.56, 4.62, '我们都是渺小真实存在'], [4.70, 7.96, '祈愿小世界里不只有挫败'], [8.32, 11.44, '直到遇见你我以为就光明起来'],
  [11.80, 14.82, '眼睛里看到的都是广袤无垠的大海'], [15.60, 18.66, '有你在的日子不可能被取代'], [19.02, 22.04, '在最灰暗的日子你陪着我发呆'],
  [22.52, 24.98, '你让我学会如何拨开阴霾'], [25.42, 28.00, '将快乐全都收集将不开心全都淘汰'], [28.98, 31.40, '你对我说的情话'],
  [31.50, 34.60, '像转瞬即逝的烟花'], [35.66, 38.30, '只停在绽放一刹那'], [38.46, 41.40, '我却已无法自拔'],
  [42.58, 44.60, '我们的爱总有时差'], [44.64, 48.10, '也为你骗自己放下'], [48.56, 53.20, '爱炙热的你，却忘了爱自己'],
];

// ---------- helpers ----------
const pop = (t, t0, d = .45, s = 1.6) => t < t0 ? 0 : 90 * back(seg(t, t0, t0 + d), s);
const fold = (t, t1, d = .3) => t < t1 ? 90 : 90 * (1 - eio(seg(t, t1, t1 + d)));
const life = (t, t0, t1 = 1e9, d = .45) => Math.min(pop(t, t0, d), fold(t, t1));
const al = a => clamp(a / 14);
const sway = (t, k = 1, f = 1.3) => Math.sin(t * f + k * 2.1) * .025;
const ch = (who, p, X, Z, h, a, extra = {}) => ({ img: charCard(who, p, 2), X, Z, h, a, alpha: al(a), ...extra });
const H_HIM = 12.6, H_HER = 11.8;
const blink = (t, k = 0) => ((t + k * 1.7) % 3.1) < .12 ? 1 : 0;
const step = (x, n) => Math.floor(x * n) / n;

// ---------- spreads ----------
// each: back (backdrop art), ground (ground art), cards(t) → [...], cam(t) → camera
const A1 = {
  back: () => BD.sky1(), ground: () => GR.meadow(), groundCol: '#e8eae2',
  cards(t) {
    const L = [];
    // clouds and the sunrise behind them (back first)
    const sunUp = ss(seg(t, 8.4, 11.2));
    L.push({ img: P.sun(), X: 2, Z: 29.7, y0: 10 + sunUp * 9, h: 7 * (.4 + sunUp * .6), a: 90, alpha: sunUp, shadow: false, rot: t * .1 });
    [[-12, 23, 0], [6, 25, 1], [14, 19, 2], [-3, 18, 3]].forEach(([x, y, n], i) => { const a = life(t, 1.45 + i * .06); L.push({ img: P.cloud(n, '#eef1f4'), X: x + Math.sin(t * .3 + i) * .6, Z: 29.6, y0: y - 6, h: 4.6, a, alpha: al(a), shadow: false }); });
    // little flowers on each side of the page
    [[-17, 5, '#9fc4ee', 0], [-14, 3, '#cfe0f2', 1], [16, 4, '#ffb3c1', 2], [13, 2.5, '#ffd6de', 3]].forEach(([x, z, c, n], i) => { const a = life(t, 2.2 + i * .05, 1e9, .4); L.push({ img: P.flower(c, n), X: x, Z: z, h: 3.6, a, alpha: al(a), rot: sway(t, i) }); });
    // the two phones
    const hisMode = t < 5.3 ? 'feed' : 'chat', herMode = t < 6.95 ? 'off' : 'chat';
    let a = life(t, 1.7); L.push({ img: P.phone(hisMode, 0), X: -6.5, Z: 18, h: 11.5, a, alpha: al(a) });
    a = life(t, 1.82); L.push({ img: P.phone(herMode, 1), X: 7, Z: 20, h: 11.5, a, alpha: al(a) });
    // him: discovers her video, taps the heart, waves
    const himP = { expr: t < 4.7 ? 'smile' : t < 6 ? 'surprise' : 'smile', turn: .45, blink: blink(t), arms: t < 4.6 ? 'down' : t < 5.4 ? 'reachR' : t < 8 ? 'wave' : 'down', t: step(t, 12) };
    if (himP.expr === 'surprise') himP.expr = 'shy';
    a = life(t, 2.05); L.push(ch('him', himP, -12.8, 10.5, H_HIM, a));
    // her: alone at first (a little lonely), then the message arrives
    const herP = { expr: t < 7 ? 'miss' : t < 7.7 ? 'surprise' : t < 9 ? 'smile' : 'shy', turn: -.4, blink: blink(t, 1), arms: t < 9 ? 'down' : 'chin', look: t < 7 ? 0 : -1 };
    a = life(t, 2.2); L.push(ch('her', herP, 12.8, 12, H_HER, a));
    // heart from his screen, then a chat bubble that folds into a paper plane and flies to her phone
    if (t > 4.75 && t < 6.2) { const u = seg(t, 4.75, 6.2); L.push({ img: P.heart(), X: -5.5 + u * .8, Z: 17.5, y0: 9 + u * 6, h: 2.2 * (1 - u * .3), a: 90, alpha: 1 - seg(t, 5.8, 6.2), shadow: false }); }
    if (t > 5.2 && t < 5.9) { const u = seg(t, 5.2, 5.9); L.push({ img: P.bubble(0), X: -4.5, Z: 17.4, y0: 11.5, h: 3.2, a: 90, sx: 1 - ss(seg(u, .7, 1)) * .9, alpha: 1, shadow: false }); }
    if (t > 5.75 && t < 7.1) {
      const u = eio(seg(t, 5.75, 7.0)), x = lerp(-4.5, 6.5, u), y = 11 + Math.sin(u * Math.PI) * 5, z = lerp(17.4, 19.6, u);
      L.push({ img: P.plane(), X: x, Z: z, y0: y, h: 2.6, a: 90, rot: Math.cos(u * Math.PI) * -.35, alpha: 1 - seg(t, 6.95, 7.1), shadowA: .6 });
    }
    if (t > 7.0 && t < 8.6) { const u = seg(t, 7.0, 8.6); L.push({ img: P.heart('#ffb3c1'), X: 7, Z: 19.6, y0: 12 + u * 5, h: 2 * (.6 + back(seg(t, 7, 7.3)) * .4), a: 90, alpha: 1 - seg(t, 8.2, 8.6), shadow: false }); }
    // L3: stars rise between them
    for (let i = 0; i < 9; i++) { const t0 = 8.4 + i * .18; if (t < t0) continue; const u = seg(t, t0, t0 + 2.6); L.push({ img: P.star(i % 3 ? '#ffd36e' : '#fff1b8'), X: -10 + i * 2.5 + Math.sin(i * 3) * 1.2, Z: 14 + (i % 3) * 2, y0: 2 + u * (8 + (i % 4) * 2), h: 1.4 + (i % 3) * .4, a: 90, rot: t * (i % 2 ? .8 : -.8), alpha: Math.min(1, seg(t, t0, t0 + .2)), shadowA: .4 }); }
    return L;
  },
  cam: track([
    [0, [0, 3, 14, 66, 54, 0, 1750]], [1.3, [0, 9, 15, 64, 34, 0, 1750]], [2.6, [-3, 7.5, 13, 48, 24, 0, 1750]], [4.4, [-8, 7.2, 12, 30, 14, -4, 1750]],
    [5.6, [-4, 8, 14, 36, 15, -2, 1750]], [6.9, [5, 8, 16, 36, 15, 3, 1750]], [8.2, [9.5, 7.3, 14, 30, 13, 5, 1750]],
    [9.4, [9, 7.5, 14, 32, 14, 4, 1750]], [11.6, [0, 10, 15, 60, 26, 0, 1750]],
  ]),
};

const A2 = {
  back: () => BD.night(), ground: () => GR.rooms(), groundCol: '#9a8a8a', night: 1,
  cards(t) {
    const L = [], T0 = 12.3;
    let a = life(t, T0); L.push({ img: P.window('night'), X: -10, Z: 29.6, y0: 13, h: 10, a, alpha: al(a), shadow: false });
    a = life(t, T0 + .05); L.push({ img: P.window('sea'), X: 10, Z: 29.6, y0: 13, h: 10, a, alpha: al(a), shadow: false });
    a = life(t, T0 + .1); L.push({ img: P.wall(), X: 0, Z: 27, h: 15, a, alpha: al(a) });
    // wall calendars: days pass (15.6 → 21)
    const day = 1 + Math.floor(clamp((t - 15.6) / 5.4) * 29);
    a = life(t, T0 + .12); L.push({ img: P.calendarWall(day), X: -16, Z: 29.4, y0: 15, h: 3.6, a, alpha: al(a), shadow: false });
    L.push({ img: P.calendarWall(day), X: 16, Z: 29.4, y0: 15, h: 3.6, a, alpha: al(a), shadow: false });
    a = life(t, T0 + .2); L.push({ img: P.desk(), X: -11.5, Z: 20, h: 8, a, alpha: al(a) });
    a = life(t, T0 + .25); L.push({ img: P.lamp(), X: -15.5, Z: 20.3, y0: 6.5, h: 4.6, a, alpha: al(a), shadow: false });
    a = life(t, T0 + .22); L.push({ img: P.bed(), X: 12, Z: 21, h: 6.6, a, alpha: al(a) });
    // the two of them, chatting at night
    const ph = t < 19 ? 'phone' : 'chin';
    a = life(t, T0 + .35); L.push(ch('him', { expr: t < 19 ? 'smile' : t < 20.3 ? 'miss' : 'smile', turn: .25, arms: ph, blink: blink(t), sit: 1 }, -9.5, 13, H_HIM, a));
    a = life(t, T0 + .4); L.push(ch('her', { expr: t < 15.5 ? 'smile' : t < 19 ? 'laugh' : t < 20.3 ? 'miss' : 'shy', turn: -.25, arms: ph, blink: blink(t, 2), sit: 1, look: t < 15.5 ? 1 : 0 }, 9.5, 14, H_HER, a));
    // paper-cup telephone over the wall (L5)
    a = life(t, 15.5, 1e9, .4); L.push({ img: P.cupPhone(0), X: -4, Z: 18, y0: 8, h: 2, a, alpha: al(a), shadow: false, rot: .3 }); L.push({ img: P.cupPhone(1), X: 4, Z: 18, y0: 8, h: 2, a, alpha: al(a), shadow: false, rot: -.3 });
    return L;
  },
  overlay(g, t, proj) {
    // phone glow
    for (const [x, z, k] of [[-9.5, 13, 0], [9.5, 14, 1]]) { const p = proj(x, 5.2, z - .6), a = clamp((t - 12.8) / .5) * (t < 19 ? 1 : .5); const gr = g.createRadialGradient(p[0], p[1], 2, p[0], p[1], 5 * p[3]); gr.addColorStop(0, `rgba(170,210,255,${.22 * a})`); gr.addColorStop(1, 'rgba(190,225,255,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920); g.restore(); }
    // cup-phone string and the stars that light up along it
    if (t > 15.7) {
      const u = clamp((t - 15.7) / .6), pts = []; for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push(proj(lerp(-4, 4, s), 8.6 + Math.sin(s * Math.PI) * 9.5 - (1 - u) * 3, 18)); }
      g.save(); g.strokeStyle = 'rgba(250,240,220,.95)'; g.lineWidth = 3; g.beginPath(); pts.slice(0, 1 + Math.round(u * 24)).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      if (t > 19.4) for (let i = 2; i < 23; i += 3) { const k = clamp((t - 19.4 - i * .07) / .3); if (k <= 0) continue; const p = pts[i], r = 9 * k * (1 + .2 * Math.sin(t * 6 + i)); const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4); gr.addColorStop(0, 'rgba(255,236,160,.9)'); gr.addColorStop(1, 'rgba(255,236,160,0)'); g.fillStyle = gr; g.fillRect(p[0] - r * 4, p[1] - r * 4, r * 8, r * 8); g.fillStyle = '#fff6cf'; g.beginPath(); g.arc(p[0], p[1], r * .5, 0, 7); g.fill(); }
      g.restore();
    }
  },
  cam: track([
    [12.2, [0, 9, 16, 62, 24, 0, 1750]], [13.0, [0, 9, 16, 58, 23, 0, 1750]], [14.6, [9, 8.5, 17, 28, 12, 6, 1750]],
    [15.4, [8.5, 8.5, 17, 30, 12, 5, 1750]], [16.8, [0, 10, 17, 50, 18, 0, 1750]], [18.6, [-8, 8, 15, 32, 13, -5, 1750]],
    [19.4, [-5, 8.5, 15, 40, 15, -3, 1750]], [22.2, [0, 9.5, 16, 46, 16, 2, 1750]],
  ]),
};

// map spread: his pin → her pin
const mapXZ = (mx, my) => [-20 + mx / 1000 * 40, 30 - my / 750 * 30];
function bez(p0, p1, p2, p3, u) { const v = 1 - u; return p0.map((_, i) => v * v * v * p0[i] + 3 * v * v * u * p1[i] + 3 * v * u * u * p2[i] + u * u * u * p3[i]); }
function route(u) { return u < .5 ? bez([170, 600], [380, 640], [420, 380], [600, 400], u * 2) : bez([600, 400], [760, 410], [800, 260], [830, 200], u * 2 - 1); }
const A3 = {
  back: () => BD.day(), ground: () => GR.map(), groundCol: '#efe3c2',
  cards(t) {
    const L = [], T0 = 22.75;
    let [x, z] = mapXZ(170, 600); let a = life(t, T0); L.push({ img: P.mpin('him'), X: x, Z: z + 1.5, h: 6, a, alpha: al(a) });
    [x, z] = mapXZ(830, 200); a = life(t, T0 + .1); L.push({ img: P.mpin('her'), X: x, Z: z, h: 6, a, alpha: al(a) });
    // grey clouds over the map part (pull-tab) — "拨开阴霾"
    const open = eio(seg(t, 23.3, 24.6));
    [[-4, 16, 0], [4, 12, 1], [0, 20, 2], [-8, 21, 3], [8, 18, 0]].forEach(([cx, cz, n], i) => { const s = Math.sign(cx || (i % 2 ? 1 : -1)); L.push({ img: P.cloud(n, '#9aa3ad'), X: cx + s * open * 22, Z: cz, y0: 4, h: 4.2, a: 70, alpha: (1 - open) * clamp((t - 22.5) / .3), shadowA: .7 }); });
    L.push({ img: P.sun(), X: 4, Z: 29.7, y0: 16, h: 7, a: life(t, 23.9), alpha: al(life(t, 23.9)), shadow: false, rot: t * .2 });
    // the red motorcycle pops up from the fold at his pin, then rides the route
    const u = eio(seg(t, 24.0, 25.4)) * .42, [mx, my] = route(u), [bx, bz] = mapXZ(mx, my);
    a = life(t, 23.45, 1e9, .5);
    L.push({ img: motoCard(t * 14, 'ride'), X: bx, Z: bz, h: 6, a, alpha: al(a) });
    return L;
  },
  cam: track([[22.4, [0, 0, 15, 74, 64, 0, 1750]], [23.4, [-1, 1, 14, 66, 60, 0, 1750]], [25.4, [-1, 2, 14, 46, 46, 5, 1750]]]),
};

// the ride: side view, everything moves past at one world speed (perspective makes the parallax)
const speedOf = t => t < 28 ? 9 : 9 + 14 * ss(seg(t, 28, 28.4));
const dist = t => { let s = 0; const a = 25.4; const n = Math.max(1, Math.round((t - a) * 24)); for (let i = 0; i < n; i++) s += speedOf(a + (i + .5) * (t - a) / n) * (t - a) / n; return s; };
const wrap = (x, span) => ((x % span) + span) % span - span / 2;
const A4 = {
  back: () => BD.day(), ground: () => GR.road(), groundCol: '#a8c98a', ride: 1,
  cards(t) {
    const L = [], s = dist(t);
    const put = (img, x0, Z, h, span, extra = {}) => { const X = wrap(x0 - s, span); if (Math.abs(X) < 23) L.push({ img, X, Z, h, a: 90, ...extra }); };
    // far city and the overpass (from his photo), trees, lamp posts, near bushes
    ['#c9d6e8', '#e8d5c4', '#d6e3cf', '#efd9de', '#d9d0e8'].forEach((c, i) => put(P.building(i, c), i * 9, 28.5, 14 + (i % 2) * 3, 45));
    put(P.overpass(), 6, 24, 13, 60);
    for (let i = 0; i < 6; i++) put(P.tree(i % 3, i % 2 ? '#7fb267' : '#93c47d'), i * 8 + 3, 20 + (i % 2), 8 + (i % 3), 48);
    for (let i = 0; i < 4; i++) put(P.lamppost(), i * 11 + 5, 17.3, 9, 44);
    for (let i = 0; i < 8; i++) put(P.dash(), i * 6, 12.2, 1, 48, { a: 0, dir: 1, shadow: false });
    for (let i = 0; i < 6; i++) put(P.bush(i % 3), i * 8 + 1, 5.5, 2.6, 48);
    for (let i = 0; i < 5; i++) put(P.flower(['#ffd36e', '#ff8fa3', '#ffffff'][i % 3], i), i * 10 + 4, 3, 2.6, 50);
    const bob = Math.sin(t * 18) * .08;
    L.push({ img: motoCard(s / 2.2, 'ride'), X: -1.5 + Math.sin(t * .8) * .4, Z: 12.4, y0: bob + .05, h: 8.4, a: 90 });
    return L;
  },
  overlay(g, t) {
    if (t < 27.9) return;
    const k = seg(t, 27.9, 28.3) * (1 - seg(t, 29.3, 29.65));
    g.save(); g.globalAlpha = .75 * k; for (let i = 0; i < 16; i++) { const y = 200 + ((i * 523) % 1500), x = ((i * 337 - t * 2400) % 1600 + 1600) % 1600 - 300, l = 220 + (i * 97) % 260; const gr = g.createLinearGradient(x, 0, x + l, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.9)'); g.fillStyle = gr; g.fillRect(x, y, l, 5); } g.restore();
  },
  cam: track([[25.4, [-2, 5, 12, 38, 9, 0, 1750]], [27.9, [-1, 5.2, 12, 33, 8, 0, 1750]], [28.2, [-1, 5, 12, 28, 7, 0, 1750]], [29.7, [0, 5.2, 12, 30, 8, 0, 1750]]]),
  shake: t => t > 28 && t < 29.6 ? [Math.sin(t * 53) * 3, Math.cos(t * 47) * 3] : [0, 0],
};

// mall: arrival, the meeting, the confession, the date
const A5 = {
  back: () => BD.warm(), ground: () => GR.plaza(), groundCol: '#e8dccb',
  cards(t) {
    const L = [], T0 = 30.2;
    let a = life(t, T0); L.push({ img: P.mall(), X: 0, Z: 28.6, h: 17.5, a, alpha: al(a), shadow: false });
    a = life(t, T0 + .08); L.push({ img: P.planter(), X: -15, Z: 22, h: 4, a, alpha: al(a) }); L.push({ img: P.planter(), X: 15, Z: 22, h: 4, a, alpha: al(a) });
    a = life(t, T0 + .12); L.push({ img: P.lamppost(), X: -17.5, Z: 19, h: 9, a, alpha: al(a) }); L.push({ img: P.lamppost(), X: 17.5, Z: 19, h: 9, a, alpha: al(a), flip: true });
    // the bike rolls in and stops; then he stands beside it with the helmet in his hand
    const arrive = eo(seg(t, 30.25, 31.0)), mx = lerp(-28, -13.5, arrive), riding = t < 31.05;
    if (t > 30.25) L.push({ img: motoCard(riding ? (mx + 26) / 1.2 : 11, riding ? 'ride' : 'empty'), X: mx, Z: 12, h: 7, a: 90, layer: 0 });
    const calUp = t > 34.75;
    // him
    if (t > 31.0) {
      a = pop(t, 31.0, .35);
      const arms = t < 31.45 ? 'helmet' : t < 34.7 ? 'offer' : 'down';
      L.push(ch('him', { expr: t < 31.45 ? 'smile' : t < 34.7 ? 'shy' : 'smile', turn: calUp ? .2 : .5, arms, blink: blink(t), look: calUp ? 1 : 0 }, calUp ? -10 : -5.2, 12, H_HIM, a));
    }
    // her: looking at the mall, turns (scale-x flip) — the person from the screen is really here
    {
      const turnK = seg(t, 30.9, 31.25), sx = Math.abs(Math.cos(turnK * Math.PI)) || .02, front = turnK > .5;
      a = life(t, T0 + .2);
      const p = front ? { expr: t < 31.6 ? 'surprise' : t < 34.7 ? 'shy' : 'smile', turn: calUp ? -.2 : -.5, arms: t > 32.2 && t < 34.7 ? 'chin' : 'down', blink: blink(t, 1), look: calUp ? -1 : 0 } : { view: 'back' };
      L.push(ch('her', p, calUp ? 10 : 5.4, 12.5, H_HER, a, { sx }));
    }
    // a phone frame around him falls away: not a screen any more
    if (t > 31.05 && t < 32.2) { const k = seg(t, 31.35, 32.0); L.push({ img: P.frame(), X: -5.2, Z: 10, h: 15, a: 90 * (1 - eio(k)), dir: -1, alpha: 1 - seg(t, 31.9, 32.2), shadowA: .6 }); }
    // paper fireworks and hearts (L10)
    [[31.7, -7, 18, '#ff8fa3'], [32.3, 6, 20, '#ffd36e'], [32.9, -1, 22, '#9fc4ee'], [33.5, 9, 17, '#ff8fa3'], [34.1, -9, 21, '#ffd36e']].forEach(([t0, x, y, c], i) => {
      if (t < t0 || t > t0 + 1.6) return; const k = back(seg(t, t0, t0 + .35), 2.2), f = 1 - seg(t, t0 + 1.1, t0 + 1.6);
      L.push({ img: P.firework(c, i), X: x, Z: 25, y0: y - 6, h: 7 * k, a: 90, alpha: f, shadow: false, rot: (t - t0) * .4 });
    });
    for (let i = 0; i < 7; i++) { const t0 = 31.8 + i * .4; if (t < t0 || t > t0 + 2.2) continue; const u = seg(t, t0, t0 + 2.2); L.push({ img: P.heart(i % 2 ? '#ff7d96' : '#ffb3c1'), X: -2 + Math.sin(i * 2.3) * 4 + Math.sin(t * 2 + i) * .6, Z: 14, y0: 8 + u * 9, h: 1.6, a: 90, alpha: Math.min(seg(t, t0, t0 + .2), 1 - seg(u, .7, 1)), shadow: false }); }
    // the calendar: pages flip and land on 2025.11.15
    if (calUp) {
      a = life(t, 34.8, 1e9, .5);
      const days = ['1', '3', '5', '7', '9', '11', '13', '14'], u = seg(t, 35.3, 36.5);
      const final = t >= 36.6, idx = Math.min(days.length - 1, Math.floor(u * days.length));
      const txt = final ? '2025.11.15' : days[idx];
      L.push({ img: P.calendar(txt, '2025 NOV'), X: 0, Z: 17, h: 12, a, alpha: al(a), layer: 0 });
      // the page being torn away flips up and back
      if (t > 35.3 && t < 36.85) {
        const per = 1.2 / days.length, k = final ? seg(t, 36.6, 36.85) : ((t - 35.3) % per) / per, prev = final ? days[days.length - 1] : days[Math.max(0, idx - 1)];
        if (!(idx === 0 && !final && t - 35.3 < per)) L.push({ img: P.calendar(prev, '2025 NOV'), X: 0, Z: 16.95, h: 12, a: 90 + 80 * eo(k), dir: 1, alpha: 1 - k * .8, shadow: false, layer: -1 });
      }
      if (t > 37.0) { const k = back(seg(t, 37.0, 37.35), 2.4); L.push({ img: P.stamp(), X: 4.2, Z: 16.6, y0: 7.6, h: 3.4 * k, a: 90, rot: -.25, shadow: false, layer: -2 }); }
    }
    return L;
  },
  cam: track([
    [30.2, [-6, 7.5, 14, 54, 20, 0, 1750]], [31.0, [-4, 7, 13, 40, 14, 0, 1750]], [31.6, [0, 7, 13, 33, 11, 0, 1750]],
    [34.6, [0, 7.5, 13, 37, 12, 0, 1750]], [35.2, [0, 7.5, 16, 40, 12, 0, 1750]], [36.6, [0, 7.4, 17, 27, 6, 0, 1750]], [38.4, [0, 7.4, 17, 25.5, 6, 0, 1750]],
  ]),
};

// life scrapbook: a backdrop pull-tab changes the place every ~2.5 s; real photos are pinned as polaroids
const V = [[38.95, 'cafe'], [41.4, 'burger'], [43.85, 'sunny'], [46.3, 'booth']];
const vIndex = t => { let i = 0; for (let k = 0; k < V.length; k++) if (t >= V[k][0] - .2) i = k; return i; };
export let PHOTOS = {};
const A6 = {
  back: t => BD[V[vIndex(t)][1]](), ground: () => GR.scrap(), groundCol: '#f6ecd8',
  slide(t) { const i = vIndex(t); if (i === 0) return null; const t0 = V[i][0] - .2; const k = eio(seg(t, t0, t0 + .32)); return k < 1 ? { from: BD[V[i - 1][1]](), to: BD[V[i][1]](), k } : null; },
  cards(t) {
    const L = [], vi = vIndex(t);
    const win = (i) => { const t0 = V[i][0], t1 = i < 3 ? V[i + 1][0] - .3 : 1e9; return [t0, t1]; };
    // polaroids accumulate on the backdrop
    const pol = [['her2', -13, 22, -.12], ['him1', 13.2, 22.5, .1], ['him2', -14.5, 13.5, .08], ['her1', 14.5, 13, -.09]];
    pol.forEach(([k, x, y, r], i) => { const t0 = V[i][0] + .5; if (t < t0 || !PHOTOS[k]) return; const s = spring(t - t0, 9, .4); L.push({ img: P.polaroid(PHOTOS[k], k), X: x, Z: 29.3, y0: y - 5, h: 6.4, a: 90, rot: r + (1 - s) * .5, sx: Math.min(1.05, s), alpha: clamp((t - t0) * 6), shadowA: .5, layer: 0 }); L.push({ img: P.tape(), X: x, Z: 29.2, y0: y + .85, h: .7, a: 90, rot: r * 2, alpha: clamp((t - t0 - .15) * 6), shadow: false }); });
    // little paper flowers gather along the front edge
    for (let i = 0; i <= vi; i++) for (let j = 0; j < 2; j++) { const n = i * 2 + j, x = -17 + n * 4.8, a = life(t, V[i][0] + .2 + j * .1, 1e9, .4); L.push({ img: P.flower(['#ff8fa3', '#ffd36e', '#f59ab0', '#9fc4ee'][n % 4], n), X: x, Z: 2.5 + (n % 2), h: 3 + (n % 3) * .4, a, alpha: al(a), rot: sway(t, n) }); }
    // V1 café: milk tea, her chin on her fists (from her photo), he can't stop smiling
    { const [t0, t1] = win(0); if (t < t1 + .3) {
      let a = life(t, t0, t1); L.push({ img: P.table('#b98a64'), X: 0, Z: 10.5, h: 5.8, a, alpha: al(a) });
      a = life(t, t0 + .1, t1); L.push({ img: P.tea(), X: -2.4, Z: 10.3, y0: 4.4, h: 3.3, a, alpha: al(a), shadow: false }); L.push({ img: P.tea(), X: 2.2, Z: 10.3, y0: 4.4, h: 3.3, a, alpha: al(a), shadow: false });
      a = life(t, t0 + .05, t1); L.push(ch('her', { expr: 'smile', arms: 'chin', turn: -.15, blink: blink(t, 1) }, 4.8, 13.5, H_HER, a));
      L.push(ch('him', { expr: t < t0 + 1.2 ? 'smile' : 'shy', turn: .45, blink: blink(t), look: 1 }, -5, 13.8, H_HIM, life(t, t0 + .1, t1)));
    } }
    // V2 fast food: she feeds him a burger, he takes a giant bite
    { const [t0, t1] = win(1); if (t > t0 - .2 && t < t1 + .3) {
      let a = life(t, t0, t1); L.push({ img: P.table('#e9e4dc'), X: 0, Z: 10, h: 5.6, a, alpha: al(a) });
      a = life(t, t0 + .1, t1); L.push({ img: P.fries(), X: 6, Z: 9.8, y0: 4.2, h: 3.2, a, alpha: al(a), shadow: false });
      L.push(ch('her', { expr: 'laugh', arms: 'feed', turn: -.35, blink: blink(t, 1), flip: true }, 3.1, 16.5, H_HER, life(t, t0 + .05, t1)));
      const bite = t > t0 + .9 && ((t - t0) % .9) < .45;
      L.push(ch('him', { expr: bite ? 'bite' : 'laugh', turn: .2, blink: 0 }, -2.8, 12.2, H_HIM, life(t, t0 + .12, t1)));
    } }
    // V3 sunny day: he sits on a bench with a bottle of water and grins; she takes his photo
    { const [t0, t1] = win(2); if (t > t0 - .2 && t < t1 + .3) {
      let a = life(t, t0, t1); L.push({ img: P.barrier(), X: -10, Z: 22, h: 4.6, a, alpha: al(a) }); L.push({ img: P.barrier(), X: 7, Z: 23, h: 4.6, a, alpha: al(a) });
      a = life(t, t0 + .06, t1); L.push({ img: P.bench(), X: -2.5, Z: 15.5, h: 4.6, a, alpha: al(a) });
      L.push(ch('him', { expr: 'smile', arms: 'bottle', sit: 1, turn: .25, blink: blink(t) }, -2.5, 15.2, H_HIM, life(t, t0 + .1, t1)));
      L.push(ch('her', { expr: t < t0 + 1.2 ? 'smile' : 'laugh', arms: 'photo', turn: -.55, blink: blink(t, 2), flip: true }, 10, 10.5, H_HER, life(t, t0 + .14, t1)));
      if (t > t0 + 1.0 && t < t0 + 1.5) { const k = seg(t, t0 + 1.0, t0 + 1.5); L.push({ img: P.star('#fffbe6'), X: 7, Z: 10.2, y0: 8.6, h: 3.4 * back(clamp(k * 3)), a: 90, alpha: 1 - k, shadow: false }); }
    } }
    // V4 photo booth: together, a little heart
    { const [t0] = win(3); if (t > t0 - .2) {
      L.push(ch('him', { expr: 'smile', arms: 'heart', turn: .2, blink: blink(t) }, -3.8, 13.2, H_HIM, life(t, t0 + .02)));
      L.push(ch('her', { expr: 'shy', arms: 'heart', turn: -.2, blink: blink(t, 1), flip: true }, 3.8, 13.4, H_HER, life(t, t0 + .08)));
      for (let i = 0; i < 5; i++) { const t1 = t0 + .5 + i * .3; if (t < t1) continue; const u = seg(t, t1, t1 + 1.8); L.push({ img: P.heart(i % 2 ? '#ff7d96' : '#ffb3c1'), X: -6 + i * 3, Z: 14, y0: 10 + u * 6, h: 1.4, a: 90, alpha: Math.min(1, 1 - seg(u, .7, 1)), shadow: false }); }
    } }
    return L;
  },
  cam: track([
    [38.9, [0, 8.5, 14, 44, 14, 0, 1750]], [41.2, [0, 8, 13, 36, 12, 3, 1750]],
    [41.5, [0, 8, 13, 38, 12, -2, 1750]], [43.7, [0, 7.8, 13, 32, 11, -4, 1750]],
    [43.95, [2, 7.5, 13, 44, 20, 0, 1750]], [46.1, [1, 7, 13, 38, 22, 2, 1750]],
    [46.4, [0, 9, 14, 46, 13, 0, 1750]], [48.6, [0, 9, 14, 50, 14, 0, 1750]],
  ]),
};

// the road ahead: back view, hand in hand, flowers and stars on both sides
const walkZ = t => lerp(5, 17.5, eio(seg(t, 49.4, 53.2)) * .3 + seg(t, 49.4, 53.2) * .7);
const A7 = {
  back: () => BD.golden(), ground: () => GR.path(), groundCol: '#f5dfae',
  cards(t) {
    const L = [], z = walkZ(t), ph = step(((z - 5) / 1.4) % (Math.PI * 2) / (Math.PI * 2), 8) * Math.PI * 2;
    const walking = t > 49.4 && t < 53.4;
    // flowers rise as they pass (back to front, ahead of them)
    for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1, zz = 4 + Math.floor(i / 2) * 3.6, x = side * (6.5 + (i * 7 % 5) * .8 + zz * .12); const t0 = 49.2 + (zz - 4) * .18; const a = life(t, t0, 1e9, .45); L.push({ img: P.flower(['#ff8fa3', '#ffd36e', '#f59ab0', '#ffffff'][i % 4], i), X: x, Z: zz, h: 3.4 + (i % 3) * .6, a, alpha: al(a), rot: sway(t, i) }); }
    for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1; const a = life(t, 49.15 + i * .12); L.push({ img: P.tree(i % 3, '#f2b8a0'), X: side * (14 + (i % 3) * 2), Z: 20 + (i % 3) * 3, h: 8, a, alpha: al(a) }); }
    // stars lifting into the light
    for (let i = 0; i < 12; i++) { const t0 = 49.6 + i * .3; if (t < t0) continue; const u = seg(t, t0, t0 + 3.5); L.push({ img: P.star(i % 2 ? '#ffd36e' : '#fff1b8'), X: Math.sin(i * 2.4) * 9, Z: 12 + (i % 4) * 3, y0: 2 + u * 14, h: 1.1 + (i % 3) * .35, a: 90, rot: t * (i % 2 ? .7 : -.7), alpha: Math.min(seg(t, t0, t0 + .3), 1 - seg(u, .8, 1)), shadow: false }); }
    const a = life(t, 49.2);
    const pHim = { view: 'back', arms: 'reachR', walk: walking ? ph : -1 }, pHer = { view: 'back', arms: 'reachL', walk: walking ? ph + Math.PI : -1, hairSway: walking ? Math.round(Math.sin(ph) * 4) : 0 };
    L.push(ch('him', pHim, -2.55, z, H_HIM, a)); L.push(ch('her', pHer, 2.3, z + .05, H_HER, a));
    return L;
  },
  cam: track([[48.9, [0, 7.5, 10, 36, 12, 0, 1750]], [50.5, [0, 8, 12, 38, 12, 0, 1750]], [52.0, [0, 8, 15, 44, 16, 0, 1750]], [53.4, [0, 6, 16, 66, 34, 0, 1750]]]),
};

// the last page: a handwritten line, then the book closes
const LINE = '我们的故事，未来再续……';
function letterGround(n) {
  return cached('letterG' + n, () => {
    const base = GR.letter(), c = mk(base.width, base.height), g = c.getContext('2d'); g.drawImage(base, 0, 0);
    g.fillStyle = '#4a2a20'; g.font = '104px HandZh'; g.textBaseline = 'alphabetic';
    const l1 = LINE.slice(0, 6), l2 = LINE.slice(6);
    let k = 0; const put = (s, x, y) => { for (const chh of s) { if (k++ >= n) return; g.fillText(chh, x, y); x += g.measureText(chh).width; } };
    put(l1, 150, 330); put(l2, 330, 500);
    return c;
  });
}
const A8 = {
  back: () => BD.letter(), ground: t => letterGround(Math.min(LINE.length, Math.floor(seg(t, 54.1, 55.4) * LINE.length + (t >= 54.1 ? 1 : 0)))), groundCol: '#f6ecd6',
  cards(t) {
    const L = []; let a = life(t, 54.0);
    L.push({ img: P.heart('#ff7d96'), X: 14.5, Z: 4.5, h: 2.6, a: Math.min(a, 30), dir: 1, alpha: al(a), shadow: false });
    L.push({ img: P.star('#ffd36e'), X: -15, Z: 25, h: 2.2, a: Math.min(a, 30), dir: 1, alpha: al(a), shadow: false });
    return L;
  },
  cam: track([[53.9, [0, 0, 15, 56, 70, 0, 1750]], [56.8, [0, 0, 15, 50, 72, 0, 1750]], [57.9, [0, 0, 15, 62, 58, 0, 1750]], [59.1, [0, 0, 15, 66, 56, 0, 1750]]]),
};

// ---------- the sequence ----------
// [start, spread]; page turns between them [t0, t1]
export const SEQ = [[0, A1], [11.9, A2], [22.6, A3], [25.42, A4], [30.15, A5], [38.85, A6], [48.95, A7], [53.85, A8]];
export const TURNS = [[11.2, 11.9, A1, A2], [21.95, 22.6, A2, A3], [29.55, 30.15, A4, A5], [38.3, 38.85, A5, A6], [48.4, 48.95, A6, A7], [53.25, 53.85, A7, A8]];
export const OPEN = [.2, 1.3], CLOSE = [56.7, 57.6];
export const FADE = [58.45, 59.04];
export function spreadAt(t) { let s = SEQ[0][1]; for (const [t0, sp] of SEQ) if (t >= t0) s = sp; return s; }
export function grade(t) {
  const cool = clamp(1 - (t - 4) / 22) * .9;
  const warm = clamp((t - 22) / 10) * .55 + clamp((t - 38) / 12) * .3 + (t > 48.5 ? .15 : 0);
  return { cool, warm };
}
