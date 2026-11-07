/* ★ 为什么占卜让你觉得准？ · 序章样片（0–30s）· C 夜曲（黑底 · 暖白字 · 香槟金细线）
 * 分镜：storyboard.md；视觉规范：docs/01-视觉规范.md；事实：docs/02-知识框架.md
 *
 * 镜 1–3  这是什么：两排方孔铜钱 / 在干什么：落下、翻面；甲排换面处亮刻度；乙排 5 连划金线 / 明白：真随机反而会连号
 * 镜 4    这是什么：一面铜钱墙 + 一个比例计数器 / 在干什么：一行接一行地抛 / 明白：20 次里出现 4 连是常态（≈77%）
 * 镜 5    这是什么：同一面墙 / 在干什么：没连号的退成暗灰 / 明白：随机本身就长得像"规律"
 * 镜 6    片名卡：金线收拢 → 闪 → 金点聚成片名
 *
 * 事实与示意：
 *  - 甲排是"人写的"序列（换面 15 次，最长连号 2），按 Falk & Konold 1997 的偏好编排。
 *  - 乙排是 Python random.Random(7) 抽出的 20 次，含 5 连正面（这类序列占 45.8%）。
 *  - 计数器是载入时用 rng(20261111) 跑的 10,000 轮伪随机模拟，真算（结果 76.8%）；精确值 0.7684。种子选了一个结果有代表性的：20 个相邻种子的结果在 75.6%–77.8% 之间。
 * 颜色：香槟金 = 大脑选中的；暗灰 = 被略过的；铜钱青铜只给铜钱。全片不用冰蓝、玫红、紫。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit, P = K.PAL.night;

/* 把夜曲色板收窄成本片的三色：暖白、暖灰、香槟金（字幕件读的就是这张表） */
Object.assign(P, { ink: '#F4EEE3', sub: '#E6DFD2', en: '#8D867B', label: '#8D867B', gold: '#E3CB97', goldLo: '#A88F64' });
const C = { white: '#F4EEE3', gray: '#8D867B', dim: '#5A554D', gold: '#E3CB97', goldLo: '#A88F64', hole: '#040302' };

const T = { end: 30, s4: 14.0, wall: 15.0, simEnd: 18.4, freeze: 19.0, gather: 22.7, flash: 23.35 };

const SUBS = [
  { a: 1.0,  b: 5.2,  zh: '两排铜钱，各抛 20 次。哪一排，是真抛出来的？', en: 'Two rows of coins, 20 tosses each. Which one is real?' },
  { a: 5.6,  b: 9.4,  zh: '多数人会选甲：正反交错，看着更“乱”。',         en: 'Most people pick A: it keeps alternating, so it looks more random.' },
  { a: 9.8,  b: 13.6, zh: '真抛出来的，是乙——它连着出了 5 个正面。',      en: 'The real one is B — five heads in a row.' },
  { a: 14.0, b: 18.6, zh: '抛 20 次，约 77% 的情况会出现连续 4 次同一面。', en: 'In about 77% of 20-toss runs, the same face comes up 4 times in a row.' },
  { a: 19.0, b: 22.6, zh: '随机不是均匀；随机，本来就会{扎堆}。',            en: 'Random is not even. Random clusters.' },
];

/* ---------- 数据 ---------- */
const seq = s => Array.from(s).map(c => c === '正');
const ROW_A = seq('正反正正反正反反正反正正反正反正反反正反');   // 人写的
const ROW_B = seq('正正反正反正正反正正正正正反正正反反反正');   // random.Random(7)
const runsOf = (r, k) => { const out = []; let s = 0; for (let i = 1; i <= r.length; i++) if (i === r.length || r[i] !== r[i - 1]) { if (i - s >= k) out.push([s, i - 1]); s = i; } return out; };
const B_RUN = runsOf(ROW_B, 5)[0];                                  // [8, 12]
const A_SWITCH = []; for (let i = 1; i < 20; i++) if (ROW_A[i] !== ROW_A[i - 1]) A_SWITCH.push(i);   // 15 处

/* 10,000 轮模拟：第 0 轮就是乙排；HITS[n] = 前 n 轮里出现 ≥4 连的轮数 */
const NSIM = 10000;
const SIM = (() => { const r = rng(20261111), rows = [ROW_B]; for (let n = 1; n < NSIM; n++) { const row = []; for (let i = 0; i < 20; i++) row.push(r() < .5); rows.push(row); } return rows; })();
const RUNS4 = SIM.map(r => runsOf(r, 4));
const HITS = (() => { const h = new Uint16Array(NSIM + 1); for (let n = 0; n < NSIM; n++) h[n + 1] = h[n] + (RUNS4[n].length ? 1 : 0); return h; })();

/* ---------- 版式 ---------- */
const BIG = { r: 34, dx: 78, yA: 372, yB: 600 };
const bigX = i => W / 2 + (i - 9.5) * BIG.dx;
const WALL = { r: 14.5, dx: 35, cx: 700, y0: 176, dy: 33, rows: 19 };
const wallX = i => WALL.cx + (i - 9.5) * WALL.dx;
const landA = i => 1.05 + i * .075, landB = i => 1.55 + i * .075;

/* 墙上此刻抛到第几轮（连续值）：先一行一行落，再越来越快 —— 对数时间 */
const nAt = t => { const k = seg(t, T.wall, T.simEnd); return k <= 0 ? 1 : Math.min(NSIM, Math.exp(Math.log(NSIM) * Math.pow(k, 1.35))); };

/* ---------- 实物：方孔铜钱（画在辉光层之下） ---------- */
const LEGEND = ['太', '宝', '平', '通'];   // 上 左 下 右 → 对读：太平通宝
function coin(x, cx, cy, r, heads, o = {}) {
  const a = o.a == null ? 1 : o.a, sy = o.sy == null ? 1 : Math.max(.06, o.sy), dim = o.dim || 0; if (a <= .003) return;
  x.save(); x.globalAlpha = a; x.translate(cx, cy); x.scale(1, sy);
  /* 投影 */
  x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.arc(r * .06, r * .1, r * 1.04, 0, 6.2832); x.fill();
  /* 钱身：径向渐变出体积，字面亮、背面暗 */
  const g = x.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.05);
  if (heads) { g.addColorStop(0, '#D9BC82'); g.addColorStop(.45, '#A9884F'); g.addColorStop(1, '#5B4223'); }
  else       { g.addColorStop(0, '#7A6040'); g.addColorStop(.5, '#4F3C24'); g.addColorStop(1, '#251A0E'); }
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 6.2832); x.fill();
  /* 外郭、内郭 */
  x.lineWidth = Math.max(1, r * .09); x.strokeStyle = heads ? 'rgba(236,214,160,.55)' : 'rgba(170,140,95,.35)';
  x.beginPath(); x.arc(0, 0, r * .9, 0, 6.2832); x.stroke();
  const h = r * .27;
  x.lineWidth = Math.max(1, r * .07); x.strokeRect(-h - r * .06, -h - r * .06, (h + r * .06) * 2, (h + r * .06) * 2);
  /* 方孔 */
  x.fillStyle = C.hole; x.fillRect(-h, -h, h * 2, h * 2);
  /* 钱文：只在字面、并且翻到够正的时候才画 */
  if (heads && sy > .45 && r > 12) {
    x.fillStyle = 'rgba(62,42,18,.85)'; x.font = VK.fontOf('serif', Math.round(r * .42)); x.textAlign = 'center'; x.textBaseline = 'middle';
    const d = r * .6; [[0, -d], [-d, 0], [0, d], [d, 0]].forEach(([px, py], i) => x.fillText(LEGEND[i], px, py + r * .02));
  }
  /* 左上高光 */
  const hl = x.createRadialGradient(-r * .45, -r * .5, 0, -r * .45, -r * .5, r * .7);
  hl.addColorStop(0, `rgba(255,240,205,${heads ? .32 : .12})`); hl.addColorStop(1, 'rgba(255,240,205,0)');
  x.fillStyle = hl; x.beginPath(); x.arc(0, 0, r, 0, 6.2832); x.fill();
  /* 被略过：压暗、去色 */
  if (dim > 0) { x.fillStyle = `rgba(8,7,6,${Math.min(.9, .72 * dim)})`; x.beginPath(); x.arc(0, 0, r * 1.02, 0, 6.2832); x.fill(); }
  x.restore();
}
/* 一枚正在落下的铜钱：从上方落下、翻面三圈半、弹一下 */
function tossed(x, t, tl, cx, cy, r, heads, o = {}) {
  const k = seg(t, tl - .5, tl); if (k <= 0) return;
  const ph = (1 - E.out2(k)) * Math.PI * 3, c = Math.cos(ph), up = heads ? c >= 0 : c < 0;
  const bounce = Math.sin(Math.PI * seg(t, tl, tl + .2)) * r * .28;
  coin(x, cx, cy - Math.pow(1 - k, 2) * 260 - bounce, r, up, Object.assign({}, o, { sy: Math.abs(c), a: (o.a == null ? 1 : o.a) * ss(t, tl - .5, tl - .35) }));
}

/* ---------- 金线：一把带刻度的细尺 ---------- */
function goldRule(fr, x0, x1, y, k, a, o = {}) {
  if (k <= 0 || a <= 0) return; const xe = lerp(x0, x1, k), w = o.w || 1.2;
  fr.line(x0, y, xe, y, { color: C.gold, w, a: .8 * a, glow: o.glow == null ? 8 : o.glow, cap: 'butt' });
  const n = o.ticks || 0; for (let i = 0; i < n; i++) { const tx = lerp(x0, x1, n === 1 ? .5 : i / (n - 1)); if (tx <= xe + .5) fr.line(tx, y - (o.th || 6), tx, y, { color: C.gold, w: 1, a: .7 * a, cap: 'butt' }); }
}

/* ---------- 章节标（本片色板的版本） ---------- */
function mark(fr, t) {
  const k = fade(t, .3, T.gather, .9, .6) * .55; if (k <= 0) return;
  let x = 101; x += fr.text('00', x, 88, { font: 'mono', size: 15, track: 3, color: C.gray, align: 'l', a: k }) + 18;
  x += fr.text('序', x, 87, { font: 'serifr', size: 22, track: 3, color: C.white, align: 'l', a: k }) + 16;
  fr.text('PROLOGUE', x, 88, { font: 'mono', size: 13, track: 5, color: C.gray, align: 'l', a: k });
  fr.line(101, 110, 101 + 250 * ss(t, .3, 1.4), 110, { w: 1, color: C.goldLo, a: .5 * k, cap: 'butt' });
}

/* ---------- 镜 1–3：两排铜钱 ---------- */
function rows(fr, t) {
  const out = ss(t, T.s4 - .1, T.s4 + .6);                         // 甲排在镜 4 开头退场
  const aA = 1 - out; if (aA <= 0 && t > T.s4 + 1) return;
  const dimA = ss(t, 9.95, 10.7);
  /* 甲 / 乙 两个字 */
  fr.text('甲', 120, BIG.yA, { font: 'serifr', size: 30, color: mix(C.white, C.dim, dimA), a: ss(t, .8, 1.3) * aA });
  fr.text('乙', 120, BIG.yB, { font: 'serifr', size: 30, color: C.white, a: ss(t, 1.3, 1.8) * aA });
  /* 镜 2：甲排每一次换面，缝里亮一道金色短刻度 */
  A_SWITCH.forEach((i, j) => {
    const tk = 5.95 + j * .14, k = ss(t, tk, tk + .25), a = k * (1 - .8 * dimA) * aA; if (a <= 0) return;
    const xm = (bigX(i - 1) + bigX(i)) / 2;
    fr.line(xm, BIG.yA - 44, xm, BIG.yA + 44, { color: mix(C.gold, C.dim, dimA), w: 1.3, a: .85 * a, glow: 6 });
    fr.sfx(tk, 'tick', { pitch: 4 + (j % 3), gain: .35 });
  });
  fr.text('换面 15 次', W / 2, BIG.yA - 92, { font: 'serifr', size: 22, track: 4, color: C.gray, a: fade(t, 8.2, 10.6, .5, .5) * aA });
  fr.text('ALTERNATIONS', W / 2, BIG.yA - 66, { font: 'mono', size: 13, track: 5, color: C.dim, a: fade(t, 8.4, 10.6, .5, .5) * aA });
  /* 镜 3：乙排的 5 连划上金线（镜 4 里跟着乙排一起缩进墙里，见 wall） */
  if (t < T.s4) {
    const [s, e] = B_RUN, k = E.io3(seg(t, 10.35, 11.3)), y = BIG.yB + BIG.r + 16;
    goldRule(fr, bigX(s) - BIG.r, bigX(e) + BIG.r, y, k, ss(t, 10.3, 10.5), { ticks: 5, th: 7, w: 1.3 });
    fr.text('连续 5 次正面', (bigX(s) + bigX(e)) / 2, y + 40, { font: 'serifr', size: 22, track: 4, color: C.gold, a: ss(t, 11.0, 11.6) * (1 - ss(t, 13.4, 13.9)) });
    fr.text('FIVE IN A ROW', (bigX(s) + bigX(e)) / 2, y + 66, { font: 'mono', size: 13, track: 5, color: C.goldLo, a: ss(t, 11.2, 11.8) * (1 - ss(t, 13.4, 13.9)) });
  }
  fr.sfx(9.95, 'chord', { root: 0, gain: .7 });
}
function rowsUnder(x, t) {
  const aA = 1 - ss(t, T.s4 - .1, T.s4 + .6), dimA = ss(t, 9.95, 10.7);
  if (aA > 0) ROW_A.forEach((h, i) => tossed(x, t, landA(i), bigX(i), BIG.yA, BIG.r, h, { a: aA, dim: dimA * .85 }));
  if (t < T.wall + .05) {                                             // 乙排：镜 4 开头缩成墙的第一行
    const m = E.io3(seg(t, T.s4, T.wall));
    ROW_B.forEach((h, i) => {
      const inRun = i >= B_RUN[0] && i <= B_RUN[1], lift = inRun ? -10 * ss(t, 10.3, 10.9) * (1 - m) : 0;
      const cx = lerp(bigX(i), wallX(i), m), cy = lerp(BIG.yB + lift, WALL.y0, m), r = lerp(BIG.r, WALL.r, m);
      if (m <= 0) tossed(x, t, landB(i), cx, cy, r, h); else coin(x, cx, cy, r, h);
    });
  }
}

/* ---------- 镜 4–5：铜钱墙 + 计数器 ---------- */
function wallLayout(t) {
  const nf = nAt(t), n = Math.floor(nf), first = Math.max(0, n - WALL.rows);
  return { nf, n, first };
}
function wallUnder(x, t) {
  if (t < T.wall || t > T.flash + .1) return;
  const L = wallLayout(t), dim = ss(t, T.freeze, T.freeze + .9), out = 1 - ss(t, T.gather - .15, T.gather + .35);
  for (let j = 0; j < WALL.rows; j++) {
    const n = L.first + j; if (n >= L.n) break;
    const row = SIM[n], rr = RUNS4[n], y = WALL.y0 + j * WALL.dy;
    const newest = n === L.n - 1 && L.nf < 40, kin = newest ? clamp((L.nf - n) * 1.6) : 1;   // 前几十行：新的一行从上方落进来
    row.forEach((h, i) => {
      const inRun = rr.some(([s, e]) => i >= s && i <= e);
      coin(x, wallX(i), y - (1 - kin) * 22, WALL.r, h, { a: kin * out, dim: inRun ? 0 : dim * 1.25 });
    });
  }
}
function wall(fr, t) {
  if (t < T.wall - .3 || t > T.flash + .1) return;
  const L = wallLayout(t), dim = ss(t, T.freeze, T.freeze + .9), out = 1 - ss(t, T.gather - .15, T.gather + .35);
  /* 每一行里 ≥4 连的地方：一条带刻度的金线 */
  for (let j = 0; j < WALL.rows && t >= T.wall; j++) {
    const n = L.first + j; if (n >= L.n) break;
    const y = WALL.y0 + j * WALL.dy + WALL.r + 5;
    for (const [s, e] of RUNS4[n]) {
      const k = n === 0 ? 1 : (L.nf < 40 ? clamp((L.nf - n - .4) * 2) : 1);
      goldRule(fr, wallX(s) - WALL.r, wallX(e) + WALL.r, y, k, (.75 + .25 * dim) * out, { ticks: e - s + 1, th: 4, w: 1.1, glow: 5 + 5 * dim });
    }
  }
  /* 乙排缩进墙的那 1 秒：它的金线跟着走 */
  if (t < T.wall + .05) {
    const m = E.io3(seg(t, T.s4, T.wall)), [s, e] = B_RUN;
    const y = lerp(BIG.yB + BIG.r + 16, WALL.y0 + WALL.r + 5, m), r = lerp(BIG.r, WALL.r, m);
    goldRule(fr, lerp(bigX(s), wallX(s), m) - r, lerp(bigX(e), wallX(e), m) + r, y, 1, 1, { ticks: 5, th: lerp(7, 4, m), w: 1.2 });
  }
  /* 计数器：真算出来的比例 */
  const ca = ss(t, T.wall - .2, T.wall + .5) * (1 - .55 * dim) * out; if (ca <= 0) return;
  const n = Math.max(1, L.n), pct = HITS[n] / n * 100, cx = 1440;
  fr.text('出现“连续 4 次同面”的比例', cx, 300, { font: 'serifr', size: 26, track: 4, color: C.gray, a: ca });
  fr.text('SHARE OF RUNS WITH 4 IN A ROW', cx, 334, { font: 'mono', size: 13, track: 4, color: C.dim, a: ca });
  fr.text(pct.toFixed(1) + '%', cx, 450, { font: 'latinl', size: 150, track: 4, color: C.white, a: ca, glow: 10, glowA: .25 });
  fr.line(cx - 210, 540, cx + 210, 540, { color: C.goldLo, w: 1, a: .55 * ca, cap: 'butt' });
  fr.text('已抛 ' + n.toLocaleString('en-US') + ' 轮 × 20 次', cx, 578, { font: 'serifr', size: 24, track: 3, color: C.gray, a: ca });
  fr.text('示意 · 伪随机模拟 · 精确值 76.8%', cx, 622, { font: 'serifr', size: 18, track: 3, color: C.dim, a: ca * ss(t, T.simEnd, T.simEnd + .6) });
  /* 声音：前几十行一行一声，之后交给上滑音 */
  for (let n2 = 1; n2 < 40; n2++) { const tt = T.wall + Math.pow(Math.log(n2 + 1) / Math.log(NSIM), 1 / 1.35) * (T.simEnd - T.wall); if (tt - (T.wall) < 2.2) fr.sfx(+tt.toFixed(3), 'tick', { pitch: n2 % 5, gain: .22 }); }
  fr.sfx(T.wall + 1.2, 'rise', { dur: T.simEnd - T.wall - 1.2, gain: .8 });
  fr.sfx(T.simEnd, 'soft', { gain: .6 });
}

/* ---------- 镜 6：金线收拢 → 闪 → 片名 ---------- */
function gatherLines(fr, t) {
  const k = E.in3(seg(t, T.gather, T.flash)); if (k <= 0 || t > T.flash + .05) return;
  const L = wallLayout(T.gather), cx = W / 2, cy = 438;
  for (let j = 0; j < WALL.rows; j++) {
    const n = L.first + j, y = WALL.y0 + j * WALL.dy + WALL.r + 5;
    for (const [s, e] of RUNS4[n]) {
      const x0 = wallX(s) - WALL.r, x1 = wallX(e) + WALL.r, mx = (x0 + x1) / 2, hw = (x1 - x0) / 2 * (1 - k);
      const px = lerp(mx, cx, k), py = lerp(y, cy, k);
      fr.line(px - hw, py, px + hw, py, { color: C.gold, w: 1.2, a: .85, glow: 8, cap: 'butt' });
    }
  }
  fr.spark(cx, cy, 6 + 10 * k, C.gold, k);
}
function title(fr, t) {
  const lt = t - T.flash; if (lt < -.05) return;
  const a = 1, ly = 590, cy = 438;
  /* 一条带刻度的香槟金细线横向展开，一个金色光点沿线走 */
  const ext = E.out3(seg(lt, .05, 1.3));
  fr.line(W / 2 - 900 * ext, ly, W / 2 + 900 * ext, ly, { w: 1.1, color: C.goldLo, a: .55 * a, cap: 'butt' });
  for (let i = 0; i <= 18; i++) { const tx = W / 2 + (i - 9) * 100; if (Math.abs(tx - W / 2) <= 900 * ext) fr.line(tx, ly + 3, tx, ly + (i % 3 ? 7 : 12), { w: 1, color: C.goldLo, a: .45 * a, cap: 'butt' }); }
  const px = W / 2 - 900 + ((Math.max(0, lt) * 420) % 1800);
  fr.comet(px, ly, 200, 9, C.gold, ss(lt, .4, 1.0) * a);
  /* 金点聚成片名，落成暖白实字 */
  K.dustText(fr, '为什么占卜让你觉得准？', W / 2, cy, { font: 'serifl', size: 112, track: 26, color: C.white, dustColor: C.gold, glow: 12, glowColor: '#C9A86C', glowA: .3, a }, seg(lt, .25, 2.9), t);
  fr.text('随机 · 图案 · 记忆 · 意义', W / 2 + 9, cy + 238, { font: 'serifm', size: 36, track: 18, color: C.goldLo, a: ss(lt, 3.7, 4.6) * a, glow: 8, glowA: .25 });
  fr.text('WHY DIVINATION FEELS RIGHT', W / 2, cy + 292, { font: 'mono', size: 15, track: 5.5, color: C.gray, a: ss(lt, 4.3, 5.2) * a });
}

VK.film({
  dur: T.end, theme: 'night', bloom: .85, meta: { title: '为什么占卜让你觉得准？· 序章样片' },
  draw(fr, t) {
    fr.look.bgo = { core: .55, tint: '#15110B', stars: 0 };
    fr.look.under = (x, tt) => { rowsUnder(x, tt); wallUnder(x, tt); };
    fr.sfx(0, 'soft', { gain: .5 });
    mark(fr, t);
    rows(fr, t);
    wall(fr, t);
    gatherLines(fr, t);
    fr.sfx(T.gather - .05, 'hush', { dur: .6 });
    K.flash(fr, t, T.flash, { color: '#F1E2C0', peak: .55 });
    fr.sfx(T.flash, 'bloom', { root: -3 });
    title(fr, t);
    K.subs(fr, t, SUBS, 'night');                                   // 字幕永远最后画
    /* 落地声：每枚铜钱一声 */
    ROW_A.forEach((_, i) => fr.sfx(+landA(i).toFixed(3), 'tick', { pitch: i % 5, gain: .3 }));
    ROW_B.forEach((_, i) => fr.sfx(+landB(i).toFixed(3), 'tick', { pitch: (i + 2) % 5, gain: .3 }));
  },
});
})();
