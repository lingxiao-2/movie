import { drawSheet } from './sheet.js';
import { setSize, setCam, proj, drawRoom, drawBookBase, drawBackdrop, drawGround, drawCards, drawLeaf, finishFrame, drawSurface, poly, PW, PH, PD } from './engine.js';
import { SEQ, TURNS, OPEN, CLOSE, FADE, LYRICS, spreadAt, grade, PHOTOS } from './scenes.js';
import { P } from './art.js';
import { seg, eio, back, clamp } from '/core/lib.js';
import { INK } from './paper.js';

const cv = document.getElementById('c'), W = innerWidth, H = innerHeight; cv.width = W; cv.height = H;
const g = cv.getContext('2d');
setSize(W, H);
const Q = new URLSearchParams(location.search);
window.DUR = 59.04;

const camOf = (sp, t) => { const [tx, ty, tz, d, pitch, yaw, f] = sp.cam(t); return { tx, ty, tz, d, pitch, yaw, f }; };
const nextTurnStart = sp => { for (const tr of TURNS) if (tr[2] === sp) return tr[0]; return sp === SEQ[SEQ.length - 1][1] ? CLOSE[0] : 1e9; };
function foldOut(cards, t, tEnd) {
  if (t < tEnd - .4) return cards;
  const k = 1 - eio(seg(t, tEnd - .4, tEnd - .05));
  return cards.map(c => c && ({ ...c, a: (c.a ?? 90) * k, alpha: (c.alpha ?? 1) * clamp(k * 3) }));
}

function drawSpreadContent(sp, t, { standing = true, backArt = null, groundArt = null, cards = null } = {}) {
  drawBookBase(g, standing);
  if (standing) {
    const sl = sp.slide?.(t);
    if (sl) { // backdrop pull-tab: the new picture slides in from the right
      drawBackdrop(g, sl.from);
      g.save(); poly(g, [proj(-PW, 0, PD), proj(PW, 0, PD), proj(PW, PH, PD), proj(-PW, PH, PD)]); g.clip();
      const off = (1 - sl.k) * 2 * PW;
      drawSurface(g, sl.to, (u, v) => [-PW + u * 2 * PW + off, PH - v * PH, PD], 10);
      const e = proj(-PW + off, PH / 2, PD); g.fillStyle = 'rgba(60,40,20,.25)'; g.fillRect(e[0] - 14, 0, 14, H);
      g.restore();
    } else drawBackdrop(g, backArt || sp.back(t));
  }
  drawGround(g, groundArt || sp.ground(t));
  drawCards(g, cards || sp.cards(t));
}

function lyric(t) {
  for (const [a, b, s] of LYRICS) {
    if (t < a - .1 || t > b + .25) continue;
    const kIn = back(seg(t, a - .1, a + .18), 2), kOut = seg(t, b, b + .25);
    g.save(); g.font = '60px LyricZh'; const tw = g.measureText(s).width, bw = Math.min(W - 40, tw + 90), bh = 112;
    const fs = tw + 90 > W - 40 ? 60 * (W - 130) / tw : 60;
    const i = LYRICS.findIndex(l => l[0] === a), rot = (i % 2 ? 1 : -1) * .012;
    g.translate(W / 2, 1668 + kOut * 30); g.rotate(rot); g.scale(.7 + .3 * kIn, .7 + .3 * kIn); g.globalAlpha = clamp(kIn * 2) * (1 - kOut);
    // paper strip with an off-white border and a soft shadow
    g.shadowColor = 'rgba(40,25,10,.35)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.roundRect(-bw / 2 - 8, -bh / 2 - 8, bw + 16, bh + 16, 18); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#f3e3c4'; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, 12); g.fill();
    g.fillStyle = 'rgba(255,214,140,.7)'; g.fillRect(-bw / 2 - 18, -bh / 2 - 6, 70, 26); g.fillRect(bw / 2 - 52, bh / 2 - 22, 70, 26);
    g.fillStyle = INK; g.font = `${fs}px LyricZh`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 4);
    g.restore();
  }
}

function frame(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  // which phase
  let sp = spreadAt(t), cam = camOf(sp, t), turn = null;
  for (const tr of TURNS) if (t >= tr[0] && t < tr[1]) turn = tr;
  if (turn) cam = camOf(turn[2], t);
  setCam(cam);
  const shake = sp.shake?.(t) || [0, 0]; if (shake[0]) g.translate(shake[0], shake[1]);
  const { cool, warm } = grade(t);
  drawRoom(g, warm);

  if (t < OPEN[1]) {                                         // the closed book opens
    const th = 90 * eio(seg(t, OPEN[0], OPEN[1]));
    drawSpreadContent(sp, t, { standing: false });
    drawLeaf(g, th, P.cover(false), sp.back(t));
  } else if (t >= CLOSE[0]) {                                // the last page, then the book closes
    const th = 90 * (1 - eio(seg(t, CLOSE[0], CLOSE[1])));
    drawSpreadContent(sp, t, { standing: th >= 89.6, cards: [] });
    if (th < 89.6) drawLeaf(g, th, P.cover(true), sp.back(t));
  } else if (turn) {                                         // page turn: old backdrop, new ground, leaf
    const [t0, t1, A, B] = turn, th = 90 * eio(seg(t, t0, t1));
    drawSpreadContent(B, t, { backArt: A.back(t) });
    drawLeaf(g, th, A.groundCol, B.back(t));
  } else {
    const tEnd = nextTurnStart(sp);
    drawSpreadContent(sp, t, { cards: foldOut(sp.cards(t), t, tEnd) });
    sp.overlay?.(g, t, proj);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  finishFrame(g, warm, cool);
  lyric(t);
  if (t > FADE[0]) { g.fillStyle = `rgba(20,12,8,${eio(seg(t, FADE[0], FADE[1]))})`; g.fillRect(0, 0, W, H); }
}

window.render = t => { if (Q.get('sheet')) return drawSheet(g, W, H); frame(t); };
window.TEXTS = t => [];

async function load() {
  await document.fonts.ready;
  await Promise.all([['LyricZh', '我们把回忆'], ['HandZh', '我们的故事'], ['Digits', '2025.11']].map(([f, s]) => document.fonts.load(`40px ${f}`, s)));
  const im = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  for (const k of ['her1', 'her2', 'him1', 'him2']) { const i = await im(`assets/ref/${k}.png`); if (i) PHOTOS[k] = i; }
  window.READY = true;
}
load();
