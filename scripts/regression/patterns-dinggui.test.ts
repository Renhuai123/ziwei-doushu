/**
 * 〈定贵局〉二十七格严格实现的回归测试
 *
 * 三层断言：
 *  1. 结构层 —— 条目数、状态分布，防止后来者往表里塞放宽条件或悄悄删条
 *  2. 几何层 —— 三条 unreachable 的安星恒等式，用盘面实测复证
 *  3. 行为层 —— 每条可实现格必须有正例盘；全表触发率必须落在合理区间
 *
 * 第三条是这份测试存在的真实理由：格局识别器最常见的腐烂方式不是报错，
 * 而是悄悄变成恒真（放宽到人人有份）或恒假（条件写死在安星上不可能）。
 * 前者用「单条触发率上限」拦，后者用「正例存在」拦。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { ZiweiChart } from '../../lib/ziwei/types';
import {
  DING_GUI_GE,
  DING_GUI_JUDGEABLE,
  DING_GUI_UNREACHABLE,
  detectDingGui,
} from '../../lib/ziwei/patterns-dinggui';

const chartOf = (y: number, m: number, d: number, h: number): ZiweiChart => {
  // 跳过不存在的日期（2 月 30 日等）
  const dt = new Date(Date.UTC(y, m - 1, d));
  assert.equal(dt.getUTCMonth(), m - 1, `${y}-${m}-${d} 不是合法日期`);
  return generateChart({ year: y, month: m, day: d, hour: h, gender: 'male' });
};

// ────────────────── 一、结构层 ──────────────────

assert.equal(DING_GUI_GE.length, 27, '〈定贵局〉应为 27 条');

// 序号必须是 1..27 连续，且格名不重复
assert.deepEqual(
  DING_GUI_GE.map(g => g.no),
  Array.from({ length: 27 }, (_, i) => i + 1),
  '序号须为 1..27 连续',
);
assert.equal(new Set(DING_GUI_GE.map(g => g.name)).size, 27, '格名不得重复');

// 每条都必须写明注文；「见前批注」的要补出所据赋句
for (const g of DING_GUI_GE) {
  assert.ok(g.note.length > 0, `${g.name} 缺注文`);
  assert.ok(!/^见前批注。?$/.test(g.note), `${g.name} 只写了「见前批注」，须补出所据赋句`);
}

// 状态三分：可实现 23、无解 4、存疑 2
assert.equal(DING_GUI_JUDGEABLE, 23, '可判定条目应为 23 条（27 - 4 无解）');
assert.equal(DING_GUI_UNREACHABLE.length, 4, '安星无解的条目应为 4 条');
assert.deepEqual(
  DING_GUI_UNREACHABLE.map(g => g.name).sort(),
  ['财印夹禄', '文星暗拱', '金舆扶驾', '马头带剑'].sort(),
  '无解条目清单变动须同步更新文档与理由',
);
for (const g of DING_GUI_UNREACHABLE) {
  assert.ok(g.why && g.why.length > 20, `${g.name} 标了 unreachable 却没写几何理由`);
  assert.equal(g.fn, undefined, `${g.name} 标了 unreachable 就不该带判定函数（死代码）`);
}
for (const g of DING_GUI_GE.filter(x => x.status === 'disputed')) {
  assert.ok(g.why && g.why.length > 10, `${g.name} 标了 disputed 却没写歧义所在`);
  assert.ok(g.fn, `${g.name} 标了 disputed 仍须给出通行解的实现`);
}

// ────────────────── 二、几何层：无解的三条 ──────────────────

/** 统计两星相对宫位（b 相对 a）在样本上出现过的全部差值 */
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

// 8 年 × 12 月 × 2 日 × 12 时辰。年月日时四个变量都要动：
//   年干定禄存/擎羊/天马/魁钺/四化；月支定左辅右弼/天刑；日与五行局定紫微（ thence 天梁天相廉贞）；
//   时支定文昌文曲/地空地劫/火星铃星。
// 少取任何一个，都会把某对星的相对宫位判成单一值（昌曲同宫只在辰戌时，只取子午就永远测不到）。
const sample: ZiweiChart[] = [];
for (let y = 1990; y <= 1993; y++) {
  for (let m = 1; m <= 12; m++) {
    for (const d of [5, 20]) {
      for (let h = 0; h < 12; h++) sample.push(chartOf(y, m, d, h));
    }
  }
}

// 财印夹禄：天梁恒在天相顺时针下一宫，不能分居两侧
assert.deepEqual(
  [...deltas('天相', '天梁', sample)].sort((x, y) => x - y),
  [1],
  '天梁相对天相的宫距应恒为 1（天梁恒居天相下一宫）——若此断言失败，说明安星表变了，财印夹禄需重新评估',
);

// 文星暗拱：昌曲宫距恒为偶数，两星永不改居相邻两宫
const changQu = [...deltas('文昌', '文曲', sample)];
assert.ok(
  changQu.every(d => d % 2 === 0),
  `文昌文曲宫距应恒为偶数，实测出现奇数：${changQu.filter(d => d % 2 !== 0).join('、')}`,
);
assert.ok(
  !changQu.includes(1) && !changQu.includes(11),
  '昌曲永不相邻——昌曲夹命（文星暗拱）因此无解',
);

// 金舆扶驾：紫微与太阳宫距恒定，日月永不可能夹紫微
assert.deepEqual(
  [...deltas('紫微', '太阳', sample)].sort((x, y) => x - y),
  [9],
  '太阳相对紫微的宫距应恒为 9——日永不在紫微前后一宫，金舆扶驾因此无解',
);

// 马头带剑：天马与擎羊永不同宫
assert.ok(
  !deltas('天马', '擎羊', sample).has(0),
  '天马与擎羊不应出现同宫——若出现，马头带剑的「无解」判定需重估',
);

// ────────────────── 三、行为层：正例与触发率 ──────────────────

/**
 * 每条可实现格的黄金正例盘（出生信息 → 命中的格名）。
 * 由 `_probe/verify_dinggui2.ts` 在 12,900 盘（1990–1995 × 12月 × 15日 × 12时辰）上搜得，取首个命中盘。
 * 盘面算法若变动导致这些不再命中，说明判定口径被动过——测试应当失败，不该放宽。
 *
 * ⚠️ 采样纪律：必须铺满十二时辰。天刑、左辅右弼、地空地劫、火星铃星、文昌文曲皆由
 * 月支或时辰定，它们与命宫的相对位置**只取决于时辰**；固定几个时辰取样，会把
 * 「君臣庆会」「刑囚夹印」这类月星×命宫的格系统性地判成 0 触发（本次实测：
 * 三时辰样本里这两条都为 0，补满十二时辰后分别是 16 例与 189 例）。
 */
const GOLDEN: Array<[number, number, number, number, string]> = [
  [1990, 1, 5, 0, '日月夹命'],
  [1990, 1, 27, 3, '日出扶桑'],
  [1990, 1, 27, 3, '月落亥宫'],
  [1990, 1, 15, 4, '月生沧海'],
  [1990, 1, 9, 2, '辅弼拱主'],
  [1990, 11, 21, 10, '君臣庆会'],
  // 特意取「禄存居天马后一宫」形态的首例（1993-2-7 时3，_probe/_lu_ma.ts 搜得）——
  // 该形态旧版（禄在马前隔位的错读）永远无法命中，保留它防止回退。
  [1993, 2, 7, 3, '禄马佩印'],
  [1990, 1, 27, 1, '坐贵向贵'],
  [1990, 1, 3, 5, '七杀朝斗'],
  [1990, 1, 9, 8, '日月并明'],
  [1990, 1, 11, 6, '明珠出海'],
  [1990, 1, 3, 0, '日月同临'],
  [1990, 1, 11, 5, '刑囚夹印'],
  [1991, 2, 17, 3, '科权禄拱'],
  [1990, 7, 15, 9, '贪火相逢'],
  [1990, 2, 1, 11, '武曲守垣'],
  [1990, 1, 3, 11, '府相朝垣'],
  [1990, 1, 7, 11, '紫府朝垣'],
  [1990, 1, 5, 0, '权禄生逢'],
  [1990, 1, 1, 6, '羊刃入庙'],
  [1990, 1, 19, 10, '巨机居卯'],
  [1990, 1, 11, 7, '明禄暗禄'],
  [1990, 1, 13, 1, '科明暗禄'],
];

// 黄金表必须覆盖全部可实现条目，不多不少
assert.deepEqual(
  GOLDEN.map(g => g[4]).sort(),
  DING_GUI_GE.filter(g => g.fn).map(g => g.name).sort(),
  '黄金正例表与可实现条目清单不一致——新增条目须补正例',
);

for (const [y, m, d, h, name] of GOLDEN) {
  const hits = detectDingGui(chartOf(y, m, d, h));
  assert.ok(
    hits.some(x => x.name === name),
    `${y}-${m}-${d} 时${h} 应命中「${name}」，实际命中：${hits.map(x => x.name).join('、') || '无'}`,
  );
}

// 全表触发率：任何单条超过 8% 视为放宽过头
// 依据：原文 49 条中最高者（坐贵向贵）实测 5.6%，无一条超过 6%
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
  for (const g of detectDingGui(c)) {
    counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
    total++;
  }
}

for (const g of DING_GUI_GE) {
  if (!g.fn) continue;
  const rate = (counts.get(g.name) ?? 0) / RATE_SAMPLE.length;
  assert.ok(
    rate <= 0.08,
    `「${g.name}」触发率 ${(rate * 100).toFixed(1)}% 超过 8%——格本用于筛人，放宽到人人有份就不是格了`,
  );
}

// 均值区间：严格按原文应在 0.3–1.2 个/盘；项目现有的 41 个识别器是 4.47 个/盘
const avg = total / RATE_SAMPLE.length;
assert.ok(
  avg > 0.2 && avg < 1.5,
  `〈定贵局〉平均命中 ${avg.toFixed(2)} 个/盘，超出 0.2–1.5 的预期区间`,
);

const maxRate = counts.size
  ? Math.max(...[...counts.values()].map(v => v / RATE_SAMPLE.length)) * 100
  : 0;

console.log(
  `patterns-dinggui: 27 条（可实现 ${DING_GUI_JUDGEABLE} / 无解 ${DING_GUI_UNREACHABLE.length} / 存疑 2），` +
  `实测平均 ${avg.toFixed(2)} 个/盘，单条最高 ${maxRate.toFixed(1)}%`,
);
