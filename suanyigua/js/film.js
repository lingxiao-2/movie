// 《我现在就给你算一卦》— Vibe知识大赏 style (Juno card-papercraft look), no narration, bilingual captions.
// Deep navy-black stage, aged off-white paper cards with thin gold frames, red seals, five-zone layout:
// watermark · chapter label · centre animation · annotation band · bilingual caption band.
// Everything is a pure function of time t (seconds). 1920 × 1080.
import { seg, ss, eio, eo, clamp, lerp, mulberry, back } from '/core/lib.js';

export const DUR = 170;
let G, W, H, PAPER, BACKTEX, OFF, OG;
const C = { bg0: '#050510', bg1: '#12122a', white: '#EAEAF2', grey: '#8A8AA0', gold: '#C9A96A', paper: '#EDE4D3', ink: '#3b2f25', red: '#B53A2F' };
const SANS = '"Noto Sans SC"', SERIF = '"Noto Serif SC"', GARA = '"EB Garamond"';
const HANDLE = '@xiao ling';
const BEAT = 60 / 77;

// ---------------------------------------------------------------------------------------- script (from the doc)
const CARDS = [
  ['你是个心软的人，但不轻易让别人看出来。', 'You’re soft-hearted, but you rarely let it show.'],
  ['你有时候挺能说，有时候又只想一个人待着。', 'Sometimes you talk a lot; sometimes you just want to be alone.'],
  ['最近有一件事，你一直没想好要不要做。', 'There’s something you still can’t decide whether to do.'],
  ['你身边有个人，最近让你有点失望。', 'Someone close to you has let you down lately.'],
  ['你手机里有一张照片，一直没舍得删。', 'There’s a photo on your phone you can’t bring yourself to delete.'],
  ['接下来三个月，会有一个转机，但要你主动一点。', 'In the next three months, a turning point will come, if you reach for it.'],
];
const TRICKS = [   // rules-card name, English, the quoted line, caption cues [zh, en] (split for reading rhythm)
  ['巴纳姆效应', 'The Barnum effect', '心软，但不表现出来', [['巴纳姆效应。足够模糊，谁都能对上。', 'The Barnum effect: vague enough to fit anyone.']]],
  ['两头都说', 'Having it both ways', '有时能说，有时想独处', [['两头都说。怎么样都算你中。', 'Say both sides, and either way it fits.']]],
  ['主观验证', 'Subjective validation', '有件事没想好', [['谁没有一件事没想好？', 'Who hasn’t got one?'], ['是你自己把空白填上了。', 'You filled in the blank yourself.']]],
  ['高概率猜测', 'A high-probability guess', '有个人让你失望', [['高概率猜测。人活着，身边总有一个。', 'A high-probability guess: there’s always someone.']]],
  ['人人都有', 'Everyone has one', '一张没舍得删的照片', [['每个人都有。', 'Everyone has one.'], ['可你一读，就想起了那一张。', 'But as you read it, you thought of yours.']]],
  ['自我实现预言', 'A self-fulfilling prophecy', '三个月后有转机', [['你会因为这句话，更主动地去找机会。', 'You’ll chase chances because of it.'], ['找到了，你就觉得算准了。', 'Find one, and it feels like a true reading.']]],
];
// timeline
const T = { title: 5, cards: 9, cardDur: 6, ask: 45, reveal: 50, grid: 52.8, tricks: 60.6, trickDur: 11.8, forer: 132, people: 139, end: 152, mirror: 156.6, disc: 163.4, credit: 166.6 };
const cardT0 = i => T.cards + i * T.cardDur, trickT0 = i => T.tricks + i * T.trickDur;
const CUES = [];
CUES.push([0.35, 1.75, '别划走。', 'Don’t scroll away.'], [1.75, 3.35, '我现在就给你算一卦。', 'Let me read your fortune, right now.'], [3.35, 4.95, '心里想着你自己，3、2、1。', 'Think of yourself. 3, 2, 1.']);
CARDS.forEach(([zh, en], i) => CUES.push([cardT0(i) + 0.95, cardT0(i) + 5.6, zh, en]));
CUES.push([T.ask + 0.3, T.ask + 4.8, '数一数，你中了几条？评论区打个数字。', 'Count them. How many hit? Drop a number in the comments.']);
CUES.push([T.reveal + 0.3, T.grid, '现在告诉你一件事：', 'Now, let me tell you something:'], [T.grid + 0.1, T.reveal + 9.9, '这六句话，我对刷到这条视频的每一个人，都说了一遍。', 'I said these six lines to everyone who saw this video.']);
TRICKS.forEach(([, , , cues], i) => { const a = trickT0(i) + 1.5, b = trickT0(i) + 11.2; if (cues.length === 1) CUES.push([a, b, ...cues[0]]); else { const m = (a + b) / 2; CUES.push([a, m, ...cues[0]], [m, b, ...cues[1]]); } });
CUES.push([T.forer + 0.6, T.people - 0.1, '1948 年，心理学家福勒给 39 个学生发了「专属性格分析」。', 'In 1948, psychologist Bertram Forer gave 39 students a “personal” profile.']);
CUES.push([T.people + 0.2, 145, '准不准？0 到 5 分，平均打了 4.30。', 'How accurate? On a 0–5 scale, they averaged 4.30.'], [145, T.end - 0.2, '其实他们拿到的，是同一段话，是从星座书里抄的。', 'They had all received the same text, copied from a horoscope book.']);
CUES.push([T.end + 0.5, 155.8, '所以，我没有算准你。', 'So no, I didn’t read you.'], [155.8, 159.2, '是你在读每一句的时候，都想起了你自己。', 'In every line, you thought of yourself.'], [159.2, T.disc, '准的不是答案，是你在找答案。', 'It wasn’t the answer that was right. It was you, looking for one.']);

export function FONTS() {
  const zh = CUES.map(c => c[2]).join('') + CARDS.map(c => c[0]).join('') + TRICKS.map(t => t[0] + t[2]).join('') +
    '现在给你算一卦第张牌互动揭穿拆穿句福勒实验结尾声明本片是心理学现象演示，不是占卜出品你中了几条？《我现在就给你算一卦》中了吗图为示意平均准确度评分满分同一段话星座书六句话已对多少人说过同样的拆穿0123456789.·「」：';
  const en = CUES.map(c => c[3]).join(' ') + CARDS.map(c => c[1]).join(' ') + TRICKS.map(t => t[1]).join(' ') +
    'VIBE CARD YOUR TURN THE REVEAL TRICK THE MIRROR JOURNAL OF ABNORMAL AND SOCIAL PSYCHOLOGY The Fallacy of Personal Validation A Classroom Demonstration of Gullibility BERTRAM R. FORER Illustration Did that hit? How many did I get right? Disclaimer No. 0123456789 ' + HANDLE;
  return [[`700 40px ${SANS}`, zh + en], [`900 40px ${SANS}`, zh], [`900 40px ${SERIF}`, zh], [`700 40px ${SERIF}`, zh],
    [`italic 400 30px ${GARA}`, en], [`italic 500 30px ${GARA}`, en], [`400 30px ${GARA}`, en], [`600 30px ${GARA}`, en]];
}

// ---------------------------------------------------------------------------------------- setup
export function load(g, w, h) {
  G = g; W = w; H = h; OFF = document.createElement('canvas'); OFF.width = w; OFF.height = h; OG = OFF.getContext('2d');
  PAPER = mk(512, 512, (p) => {                 // aged off-white paper: fibre noise + faint stains
    p.fillStyle = C.paper; p.fillRect(0, 0, 512, 512); const R = mulberry(4);
    for (let i = 0; i < 9000; i++) { const v = R(); p.fillStyle = `rgba(${v < .5 ? '120,95,60' : '255,250,240'},${.035 + R() * .05})`; p.fillRect(R() * 512, R() * 512, 1 + R() * 2, 1 + R() * 2); }
    for (let i = 0; i < 7; i++) { const x = R() * 512, y = R() * 512, r = 40 + R() * 120, gr = p.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(150,115,60,.07)'); gr.addColorStop(1, 'rgba(150,115,60,0)'); p.fillStyle = gr; p.fillRect(0, 0, 512, 512); }
  });
  BACKTEX = mk(512, 512, (p) => { p.fillStyle = '#16163a'; p.fillRect(0, 0, 512, 512); const R = mulberry(9);
    for (let i = 0; i < 2500; i++) { p.fillStyle = `rgba(255,255,255,${R() * .05})`; p.fillRect(R() * 512, R() * 512, 1.5, 1.5); } });
}
function mk(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; }

// ---------------------------------------------------------------------------------------- primitives
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glow(g, x, y, r, rgb, a) { if (a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function wrap(g, text, maxW) {               // CJK-aware wrapping (break anywhere, keep punctuation off line starts)
  const out = []; let line = '';
  for (const ch of text) { const t = line + ch; if (g.measureText(t).width > maxW && line && !'，。？！、：；」'.includes(ch)) { out.push(line); line = ch; } else line = t; }
  if (line) out.push(line); return out;
}
function textRuns(g, s, x, y, base, hi) {   // draw with 「…」 spans in the accent colour, centred at x
  const parts = []; let cur = '', inq = false;
  for (const ch of s) { if (ch === '「') { if (cur) parts.push([cur, inq]); cur = ch; inq = true; } else if (ch === '」') { cur += ch; parts.push([cur, true]); cur = ''; inq = false; } else cur += ch; }
  if (cur) parts.push([cur, inq]);
  const total = parts.reduce((s, [p]) => s + g.measureText(p).width, 0); let px = x - total / 2;
  g.textAlign = 'left'; for (const [p, q] of parts) { g.fillStyle = q ? hi : base; g.fillText(p, px, y); px += g.measureText(p).width; } g.textAlign = 'center';
}
function moon(g, x, y, r, col, lw) {          // thin-line crescent moon with two stars
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, Math.PI * .25, Math.PI * 1.75, false);
  g.arc(x + r * .42, y - r * .05, r * .82, Math.PI * 1.62, Math.PI * .38, true); g.closePath(); g.stroke();
  for (const [dx, dy, s] of [[r * 1.3, -r * .9, r * .22], [r * 1.0, r * .95, r * .14]]) star4(g, x + dx, y + dy, s, col, lw);
  g.restore();
}
function star4(g, x, y, s, col, lw) { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.stroke(); g.restore(); }

// a tarot card centred at (x, y), w × h, rotation rot, flip u: 0 = back up, 1 = face up (rotation about its vertical axis)
// face: { kind: 'text', i, zh } | { kind: 'rule', i } | { kind: 'mirror', t }   detail: 0..1 (tiny cards skip text)
function card(g, x, y, w, h, rot, u, face, detail = 1, shade = 1) {
  const c = Math.cos(Math.PI * clamp(u)), sx = Math.abs(c), showFace = c < 0;
  if (sx < .02) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sx, 1);
  // shadow
  if (detail > .3) { g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 24 * detail; g.shadowOffsetY = 10 * detail; rr(g, -w / 2, -h / 2, w, h, w * .06); g.fillStyle = '#000'; g.fill(); g.restore(); }
  rr(g, -w / 2, -h / 2, w, h, w * .06); g.save(); g.clip();
  if (!showFace) {
    g.drawImage(BACKTEX, -w / 2, -h / 2, w, h);
    if (detail > .15) { g.strokeStyle = C.gold; g.globalAlpha = .9; g.lineWidth = Math.max(1, w * .008); rr(g, -w / 2 + w * .06, -h / 2 + w * .06, w - w * .12, h - w * .12, w * .03); g.stroke();
      moon(g, 0, 0, w * .16, C.gold, Math.max(1, w * .008)); }
  } else {
    g.drawImage(PAPER, -w / 2, -h / 2, w, h);
    if (detail > .15) { g.strokeStyle = C.gold; g.lineWidth = Math.max(1, w * .007); rr(g, -w / 2 + w * .05, -h / 2 + w * .05, w - w * .1, h - w * .1, w * .025); g.stroke();
      g.globalAlpha = .7; rr(g, -w / 2 + w * .075, -h / 2 + w * .075, w - w * .15, h - w * .15, w * .02); g.stroke(); g.globalAlpha = 1; }
    if (face && detail > .5) drawFace(g, w, h, face);
    else if (face && detail > .15) { g.fillStyle = 'rgba(59,47,37,.35)'; for (let k = 0; k < 3; k++) g.fillRect(-w * .3, -h * .1 + k * h * .09, w * .6 * (k === 2 ? .6 : 1), h * .035); }
  }
  g.restore();
  if (shade < 1) { rr(g, -w / 2, -h / 2, w, h, w * .06); g.fillStyle = `rgba(5,5,16,${1 - shade})`; g.fill(); }
  g.restore();
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
function drawFace(g, w, h, f) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (f.kind === 'text') {
    g.fillStyle = C.gold; g.font = `600 ${w * .07}px ${GARA}`; g.fillText(ROMAN[f.i], 0, -h * .38);
    moon(g, 0, -h * .27, w * .05, C.gold, Math.max(1, w * .006));
    g.fillStyle = C.ink; g.font = `900 ${w * .085}px ${SERIF}`; const lines = wrap(g, f.zh, w * .74);
    lines.forEach((l, k) => g.fillText(l, 0, (k - (lines.length - 1) / 2) * w * .125 + h * .04));
    g.strokeStyle = C.gold; g.lineWidth = Math.max(1, w * .004); g.beginPath(); g.moveTo(-w * .15, h * .36); g.lineTo(w * .15, h * .36); g.stroke();
  } else if (f.kind === 'rule') {
    const [name, en] = TRICKS[f.i];
    g.fillStyle = C.gold; g.font = `600 ${w * .06}px ${GARA}`; g.fillText(`No. ${f.i + 1}`, 0, -h * .38);
    icon(g, f.i, 0, -h * .14, w * .2, C.gold, Math.max(1.5, w * .009));
    g.fillStyle = C.ink; g.font = `900 ${w * (name.length > 5 ? .1 : .115)}px ${SERIF}`; g.fillText(name, 0, h * .11);
    g.fillStyle = '#7a6a55'; g.font = `italic 500 ${w * .062}px ${GARA}`; g.fillText(en, 0, h * .21);
    g.strokeStyle = C.gold; g.lineWidth = Math.max(1, w * .004); g.beginPath(); g.moveTo(-w * .15, h * .3); g.lineTo(w * .15, h * .3); g.stroke();
    if (f.stamp > 0) seal(g, w * .24, h * .33, w * .2, '拆穿', f.stamp, -.18);
  } else if (f.kind === 'note') {
    g.fillStyle = C.ink; g.font = `900 ${w * .062}px ${SERIF}`; const lines = f.zh.includes('，') ? f.zh.split(/(?<=，)/) : wrap(g, f.zh, w * .8);
    lines.forEach((l, k) => g.fillText(l, 0, (k - (lines.length - 1) / 2) * w * .09 - h * .05));
    g.fillStyle = '#7a6a55'; g.font = `italic 500 ${w * .036}px ${GARA}`; g.fillText(f.en, 0, h * .24);
  }
}
function seal(g, x, y, s, text, a, rot) {     // red square seal, stamped (a: 0..1)
  if (a <= 0) return; const k = lerp(1.6, 1, eo(clamp(a * 1.4)));
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); g.globalAlpha = clamp(a * 2) * .92;
  g.fillStyle = C.red; rr(g, -s / 2, -s / 2, s, s, s * .08); g.fill();
  g.strokeStyle = '#f3e3d0'; g.lineWidth = s * .04; rr(g, -s * .4, -s * .4, s * .8, s * .8, s * .05); g.stroke();
  g.fillStyle = '#f6e7d6'; g.font = `900 ${s * (text.length > 2 ? .26 : .34)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (text.length > 2) { g.fillText(text.slice(0, 2), 0, -s * .14); g.fillText(text.slice(2), 0, s * .16); } else g.fillText(text, 0, 0);
  g.restore();
}
function icon(g, i, x, y, s, col, lw) {        // gold line icons for the six tricks
  g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  if (i === 0) { // a mask (one face fits all)
    g.moveTo(-s, -s * .35); g.quadraticCurveTo(0, -s * .7, s, -s * .35); g.quadraticCurveTo(s * .9, s * .6, 0, s * .8); g.quadraticCurveTo(-s * .9, s * .6, -s, -s * .35); g.stroke();
    g.beginPath(); g.ellipse(-s * .38, -s * .05, s * .18, s * .1, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(s * .38, -s * .05, s * .18, s * .1, 0, 0, 7); g.stroke();
    g.beginPath(); g.arc(0, s * .25, s * .25, .2 * Math.PI, .8 * Math.PI);
  } else if (i === 1) { // a balance
    g.moveTo(0, -s * .8); g.lineTo(0, s * .7); g.moveTo(-s * .5, s * .7); g.lineTo(s * .5, s * .7); g.moveTo(-s * .9, -s * .5); g.lineTo(s * .9, -s * .5);
    g.moveTo(-s * .9, -s * .5); g.lineTo(-s * 1.15, s * .1); g.lineTo(-s * .65, s * .1); g.closePath(); g.moveTo(s * .9, -s * .5); g.lineTo(s * .65, s * .1); g.lineTo(s * 1.15, s * .1); g.closePath();
  } else if (i === 2) { // an empty frame with a pencil
    g.rect(-s * .9, -s * .65, s * 1.5, s * 1.2); g.moveTo(s * .2, s * .55); g.lineTo(s * .95, -s * .2); g.lineTo(s * 1.1, -s * .05); g.lineTo(s * .35, s * .7); g.closePath();
  } else if (i === 3) { // a die
    g.rect(-s * .7, -s * .7, s * 1.4, s * 1.4); g.stroke(); g.beginPath(); for (const [a, b] of [[-.35, -.35], [.35, .35], [0, 0], [.35, -.35], [-.35, .35]]) { g.moveTo(a * s + s * .09, b * s); g.arc(a * s, b * s, s * .09, 0, 7); }
  } else if (i === 4) { // a photo
    g.rect(-s * .95, -s * .7, s * 1.9, s * 1.4); g.moveTo(-s * .8, s * .5); g.lineTo(-s * .25, -s * .1); g.lineTo(s * .15, s * .3); g.lineTo(s * .45, 0); g.lineTo(s * .8, s * .5); g.moveTo(s * .55 + s * .15, -s * .35); g.arc(s * .55, -s * .35, s * .15, 0, 7);
  } else { // an arrow that comes back to itself
    g.arc(0, 0, s * .75, -.3 * Math.PI, 1.45 * Math.PI); g.moveTo(s * .44, -s * .6); g.lineTo(s * .62, -s * .25); g.lineTo(s * .22, -s * .22);
  }
  g.stroke(); g.restore();
}

// ---------------------------------------------------------------------------------------- the stage layers
function background(g, t) {
  const gr = g.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, W * .7); gr.addColorStop(0, C.bg1); gr.addColorStop(1, C.bg0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'screen';                       // faint light rays from the top
  for (let i = 0; i < 4; i++) { const x = W * (.2 + .2 * i) + Math.sin(t * .13 + i) * 60, a = .025 + .015 * Math.sin(t * .4 + i * 2);
    const lg = g.createLinearGradient(x, 0, x + 260, H); lg.addColorStop(0, `rgba(170,170,230,${a})`); lg.addColorStop(1, 'rgba(170,170,230,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 60, 0); g.lineTo(x + 420, H); g.lineTo(x + 180, H); g.closePath(); g.fill(); }
  g.restore();
  const R = mulberry(17); g.save();                                         // star dust: slow drift, slow twinkle
  for (let i = 0; i < 140; i++) { const z = R(), x = (R() * W + t * (3 + z * 8)) % W, y = (R() * H - t * (2 + z * 5) + H * 10) % H, tw = .35 + .65 * Math.max(0, Math.sin(t * (.6 + R() * 1.2) + i));
    g.fillStyle = `rgba(230,225,255,${(.08 + .32 * z) * tw})`; g.beginPath(); g.arc(x, y, .6 + z * 1.6, 0, 7); g.fill(); }
  g.restore();
}
function vignette(g) { const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
function chrome(g, t) {
  g.save(); g.textBaseline = 'middle';
  g.globalAlpha = .45; g.fillStyle = C.white; g.font = `700 24px ${SANS}`; g.textAlign = 'left'; g.fillText(HANDLE, 56, 58); g.globalAlpha = 1;
  const L = label(t); if (L) { const [txt, a] = L; g.globalAlpha = a; g.textAlign = 'center'; g.font = `700 25px ${SANS}`; g.fillStyle = C.grey;
    const w = g.measureText(txt).width; g.fillText(txt, W / 2, 58); g.strokeStyle = 'rgba(201,169,106,.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(W / 2 - w / 2 - 70, 58); g.lineTo(W / 2 - w / 2 - 18, 58); g.moveTo(W / 2 + w / 2 + 18, 58); g.lineTo(W / 2 + w / 2 + 70, 58); g.stroke(); }
  g.restore();
}
function label(t) {
  const L = [[0, T.title, '现在 · 给你算一卦'], ...CARDS.map((_, i) => [cardT0(i), cardT0(i) + T.cardDur, `第 ${i + 1} 张牌 · CARD ${ROMAN[i]}`]), [T.ask, T.reveal, '互动 · YOUR TURN'], [T.reveal, T.tricks, '揭穿 · THE REVEAL'],
    ...TRICKS.map((_, i) => [trickT0(i), trickT0(i) + T.trickDur, `拆穿第 ${i + 1} 句 · TRICK ${ROMAN[i]}`]), [T.forer, T.end, '1948 · 福勒实验'], [T.end, T.disc, '结尾 · THE MIRROR']];
  for (const [a, b, s] of L) if (t >= a && t < b) return [s, Math.min(ss(seg(t, a, a + .4)), 1 - ss(seg(t, b - .3, b)))];
  return null;
}
function annotation(g, t, text, a0, a1, en) {
  const a = Math.min(ss(seg(t, a0, a0 + .4)), 1 - ss(seg(t, a1 - .3, a1))); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 26px ${SANS}`; g.fillStyle = C.grey;
  textRuns(g, text + (en ? '' : ''), W / 2, 790 + (1 - a) * 6, C.grey, C.gold);
  if (en) { g.font = `italic 400 22px ${GARA}`; g.fillStyle = 'rgba(138,138,160,.85)'; g.fillText(en, W / 2, 822); }
  g.restore();
}
function captions(g, t) {
  for (const [a, b, zh, en] of CUES) {
    if (t < a - .05 || t > b + .05) continue; const k = Math.min(ss(seg(t, a, a + .35)), 1 - ss(seg(t, b - .3, b)));
    if (k <= 0) continue; const dy = (1 - k) * 8;
    g.save(); g.globalAlpha = k; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 12; g.font = `700 46px ${SANS}`; textRuns(g, zh, W / 2, 935 + dy, C.white, C.gold);
    g.shadowBlur = 6; g.font = `italic 400 27px ${GARA}`; g.fillStyle = C.grey; g.fillText(en, W / 2, 985 + dy); g.restore();
  }
}

// ---------------------------------------------------------------------------------------- clothesline
const ROPE_Y = 150, SLOT = i => 960 + (i - 2.5) * 236, MINI = [118, 172];
function ropeY(x) { const u = x / W; return ROPE_Y + Math.sin(Math.PI * u) * 26; }
function rope(g, t, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.strokeStyle = '#9c2f28'; g.lineWidth = 3.2; g.beginPath();
  for (let x = -20; x <= W + 20; x += 20) { const y = ropeY(x) + Math.sin(t * 1.3 + x * .004) * 2; x === -20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.strokeStyle = 'rgba(255,180,160,.25)'; g.lineWidth = 1; g.stroke(); g.restore();
}
function clip(g, x, y) { g.save(); g.fillStyle = '#a77b4f'; rr(g, x - 9, y - 18, 18, 36, 3); g.fill(); g.strokeStyle = '#5e4128'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x, y + 16); g.stroke(); g.restore(); }
function hanging(g, t, i, face, flipU = 1, alpha = 1, stamp = 0) {   // a card hanging from its peg on the rope
  const x = SLOT(i), y0 = ropeY(x), sway = Math.sin(t * 1.1 + i * 1.7) * .035;
  g.save(); g.globalAlpha = alpha; g.translate(x, y0); g.rotate(sway);
  card(g, 0, MINI[1] / 2 + 6, MINI[0], MINI[1], 0, flipU, face, .45);
  if (stamp > 0) { g.save(); seal(g, MINI[0] * .22, MINI[1] * .8, 34, '拆穿', stamp, -.2); g.restore(); }
  clip(g, 0, 4); g.restore();
}

// ---------------------------------------------------------------------------------------- scenes
function scene1(g, t) {           // the deck rises and fans out; countdown
  const n = 22, rise = eo(seg(t, 0, 1.2)), fan = eio(seg(t, 1.2, 2.4)), out = eio(seg(t, T.title - .1, T.title + .6));
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1) - .5, ang = u * 1.5 * fan, r = 620, cx = 960, cy = 560 + 640 * (1 - rise) + r * (1 - Math.cos(ang)) * .1;
    const x = cx + Math.sin(ang) * r * .62, y = cy + (1 - Math.cos(ang)) * r * .35 + Math.sin(t * 2 + k) * 3 * fan;
    const shuffle = Math.sin(t * 6 + k * 1.3) * 10 * seg(t, 2.4, 3.2) * (1 - seg(t, 3.2, 3.6));
    const sc = 1 - .85 * out;
    card(g, lerp(x + shuffle, 960, out), lerp(y, 520, out), 150 * sc, 230 * sc, ang * .55 * (1 - out), 0, null, .8);
  }
  if (t > 3.4 && t < T.title) {   // 3, 2, 1
    const k = Math.min(2, Math.floor((t - 3.55) / .5)), u = seg(t, 3.55 + k * .5, 4.05 + k * .5);
    if (t >= 3.55) { g.save(); g.globalAlpha = Math.sin(Math.PI * u); g.fillStyle = C.gold; g.font = `900 ${110 + 30 * u}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(3 - k), 960, 790); g.restore(); }
  }
}
function titleCard(g, t) {
  const a = Math.min(ss(seg(t, T.title + .3, T.title + 1.1)), 1 - ss(seg(t, T.cards - .5, T.cards))); if (a <= 0) return;
  glow(g, 960, 480, 520, '201,169,106', .08 * a);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  const up = (k) => (1 - ss(seg(t, T.title + .3 + k * .25, T.title + 1.2 + k * .25))) * 14;
  g.globalAlpha = a * ss(seg(t, T.title + .3, T.title + 1)); g.fillStyle = C.gold; g.font = `700 30px ${SANS}`; spaced(g, 'VIBE知识大赏', 960, 360 + up(0), 14);
  g.globalAlpha = a * ss(seg(t, T.title + .55, T.title + 1.3)); g.font = `900 92px ${SERIF}`; g.fillStyle = C.gold; g.fillText('《我现在就给你算一卦》', 960, 470 + up(1));
  g.globalAlpha = a * ss(seg(t, T.title + .9, T.title + 1.6)); g.font = `700 44px ${SANS}`; g.fillStyle = C.white; g.fillText('你中了几条？', 960, 575 + up(2));
  g.globalAlpha = a * ss(seg(t, T.title + 1.1, T.title + 1.8)); g.font = `italic 400 32px ${GARA}`; g.fillStyle = C.grey; g.fillText('How many did I get right?', 960, 628 + up(3));
  g.globalAlpha = a * .8; moon(g, 960, 250 + up(0), 26, C.gold, 2);
  g.restore();
}
function spaced(g, s, x, y, sp) { const chars = [...s], ws = chars.map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1); let px = x - tot / 2; g.textAlign = 'left'; chars.forEach((c, i) => { g.fillText(c, px, y); px += ws[i] + sp; }); g.textAlign = 'center'; }

function cardsScene(g, t) {       // six readings: draw, flip, hold, peg onto the rope
  rope(g, t, ss(seg(t, T.cards - .2, T.cards + .6)));
  for (let i = 0; i < 6; i++) {
    const t0 = cardT0(i), face = { kind: 'text', i, zh: CARDS[i][0] };
    if (t >= t0 + 5.75) { hanging(g, t, i, face); continue; }
    if (t < t0) continue;
    const enter = eo(seg(t, t0, t0 + .55)), flip = eio(seg(t, t0 + .55, t0 + 1.1)), fly = eio(seg(t, t0 + 5.0, t0 + 5.75));
    const float = Math.sin((t - t0) * 1.6) * 6;
    const bx = 960, by = 515 + 420 * (1 - enter) + float, bw = 290, bh = 420;
    const tx = SLOT(i), ty = ropeY(tx) + MINI[1] / 2 + 6;
    const x = lerp(bx, tx, fly), y = lerp(by, ty, fly) - Math.sin(Math.PI * fly) * 60, w = lerp(bw, MINI[0], fly), h = lerp(bh, MINI[1], fly);
    const rot = (1 - enter) * .12 + Math.sin(Math.PI * fly) * .18 + Math.sin((t - t0) * 1.3) * .012;
    if (enter < 1) glow(g, 960, 515, 300, '201,169,106', .1 * enter);
    glow(g, x, y, 340 * (1 - fly), '255,230,190', .1 * Math.sin(Math.PI * flip) + .05 * (1 - fly));
    card(g, x, y, w, h, rot, flip, face, lerp(1, .45, fly));
    if (fly > .9) clip(g, tx, ropeY(tx) + 4);
  }
  for (let i = 0; i < 6; i++) annotation(g, t, '中了吗？', cardT0(i) + 2, cardT0(i) + 5.0, 'Did that hit?');
}
function askScene(g, t) {         // six on the line, a big pulsing question mark
  rope(g, t, 1); for (let i = 0; i < 6; i++) hanging(g, t, i, { kind: 'text', i, zh: CARDS[i][0] });
  const a = Math.min(ss(seg(t, T.ask, T.ask + .6)), 1 - ss(seg(t, T.reveal - .3, T.reveal))), beat = Math.pow(Math.max(0, Math.cos(Math.PI * ((t - T.ask) / BEAT % 1))), 8);
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; glow(g, 960, 560, 260, '201,169,106', .12 + .1 * beat);
  g.fillStyle = C.gold; g.font = `900 ${230 + 18 * beat}px ${SERIF}`; g.fillText('？', 960, 560); g.restore();
}
// the reveal: thousands of copies in a grid, lighting row by row; then (later) they gather back
const GC = 46, GR = 14, GW = 28, GH = 39, GX0 = (1920 - GC * 40) / 2 + 20, GY0 = 128;
function gridPos(c, r) { return [GX0 + c * 40, GY0 + r * 44 + (c % 2) * 5]; }
function revealScene(g, t) {
  const burst = seg(t, T.grid - .1, T.grid + 1.4);
  rope(g, t, 1 - seg(t, T.grid, T.grid + .5));
  if (t < T.grid + .3) for (let i = 0; i < 6; i++) { const shake = t > T.grid - 2.6 ? Math.sin(t * 25 + i) * 2.5 * seg(t, T.grid - 2.6, T.grid) : 0;
    g.save(); g.translate(shake, 0); hanging(g, t, i, { kind: 'text', i, zh: CARDS[i][0] }, 1, 1 - seg(t, T.grid, T.grid + .3)); g.restore(); }
  if (t >= T.grid - .1) {
    if (burst < .25) glow(g, 960, 300, 900, '255,236,200', .5 * (1 - burst / .25));
    const R = mulberry(31);
    for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) {
      const src = Math.floor(R() * 6), sx = SLOT(src), sy = ropeY(sx) + 92, [gx, gy] = gridPos(c, r), d = R() * .35;
      const u = eo(clamp((burst - d) / .65)); if (u <= 0) continue;
      const lit = t > T.grid + 1.2 + r * .22 ? 1 : 0, flash = Math.max(0, 1 - (t - (T.grid + 1.2 + r * .22)) / .6) * lit;
      const x = lerp(sx, gx, u), y = lerp(sy, gy, u);
      card(g, x, y, lerp(MINI[0], GW, u), lerp(MINI[1], GH, u), (1 - u) * (R() - .5), 1, { kind: 'text', i: src, zh: '' }, .2, .38 + .62 * lit);
      if (flash > 0) glow(g, x, y, 40, '255,220,160', .5 * flash);
    }
    // counter, top right
    const ca = Math.min(ss(seg(t, T.grid + .8, T.grid + 1.4)), 1 - ss(seg(t, T.tricks - 1.4, T.tricks - .7))); if (ca > 0) {
      const n = Math.floor(Math.pow(clamp((t - T.grid - .8) / 6.5), 1.6) * 1284903 + (t > T.grid + .8 ? 1 : 0));
      g.save(); g.globalAlpha = ca; g.fillStyle = 'rgba(5,5,16,.75)'; rr(g, 1440, 96, 420, 120, 12); g.fill(); g.strokeStyle = 'rgba(201,169,106,.6)'; g.lineWidth = 1.5; g.stroke();
      g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = C.grey; g.font = `700 22px ${SANS}`; g.fillText('同样的六句话 · 已发出', 1830, 128);
      g.fillStyle = C.gold; g.font = `900 52px ${SERIF}`; g.fillText(n.toLocaleString('en-US'), 1830, 180); g.restore();
    }
  }
  annotation(g, t, '图为示意：每个刷到的人，看到的都是这六句', T.grid + 1.6, T.tricks - .3, 'Illustration');
}
function gridToLine(g, t) {       // the grid flows back onto the rope as the six cards
  const u = eio(seg(t, T.tricks - .6, T.tricks + .5)), R = mulberry(31);
  rope(g, t, ss(seg(t, T.tricks - .3, T.tricks + .4)));
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { const src = Math.floor(R() * 6), d = R() * .35; R(); if (u >= 1) continue;
    const sx = SLOT(src), sy = ropeY(sx) + 92, [gx, gy] = gridPos(c, r), k = eo(clamp((u - d * .5) / .7));
    g.save(); g.globalAlpha = 1 - k; card(g, lerp(gx, sx, k), lerp(gy, sy, k), lerp(GW, MINI[0], k), lerp(GH, MINI[1], k), 0, 1, { kind: 'text', i: src, zh: '' }, .2, 1); g.restore(); }
}
function tricksScene(g, t) {      // each card comes back from the line and turns over: the trick behind it
  rope(g, t, 1);
  for (let i = 0; i < 6; i++) {
    const t0 = trickT0(i), textFace = { kind: 'text', i, zh: CARDS[i][0] };
    const stamp = seg(t, t0 + 9.2, t0 + 9.8), rule = { kind: 'rule', i, stamp };
    if (t < t0) { hanging(g, t, i, textFace); continue; }
    if (t >= t0 + T.trickDur) { hanging(g, t, i, { kind: 'rule', i, stamp: 0 }, 1, 1, 1); continue; }
    const out = eio(seg(t, t0, t0 + .8)), flip = eio(seg(t, t0 + .8, t0 + 1.5)), back_ = eio(seg(t, t0 + 10.6, t0 + 11.6));
    const sx = SLOT(i), sy = ropeY(sx) + MINI[1] / 2 + 6, float = Math.sin((t - t0) * 1.5) * 6;
    const k = out * (1 - back_), x = lerp(sx, 960, k), y = lerp(sy, 505 + float, k) - Math.sin(Math.PI * out) * 30 * (1 - back_), w = lerp(MINI[0], 296, k), h = lerp(MINI[1], 430, k);
    // turning: text face → (edge) → rules card; on the way back it stays a rules card
    const u = flip < .5 ? flip : flip;   // 0..1
    const faceNow = flip < .5 ? textFace : rule;
    const uu = flip < .5 ? 1 - flip : flip;     // keep the face visible on both halves (u>.5 shows face side)
    glow(g, x, y, 360 * k, '201,169,106', .1 * k);
    card(g, x, y, w, h, Math.sin((t - t0) * 1.2) * .012 * k, uu, faceNow, lerp(.45, 1, k));
    if (back_ > .9) clip(g, sx, ropeY(sx) + 4);
    annotation(g, t, `第 ${i + 1} 句 ·「${TRICKS[i][2]}」`, t0 + 1.2, t0 + 10.8, null);
  }
}
function forerScene(g, t) {       // the paper (illustrative reconstruction), then 39 students with the same sheet
  const t0 = T.forer, ap = Math.min(eo(seg(t, t0, t0 + .9)), 1), shrink = eio(seg(t, T.people - .5, T.people + .6));
  // rope and cards leave upwards
  if (t < t0 + 1) { g.save(); g.globalAlpha = 1 - ss(seg(t, t0 + .3, t0 + 1)); g.translate(0, -380 * eio(seg(t, t0, t0 + 1))); rope(g, t, 1); for (let i = 0; i < 6; i++) hanging(g, t, i, { kind: 'rule', i, stamp: 0 }, 1, 1, 1); g.restore(); }
  const px = lerp(960, 330, shrink), py = lerp(520 + 300 * (1 - ap), 470, shrink), sc = lerp(1, .52, shrink), rot = lerp(-.035, -.07, shrink) + (1 - ap) * .1;
  g.save(); g.globalAlpha = ss(seg(t, t0, t0 + .6)); g.translate(px, py); g.rotate(rot); g.scale(sc, sc); paper(g, t); g.restore();
  if (t < T.people + .2) annotation(g, t, '图为示意：论文首页复原', t0 + 1.2, T.people - .1, 'Illustration, not the original page');
  if (t < T.people - .5) return;
  // 39 students
  const R = mulberry(5), same = ss(seg(t, 145.2, 146.4));
  for (let k = 0; k < 39; k++) {
    const c = k % 13, r = Math.floor(k / 13), x = 760 + c * 82, y = 330 + r * 150, a = eo(seg(t, T.people + k * .03, T.people + .5 + k * .03)); if (a <= 0) continue;
    const bob = Math.sin(t * 2 + k) * 2;
    g.save(); g.globalAlpha = a; g.translate(x, y + bob + (1 - a) * 20);
    g.fillStyle = '#c9c4d8'; g.beginPath(); g.arc(0, -34, 13, 0, 7); g.fill(); rr(g, -17, -18, 34, 44, 12); g.fill();
    // the sheet they hold
    const hl = same; g.save(); g.translate(0, 8); g.rotate(-.12 + R() * .24); g.fillStyle = C.paper; g.fillRect(-15, -10, 30, 38);
    g.fillStyle = hl > 0 ? `rgba(181,58,47,${.25 + .5 * hl})` : 'rgba(80,60,40,.35)'; for (let l = 0; l < 4; l++) g.fillRect(-11, -5 + l * 7, l === 3 ? 13 : 22, 2.4);
    g.restore(); if (hl > 0) glow(g, 0, 18, 46, '255,120,100', .25 * hl * (.6 + .4 * Math.sin(t * 4 + k)));
    g.restore();
  }
  // the score counting up
  const ca = ss(seg(t, T.people + .6, T.people + 1.2)); if (ca > 0) {
    const v = 4.30 * eo(seg(t, T.people + .8, T.people + 4.6));
    g.save(); g.globalAlpha = ca; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.grey; g.font = `700 24px ${SANS}`; g.fillText('平均准确度评分 · 满分 5', 1290, 765 - 520);
    g.fillStyle = C.gold; g.font = `900 92px ${SERIF}`; g.fillText(v.toFixed(2), 1290, 190); if (v > 4.29) glow(g, 1290, 190, 160, '255,220,160', .25 * Math.max(0, 1 - (t - T.people - 4.6) / 1));
    g.restore();
  }
  if (same > 0) annotation(g, t, '39 份「专属」分析，是「同一段话」', 145.4, T.end - .2, 'All 39 “personal” profiles were the same text');
}
function paper(g, t) {            // aged journal first page (illustrative), centred at 0,0
  const w = 600, h = 640;
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fillStyle = '#000'; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  g.drawImage(PAPER, -w / 2, -h / 2, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#5a4a3a'; g.font = `600 15px ${GARA}`; spaced(g, '1949 · JOURNAL OF ABNORMAL AND SOCIAL PSYCHOLOGY', 0, -h / 2 + 44, 2.5);
  g.strokeStyle = 'rgba(90,74,58,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w / 2 + 40, -h / 2 + 64); g.lineTo(w / 2 - 40, -h / 2 + 64); g.stroke();
  g.fillStyle = '#2e241b'; g.font = `600 34px ${GARA}`; g.fillText('The Fallacy of Personal Validation', 0, -h / 2 + 118);
  g.fillStyle = '#4b3c2e'; g.font = `italic 400 22px ${GARA}`; g.fillText('A Classroom Demonstration of Gullibility', 0, -h / 2 + 156);
  g.fillStyle = '#5a4a3a'; g.font = `600 17px ${GARA}`; spaced(g, 'BERTRAM R. FORER', 0, -h / 2 + 196, 3);
  const R = mulberry(77); g.fillStyle = 'rgba(70,55,40,.32)';
  for (let col = 0; col < 2; col++) for (let l = 0; l < 22; l++) { const x0 = col ? 14 : -w / 2 + 44, lw = (w / 2 - 58) * (l % 7 === 6 ? .55 : .9 + R() * .1); g.fillRect(x0, -h / 2 + 236 + l * 16, lw, 5); }
  seal(g, w / 2 - 80, h / 2 - 76, 92, '福勒实验', seg(t, T.forer + 1.6, T.forer + 2.2), -.12);
}
function endScene(g, t) {         // the cards gather into one; it turns over: a small mirror
  const t0 = T.end, gather = eio(seg(t, t0, t0 + 3.6)), R = mulberry(41);
  // fade the students / paper out
  if (t < t0 + 1) { OG.setTransform(W / 1920, 0, 0, H / 1080, 0, 0); OG.clearRect(0, 0, 1920, 1080); forerScene(OG, Math.min(t, t0 - .01)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - ss(seg(t, t0, t0 + 1)); g.drawImage(OFF, 0, 0); g.restore(); }
  if (gather < 1) for (let k = 0; k < 360; k++) {
    const ang = R() * Math.PI * 2, rad = 500 + R() * 700, sx = 960 + Math.cos(ang) * rad, sy = 540 + Math.sin(ang) * rad * .7, d = R() * .3;
    const u = eio(clamp((gather - d) / .7)), sp = (1 - u) * 1.5;
    const x = lerp(sx, 960, u) + Math.cos(ang + sp) * 60 * (1 - u), y = lerp(sy, 520, u) + Math.sin(ang + sp) * 60 * (1 - u);
    if (u > 0) card(g, x, y, lerp(60, 280, u * u), lerp(88, 410, u * u), (1 - u) * (R() - .5) * 2, 0, null, .3, .6 + .4 * u);
  }
  const flip = eio(seg(t, T.mirror - .9, T.mirror - .1));
  if (gather > .95 && t < T.disc + .4) {
    const a = 1 - ss(seg(t, T.disc - .2, T.disc + .4)), float = Math.sin(t * 1.3) * 6;
    g.save(); g.globalAlpha = a;
    glow(g, 960, 520, 420, '210,215,255', (.08 + .06 * Math.sin(t * 1.7)) * flip);
    if (flip < .5) card(g, 960, 520 + float, 280, 410, 0, flip, null, 1);
    else mirrorCard(g, t, 960, 520 + float, 280 * Math.abs(Math.cos(Math.PI * flip)), 410);
    g.restore();
  }
}
function mirrorCard(g, t, x, y, w, h) {
  if (w < 4) return; g.save(); g.translate(x, y);
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 26; g.shadowOffsetY = 12; rr(g, -w / 2, -h / 2, w, h, w * .06); g.fillStyle = '#000'; g.fill(); g.restore();
  rr(g, -w / 2, -h / 2, w, h, w * .06); g.save(); g.clip(); g.drawImage(PAPER, -w / 2, -h / 2, w, h); g.restore();
  g.strokeStyle = C.gold; g.lineWidth = 2; rr(g, -w / 2 + w * .05, -h / 2 + w * .05, w * .9, h - w * .1, w * .025); g.stroke();
  // the oval mirror
  const mw = w * .36, mh = h * .36;
  g.save(); g.beginPath(); g.ellipse(0, -h * .04, mw, mh, 0, 0, 7); g.clip();
  const mg = g.createLinearGradient(-mw, -mh, mw, mh); mg.addColorStop(0, '#2b3050'); mg.addColorStop(.5, '#8c93b8'); mg.addColorStop(1, '#232743'); g.fillStyle = mg; g.fillRect(-mw, -h * .04 - mh, mw * 2, mh * 2);
  const sweep = ((t * .35) % 1.6) - .3, sx = lerp(-mw * 1.6, mw * 1.6, sweep);       // a slow light sweep
  const lg = g.createLinearGradient(sx - 40, -mh, sx + 40, mh); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(-mw, -h * .04 - mh, mw * 2, mh * 2);
  const R = mulberry(3); for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(255,255,255,${.2 + .5 * Math.max(0, Math.sin(t * 1.5 + k))})`; g.beginPath(); g.arc((R() - .5) * mw * 1.8, -h * .04 + (R() - .5) * mh * 1.8, 1.4, 0, 7); g.fill(); }
  g.restore();
  g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -h * .04, mw, mh, 0, 0, 7); g.stroke();
  g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, -h * .04, mw + 9, mh + 9, 0, 0, 7); g.stroke();
  star4(g, 0, -h * .04 - mh - 26, 9, C.gold, 1.5); star4(g, 0, -h * .04 + mh + 26, 9, C.gold, 1.5);
  g.fillStyle = C.gold; g.font = `600 ${w * .06}px ${GARA}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YOU', 0, h * .4);
  g.restore();
}
function noteCard(g, t, a0, a1, zh, en) {
  const a = Math.min(eo(seg(t, a0, a0 + .6)), 1 - ss(seg(t, a1 - .35, a1))); if (a <= 0) return;
  g.save(); g.globalAlpha = a; card(g, 960, 520 + (1 - a) * 30 + Math.sin(t * 1.3) * 5, 640, 380, -.02 + (1 - a) * .05, 1, { kind: 'note', zh, en }, 1); g.restore();
}
function creditCard(g, t) {
  const a = eo(seg(t, T.credit, T.credit + .7)); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; glow(g, 960, 500, 420, '201,169,106', .08 + .03 * Math.sin(t * 1.6));
  moon(g, 960, 340, 30, C.gold, 2);
  g.fillStyle = C.gold; g.font = `900 70px ${SERIF}`; g.fillText(`${HANDLE} 出品`, 960, 470 + (1 - a) * 12);
  g.fillStyle = C.white; g.font = `700 44px ${SANS}`; g.fillText('你中了几条？', 960, 575);
  g.fillStyle = C.grey; g.font = `italic 400 30px ${GARA}`; g.fillText('How many did I get right?', 960, 625);
  g.restore();
}

// ---------------------------------------------------------------------------------------- frame
export function frame(t) {
  const g = G; g.setTransform(W / 1920, 0, 0, H / 1080, 0, 0); g.globalAlpha = 1; g.textBaseline = 'middle';
  background(g, t);
  if (t < T.title + .7) scene1(g, t);
  if (t >= T.title && t < T.cards + .2) titleCard(g, t);
  if (t >= T.cards && t < T.ask) cardsScene(g, t);
  if (t >= T.ask && t < T.reveal) askScene(g, t);
  if (t >= T.reveal && t < T.tricks - .5) revealScene(g, t);
  if (t >= T.tricks - .6 && t < T.tricks + .6) gridToLine(g, t);
  if (t >= T.tricks + .5 && t < T.forer) tricksScene(g, t);
  else if (t >= T.tricks - .1 && t < T.tricks + .5) { rope(g, t, ss(seg(t, T.tricks - .3, T.tricks + .4))); for (let i = 0; i < 6; i++) hanging(g, t, i, { kind: 'text', i, zh: CARDS[i][0] }, 1, ss(seg(t, T.tricks, T.tricks + .5))); }
  if (t >= T.forer && t < T.end) forerScene(g, t);
  if (t >= T.end && t < T.disc + .5) endScene(g, t);
  noteCard(g, t, T.disc, T.credit, '声明：本片是心理学现象演示，不是占卜。', 'Disclaimer: a psychology demonstration, not fortune-telling.');
  creditCard(g, t);
  vignette(g);
  chrome(g, t);
  captions(g, t);
}
