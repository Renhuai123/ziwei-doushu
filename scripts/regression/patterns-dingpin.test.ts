/**
 * 〈定贫贱局〉八格严格实现的回归测试
 *
 * 三层断言，与姊妹篇 patterns-dinggui / patterns-dingfu 同构：
 *  1. 结构层 —— 条目数、状态分布（本表无 unreachable），disputed 必带 why 与实现
 *  2. 几何层 —— 三条安星恒等式用盘面实测复证（武廉恒距 4、空劫同宫 ⇔ 子午时、
 *               羊陀恒距 2），它们分别是财与囚仇「分守」、禄逢两杀「稀有」、
 *               君子在野严读「极稀」的根据
 *  3. 行为层 —— 每条必须有正例盘；触发率落在稀疏区间
 *
 * 定贫贱局八条没有结构性无解——贫贱格条件多是「星＋状态」，不做位置配合要求。
 * 三条 disputed 的宽严取舍见模块内 why；本测试用正例盘锁定所选读法。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { ZiweiChart } from '../../lib/ziwei/types';
import {
  DING_PIN_GE,
  DING_PIN_JUDGEABLE,
  DING_PIN_UNREACHABLE,
  detectDingPin,
} from '../../lib/ziwei/patterns-dingpin';

const chartOf = (y: number, m: number, d: number, h: number): ZiweiChart => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  assert.equal(dt.getUTCMonth(), m - 1, `${y}-${m}-${d} 不是合法日期`);
  return generateChart({ year: y, month: m, day: d, hour: h, gender: 'male' });
};

// ────────────────── 一、结构层 ──────────────────

assert.equal(DING_PIN_GE.length, 8, '〈定贫贱局〉应为 8 条');
assert.deepEqual(DING_PIN_GE.map(g => g.no), [1, 2, 3, 4, 5, 6, 7, 8], '序号须为 1..8');
assert.equal(new Set(DING_PIN_GE.map(g => g.name)).size, 8, '格名不得重复');
for (const g of DING_PIN_GE) {
  assert.ok(g.note.length > 0, `${g.name} 缺注文`);
}

// 状态：可实现 5、存疑 3、无解 0
assert.equal(DING_PIN_JUDGEABLE, 8, '八条全部可判（含存疑的通行解实现）');
assert.equal(DING_PIN_UNREACHABLE.length, 0, '定贫贱局无安星结构性无解条目——若发现，须先给纯安星证明');
const disputed = DING_PIN_GE.filter(g => g.status === 'disputed');
assert.deepEqual(
  disputed.map(g => g.name).sort(),
  ['日月藏辉', '马落空亡', '君子在野'].sort(),
  '存疑条目清单变动须同步更新文档与宽严取舍理由',
);
for (const g of disputed) {
  assert.ok(g.why && g.why.length > 20, `${g.name} 标了 disputed 却没写宽严取舍理由`);
  assert.ok(g.fn, `${g.name} 标了 disputed 仍须给出通行解的实现`);
}

// ────────────────── 二、几何层 ──────────────────

function deltas(a: string, b: string, charts: ZiweiChart[]): Set<number> {
  const out = new Set<number>();
  for (const c of charts) {
    const pa = c.palaces.find(p => p.stars.some(s => s.name === a))?.branch ?? -1;
    const pb = c.palaces.find(p => p.stars.some(s => s.name === b))?.branch ?? -1;
    if (pa < 0 || pb < 0) continue;
    out.add(((pb - pa) + 12) % 12);
  }
  return out;
}

// 年月日时四个变量都要动（理由同 dinggui 测试）。
const sample: ZiweiChart[] = [];
for (let y = 1990; y <= 1993; y++) {
  for (let m = 1; m <= 12; m++) {
    for (const d of [5, 20]) {
      for (let h = 0; h < 12; h++) sample.push(chartOf(y, m, d, h));
    }
  }
}

// 恒等式一：武曲与廉贞宫距恒定且永不同宫——「武贞同守身命」只能分守身命两宫
//（deltas(a,b) 取「b 相对 a」：武曲相对廉贞恒 +4，反向即 8，方向勿再写反）
assert.deepEqual(
  [...deltas('廉贞', '武曲', sample)].sort((x, y) => x - y),
  [4],
  '武曲相对廉贞的宫距应恒为 4（武廉永不同宫）——财与囚仇「同守」必须取分守读法',
);

// 恒等式二：地空地劫同宫只出现在子、午两个时辰
//（地劫自亥顺数时支、地空自亥逆数，同宫 ⇔ 2h ≡ 0 mod 12）
{
  let tongGong = 0;
  const hours = new Set<number>();
  for (let y = 1990; y <= 1991; y++) {
    for (let m = 1; m <= 12; m++) {
      for (const h of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
        const c = chartOf(y, m, 10, h);
        const kong = c.palaces.find(p => p.stars.some(s => s.name === '地空'))?.branch ?? -1;
        const jie = c.palaces.find(p => p.stars.some(s => s.name === '地劫'))?.branch ?? -1;
        if (kong >= 0 && kong === jie) { tongGong++; hours.add(h); }
      }
    }
  }
  assert.ok(tongGong > 0, '样本中应存在空劫同宫的盘');
  assert.deepEqual(
    [...hours].sort((x, y) => x - y),
    [0, 6],
    '空劫同宫只应出现在子时（h=0）与午时（h=6）——禄逢两杀「两杀」读法天然稀有的根据',
  );
}

// 恒等式三：羊陀宫距恒定且永不同宫——四杀不可能全同宫，
// 君子在野严读（四杀全守身命）因此要求身命恰隔二宫且火铃同落，极稀
//（deltas 取「b 相对 a」：擎羊相对陀罗恒 +2；反向是 10，方向勿再写反）
assert.deepEqual(
  [...deltas('陀罗', '擎羊', sample)].sort((x, y) => x - y),
  [2],
  '擎羊相对陀罗的宫距应恒为 2（羊在禄前、陀在禄后）——四杀永不同宫，君子在野严读的几何根据',
);

// 恒等式四：破军存在落陷宫（一生孤贫可达的前提）
{
  let poXian = 0;
  for (const c of sample) {
    const p = c.palaces.find(p => p.stars.some(s => s.name === '破军'));
    if (p?.stars.find(s => s.name === '破军')?.brightnessRaw === '陷') poXian++;
  }
  assert.ok(poXian > 0, '样本中应存在破军落陷的盘——一生孤贫可达的前提');
}

// ────────────────── 三、行为层：正例与触发率 ──────────────────

/**
 * 黄金正例盘，由 `_probe/verify_dingpin.ts` 在 5,760 盘上搜得（取首个命中盘）。
 * 盘面算法若变动导致这些不再命中，测试应当失败，不该放宽。
 */
const GOLDEN: Array<[number, number, number, number, string]> = [
  [1990, 1, 4, 2, '生不逢时'],
  [1990, 11, 25, 0, '禄逢两杀'],
  [1990, 1, 1, 2, '马落空亡'],
  [1990, 1, 1, 1, '日月藏辉'],
  [1990, 1, 4, 2, '财与囚仇'],
  [1990, 1, 28, 11, '一生孤贫'],
  [1990, 2, 25, 6, '君子在野'],
  [1990, 12, 7, 3, '两重华盖'],
];

assert.deepEqual(
  GOLDEN.map(g => g[4]).sort(),
  DING_PIN_GE.filter(g => g.fn).map(g => g.name).sort(),
  '黄金正例表与可实现条目清单不一致——新增条目须补正例',
);

for (const [y, m, d, h, name] of GOLDEN) {
  const hits = detectDingPin(chartOf(y, m, d, h));
  assert.ok(
    hits.some(x => x.name === name),
    `${y}-${m}-${d} 时${h} 应命中「${name}」，实际命中：${hits.map(x => x.name).join('、') || '无'}`,
  );
}

// 全表触发率：5,760 盘实测均值 0.177 个/盘、零命中 84.0%、最多 3。
// 单条上限 8%：马落空亡守命读法实测 4.10%（17,280 盘）——注意它的触发率
// 按年支组恒定，随样本年支构成波动较大（1990-93 样本为 6.15%），
// 若此条单独超限，先查年支构成再判是否放宽，不可直接改阈值。
const RATE_SAMPLE: ZiweiChart[] = [];
for (let y = 1990; y <= 1993; y++) {
  for (let m = 1; m <= 12; m++) {
    for (const d of [1, 10, 20]) {
      for (const h of [0, 6]) RATE_SAMPLE.push(chartOf(y, m, d, h));
    }
  }
}
const counts = new Map<string, number>();
let total = 0;
for (const c of RATE_SAMPLE) {
  const hits = detectDingPin(c);
  total += hits.length;
  for (const h of hits) counts.set(h.name, (counts.get(h.name) ?? 0) + 1);
}
const avg = total / RATE_SAMPLE.length;
assert.ok(
  avg > 0.05 && avg < 0.4,
  `〈定贫贱局〉平均命中 ${avg.toFixed(3)} 个/盘，超出 0.05–0.4 的预期区间`,
);
for (const [name, v] of counts) {
  const rate = v / RATE_SAMPLE.length;
  assert.ok(
    rate < 0.08,
    `「${name}」触发率 ${(rate * 100).toFixed(1)}% 超过 8% 上限——疑似放宽（马落空亡的年支波动例外，先查样本构成）`,
  );
}

console.log(
  `patterns-dingpin: 8 条（可实现 5 / 存疑 3 / 无解 0），实测平均 ${avg.toFixed(2)} 个/盘，` +
  `单条最高 ${(Math.max(...counts.values()) / RATE_SAMPLE.length * 100).toFixed(1)}%`,
);
