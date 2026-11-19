/**
 * 〈定富局〉六格严格实现的回归测试
 *
 * 三层断言（结构／几何／行为），与姊妹篇 patterns-dinggui.test.ts 同构：
 *  1. 结构层 —— 条目数与状态分布，防止悄悄塞放宽条件或删条
 *  2. 几何层 —— 两条 unreachable 的安星恒等式，用盘面实测复证；
 *               另证两条 derivable 的「形态唯一」性质（防后人加出永假的第二读法）
 *  3. 行为层 —— 每条可实现格必须有正例盘；触发率必须落在稀疏区间
 *
 * 定富局六条里两条无解（财荫夹印、荫印拱身），同属「梁相夹/拱」家族：
 * 天梁恒居天相后一宫，这对相邻星对既不能分居一宫两侧，也不能同入三方四正。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { ZiweiChart } from '../../lib/ziwei/types';
import {
  DING_FU_GE,
  DING_FU_JUDGEABLE,
  DING_FU_UNREACHABLE,
  detectDingFu,
} from '../../lib/ziwei/patterns-dingfu';

const chartOf = (y: number, m: number, d: number, h: number): ZiweiChart => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  assert.equal(dt.getUTCMonth(), m - 1, `${y}-${m}-${d} 不是合法日期`);
  return generateChart({ year: y, month: m, day: d, hour: h, gender: 'male' });
};

// ────────────────── 一、结构层 ──────────────────

assert.equal(DING_FU_GE.length, 6, '〈定富局〉应为 6 条');
assert.deepEqual(
  DING_FU_GE.map(g => g.no),
  [1, 2, 3, 4, 5, 6],
  '序号须为 1..6',
);
assert.equal(new Set(DING_FU_GE.map(g => g.name)).size, 6, '格名不得重复');
for (const g of DING_FU_GE) {
  assert.ok(g.note.length > 0, `${g.name} 缺注文`);
}

// 状态二分：可实现 4、无解 2（定富局没有 disputed）
assert.equal(DING_FU_JUDGEABLE, 4, '可判定条目应为 4 条（6 - 2 无解）');
assert.equal(DING_FU_UNREACHABLE.length, 2, '安星无解的条目应为 2 条');
assert.deepEqual(
  DING_FU_UNREACHABLE.map(g => g.name).sort(),
  ['财荫夹印', '荫印拱身'].sort(),
  '无解条目清单变动须同步更新文档与几何理由',
);
for (const g of DING_FU_UNREACHABLE) {
  assert.ok(g.why && g.why.length > 20, `${g.name} 标了 unreachable 却没写几何理由`);
  assert.equal(g.fn, undefined, `${g.name} 标了 unreachable 就不该带判定函数（死代码）`);
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

// 年月日时四个变量都要动，理由同 dinggui 测试：缺任一变量都会把恒等式测错。
const sample: ZiweiChart[] = [];
for (let y = 1990; y <= 1993; y++) {
  for (let m = 1; m <= 12; m++) {
    for (const d of [5, 20]) {
      for (let h = 0; h < 12; h++) sample.push(chartOf(y, m, d, h));
    }
  }
}

// 恒等式一：天梁恒在天相顺时针下一宫（delta 恒 1）。财荫夹印、荫印拱身两条
// 的「无解」都建立在这对星永不分离相邻位置上。
assert.deepEqual(
  [...deltas('天相', '天梁', sample)].sort((x, y) => x - y),
  [1],
  '天梁相对天相的宫距应恒为 1（天梁恒居天相下一宫）——若失败，财荫夹印/荫印拱身需重新评估',
);

// 恒等式二：武曲与天相的宫距只取偶数——武曲永不能在天相相邻宫，
// 所以「武梁夹印」的那一半（武曲侧）无论命宫还是田宅宫都无解。
const wuXiang = [...deltas('武曲', '天相', sample)];
assert.ok(
  wuXiang.every(d => d % 2 === 0),
  `武曲天相宫距应恒为偶数，实测出现奇数：${wuXiang.filter(d => d % 2 !== 0).join('、')}`,
);
assert.ok(
  !wuXiang.includes(1) && !wuXiang.includes(11),
  '武曲永不与天相邻——财荫夹印因此无解',
);

// 恒等式三：太阳恒在武曲后一宫（delta 恒 1）——日月夹财的唯一可达形态
// （太阴在前、太阳在后）由此锁死；「前日后月」读法永不可能。
assert.deepEqual(
  [...deltas('武曲', '太阳', sample)].sort((x, y) => x - y),
  [1],
  '太阳相对武曲的宫距应恒为 1（太阳恒居武曲后一宫）——日月夹财形态唯一性的根据',
);

// 恒等式四：禄存永不在天马前一宫——财禄夹马唯一可达形态（禄在后、武在前）的根据。
// 注意：这是结构性恒等式（天马只在寅申巳亥，马前一位 {亥卯未戌...} 与禄存宫集
// {甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子} 无交集），不是样本统计。
// 禄存相对天马的差值全集依年干年支组合而定（样本 {0,1,4,7,9}），
// 不可断言它只有 {0,1}——那是年干覆盖不足造出的假恒等式。
assert.ok(
  !deltas('天马', '禄存', sample).has(11),
  '禄存不应出现在天马前一宫——若出现，财禄夹马「禄在前」读法需重估',
);

// 荫印拱身的拱冲读法：相邻两星不能同入一宫的三方四正，直接用盘面复证
{
  const pos = (c: ZiweiChart, n: string) =>
    c.palaces.find(p => p.stars.some(s => s.name === n))?.branch ?? -1;
  let coFang = 0;
  for (const c of sample) {
    const tz = c.palaces.find(p => p.name === '田宅')?.branch ?? -1;
    if (tz < 0) continue;
    const fang = [tz, (tz + 4) % 12, (tz + 8) % 12, (tz + 6) % 12];
    if (fang.includes(pos(c, '天梁')) && fang.includes(pos(c, '天相'))) coFang++;
  }
  assert.equal(coFang, 0, '天梁天相不应同入田宅三方四正——荫印拱身「拱冲」读法无解的实测复证');
}

// ────────────────── 三、行为层：正例与触发率 ──────────────────

/**
 * 黄金正例盘，由 `_probe/verify_dingfu.ts` 在 12,900 盘上搜得（取首个命中盘）。
 * 盘面算法若变动导致这些不再命中，测试应当失败，不该放宽。
 */
const GOLDEN: Array<[number, number, number, number, string]> = [
  [1990, 1, 5, 0, '日月夹财'],
  [1993, 1, 25, 3, '财禄夹马'],
  [1990, 1, 15, 9, '日月照璧'],
  [1990, 2, 11, 8, '金灿光辉'],
];

assert.deepEqual(
  GOLDEN.map(g => g[4]).sort(),
  DING_FU_GE.filter(g => g.fn).map(g => g.name).sort(),
  '黄金正例表与可实现条目清单不一致——新增条目须补正例',
);

for (const [y, m, d, h, name] of GOLDEN) {
  const hits = detectDingFu(chartOf(y, m, d, h));
  assert.ok(
    hits.some(x => x.name === name),
    `${y}-${m}-${d} 时${h} 应命中「${name}」，实际命中：${hits.map(x => x.name).join('、') || '无'}`,
  );
}

// 全表触发率：定富局本应稀疏。12,900 盘实测均值 0.048 个/盘、零命中 95.2%、
// 最高单条 2.68%（日月夹财，含财帛宫扩展）。区间外即判定被改动。
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
  const hits = detectDingFu(c);
  total += hits.length;
  for (const h of hits) counts.set(h.name, (counts.get(h.name) ?? 0) + 1);
}
const avg = total / RATE_SAMPLE.length;
assert.ok(
  avg > 0.01 && avg < 0.12,
  `〈定富局〉平均命中 ${avg.toFixed(3)} 个/盘，超出 0.01–0.12 的预期区间`,
);
for (const [name, v] of counts) {
  const rate = v / RATE_SAMPLE.length;
  assert.ok(
    rate < 0.08,
    `「${name}」触发率 ${(rate * 100).toFixed(1)}% 超过 8% 上限——疑似放宽`,
  );
}

console.log(
  `patterns-dingfu: 6 条（可实现 4 / 无解 2），实测平均 ${avg.toFixed(2)} 个/盘，` +
  `单条最高 ${(Math.max(...counts.values()) / RATE_SAMPLE.length * 100).toFixed(1)}%`,
);
