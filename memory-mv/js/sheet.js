// Model sheet: the same drawing code as the film.
import { charCard } from './chars.js';
import { motoCard } from './moto.js';
export function drawSheet(g, W, H) {
  g.fillStyle = '#efe6d4'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#3b2a22'; g.font = '64px LyricZh'; g.textAlign = 'center'; g.fillText('角色设定 · 把回忆拼好给你', W / 2, 90);
  const put = (who, p, x, y, h, label) => { const { c } = charCard(who, p, 2); const s = h / c.height; g.drawImage(c, x - c.width * s / 2, y - c.height * s, c.width * s, c.height * s); g.font = '30px LyricZh'; g.fillText(label, x, y + 36); };
  const row1 = 560, row2 = 1040, row3 = 1500;
  put('him', { expr: 'smile' }, 140, row1, 400, '正面'); put('him', { expr: 'smile', turn: .6 }, 400, row1, 400, '侧向');
  put('him', { view: 'back' }, 660, row1, 400, '背面'); put('him', { expr: 'smile', arms: 'wave', t: .1 }, 930, row1, 400, '挥手');
  put('her', { expr: 'smile' }, 140, row2, 380, '正面'); put('her', { expr: 'smile', turn: -.6 }, 400, row2, 380, '侧向');
  put('her', { view: 'back' }, 660, row2, 380, '背面'); put('her', { expr: 'shy', arms: 'chin' }, 930, row2, 380, '害羞');
  const ex = ['smile', 'shy', 'surprise', 'miss'], lb = ['微笑', '害羞', '惊喜', '思念'];
  ex.forEach((e, i) => { put('him', { expr: e }, 90 + i * 135, row3, 300, lb[i]); put('her', { expr: e }, 630 + i * 135, row3, 290, lb[i]); });
  const m = motoCard(0, 'ride'); const s = 520 / m.c.width; g.drawImage(m.c, W / 2 - 260, 1560, 520, m.c.height * s);
}
