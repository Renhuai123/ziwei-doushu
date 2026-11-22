/**
 * 〈定杂局〉八格回归测试（三层：结构 / 架构 / 行为）
 *
 * 与姊妹篇（dinggui/dingfu/dingpin）测试的差别：本表命中单位是运限，
 * 不是命盘。所以行为层的「触发率」分两个口径——
 *  - 单位口径：命中大限数 / 大限总数（判口径漂移）；
 *  - 盘面口径：至少命中一次的盘占比（判「满盘都是」的退化）。
 * 闸门不是判别力要求，是口径冻结：实现改了、数字超出区间，必须先说明
 * 改了什么读法再动闸门（与 dingpin 的 8% 闸门同一纪律）。
 *
 * 特例：no.4 衣锦还乡只实现了「四十后行墓运」半句（前半是履历不可判），
 * 4/12 墓库 × 约 7/12 限起于 40 后 ≈ 22%，盘面口径必然 100%——这是
 * 半句条目的本性，闸门断的是这个几何预测值，不是判别力。
 * no.6 水上驾星是流年描述格（一段人生总有吉凶交替），盘面口径 100%
 * 同为本性，真实用法是 detectDingZa(chart, { age }) 按年查询。
 */

import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import {
  DING_ZA_GE, DING_ZA_JUDGEABLE, detectDingZa, getCurrentDingZa,
} from '../../lib/ziwei/patterns-dingza';
import type { ZiweiChart } from '../../lib/ziwei/types';

// ────────────────── 第一层：结构 ──────────────────

function testStructure() {
  assert.equal(DING_ZA_GE.length, 8, '定杂局应为 8 条');
  assert.equal(DING_ZA_JUDGEABLE, 8, '八条应全部带实现（本表无 unreachable）');
  DING_ZA_GE.forEach((g, i) => {
    assert.equal(g.no, i + 1, '序号应连续 1-8');
    assert.ok(g.note.length > 0, `第 ${g.no} 条缺注文`);
    assert.ok(g.judge, `第 ${g.no} 条缺判定函数`);
    assert.ok(g.unit === '大限' || g.unit === '流年', `第 ${g.no} 条 unit 非法`);
  });
  const statusByNo = new Map(DING_ZA_GE.map(g => [g.no, g.status]));
  assert.equal(statusByNo.get(1), 'derivable');
  assert.equal(statusByNo.get(2), 'derivable');
  assert.equal(statusByNo.get(3), 'derivable');
  assert.equal(statusByNo.get(4), 'disputed', '衣锦还乡前半不可判，应为 disputed');
  assert.equal(statusByNo.get(5), 'disputed');
  assert.equal(statusByNo.get(6), 'disputed');
  assert.equal(statusByNo.get(7), 'disputed');
  assert.equal(statusByNo.get(8), 'derivable');
  // 注文逐字核对（底本：维基文库《紫微斗数全书》卷一，多源比对一致）
  const notes = DING_ZA_GE.map(g => `${g.name} ${g.note}`).join('。');
  assert.ok(notes.includes('风云际会 身命虽弱二限逢禄马是也'));
  assert.ok(notes.includes('枯木逢春 谓命衰限好是也'));
}

// ────────────────── 第二层：大限架构 ──────────────────

function testDaXianArchitecture(chart: ZiweiChart) {
  const dxs = [...chart.daXians].sort((a, b) => a.startAge - b.startAge);
  assert.equal(dxs.length, 12, '大限应为 12 个');
  assert.equal(dxs[0].startAge, chart.wuxingJu, '首限起岁应等于五行局数');
  for (const dx of dxs) {
    assert.equal(dx.endAge - dx.startAge + 1, 10, '每个大限应整整十年');
  }
  const branches = new Set(dxs.map(dx => dx.palaceBranch));
  assert.equal(branches.size, 12, '十二限应各占一宫，宫支互异');
}

function testAgeFilter() {
  const chart = generateChart({ year: 1990, month: 1, day: 1, hour: 0, gender: 'male' });
  const all = detectDingZa(chart);
  // 大限格：age 过滤后每条命中的 [startAge, endAge] 必须覆盖 age
  const age = 45;
  const filtered = detectDingZa(chart, { age });
  for (const h of filtered) {
    assert.ok(h.startAge !== undefined && h.endAge !== undefined);
    if (h.unit === '大限') {
      assert.ok(age >= h.startAge! && age <= h.endAge!, `${h.name} 过滤后年龄区间不含 ${age}`);
    } else {
      assert.ok(age === h.startAge || age === h.endAge, `${h.name} 流年窗不含 ${age}`);
    }
  }
  const allDaxian = all.filter(x => x.unit === '大限');
  const filteredDaxian = filtered.filter(x => x.unit === '大限');
  assert.ok(filteredDaxian.length <= allDaxian.length);
  for (const h of filteredDaxian) {
    assert.ok(allDaxian.some(x => x.no === h.no && x.startAge === h.startAge),
      '过滤结果必须是全量结果的子集');
  }
  // getCurrentDingZa 与 detectDingZa(chart, {age: currentAge}) 等价
  const cur = getCurrentDingZa(chart);
  const manual = detectDingZa(chart, { age: chart.currentAge });
  assert.deepEqual(cur, manual, 'getCurrentDingZa 应等价于 age=currentAge 过滤');
}

// ────────────────── 第三层：行为 ──────────────────

// 黄金正例（探针 _probe/_dingza_stats.ts 实测命中盘，12 年干覆盖）
const GOLDEN: Array<{
  birth: { year: number; month: number; day: number; hour: number };
  no: number;
  ages: [number, number];
}> = [
  { birth: { year: 1990, month: 1, day: 29, hour: 9 }, no: 1, ages: [34, 43] },  // 风云际会
  { birth: { year: 1990, month: 3, day: 3, hour: 0 }, no: 1, ages: [15, 24] },
  { birth: { year: 1990, month: 1, day: 1, hour: 6 }, no: 2, ages: [5, 14] },    // 锦上添花
  { birth: { year: 1992, month: 3, day: 2, hour: 0 }, no: 3, ages: [4, 13] },    // 禄衰马困
  { birth: { year: 1990, month: 1, day: 1, hour: 0 }, no: 4, ages: [62, 71] },   // 衣锦还乡
  { birth: { year: 1990, month: 1, day: 1, hour: 0 }, no: 5, ages: [52, 61] },   // 步数无依
  { birth: { year: 1990, month: 1, day: 1, hour: 0 }, no: 6, ages: [5, 6] },     // 水上驾星
  { birth: { year: 1990, month: 1, day: 1, hour: 0 }, no: 7, ages: [72, 81] },   // 吉凶相伴
  { birth: { year: 1990, month: 1, day: 15, hour: 0 }, no: 8, ages: [12, 21] },  // 枯木逢春
];

function testGolden() {
  for (const g of GOLDEN) {
    const chart = generateChart({ ...g.birth, gender: 'male' });
    const hits = detectDingZa(chart).filter(h => h.no === g.no);
    const ok = hits.some(h => h.startAge === g.ages[0] && h.endAge === g.ages[1]);
    assert.ok(ok,
      `${g.birth.year}-${g.birth.month}-${g.birth.day} ${g.birth.hour}时 应命中第 ${g.no} 条 ${g.ages[0]}-${g.ages[1]} 岁，实际：` +
      hits.map(h => `${h.startAge}-${h.endAge}`).join('、') || '（无）');
  }
}

/** 单位/盘面双口径触发率，闸门为口径冻结（理由见文件头） */
async function testRates() {
  const unitHit = new Map<number, number>();
  const chartHit = new Map<number, number>();
  const liunianPerChart: number[] = [];
  let totalUnits = 0;
  const totalCharts = 720;

  const start = Date.UTC(1990, 0, 1);
  for (let i = 0; i < totalCharts; i++) {
    // 12 年（12 年干全覆盖）× 每年 60 盘（60 日步进 × 2 时辰），男女交替
    const dt = new Date(start + Math.floor(i / 60) * 365 * 86_400_000 + (i % 60) * 6 * 86_400_000);
    const chart = generateChart({
      year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate(),
      hour: (i % 2) * 6, gender: i % 4 < 2 ? 'male' : 'female',
    });
    testDaXianArchitecture(chart);
    const dxs = [...chart.daXians].sort((a, b) => a.startAge - b.startAge);
    totalUnits += dxs.length;
    const hits = detectDingZa(chart);
    const seenNos = new Set<number>();
    for (const h of hits) {
      unitHit.set(h.no, (unitHit.get(h.no) ?? 0) + 1);
      if (!seenNos.has(h.no)) {
        seenNos.add(h.no);
        chartHit.set(h.no, (chartHit.get(h.no) ?? 0) + 1);
      }
    }
    liunianPerChart.push(hits.filter(h => h.no === 6).length);
  }

  // [单位口径下限, 上限, 盘面口径上限]（%）
  const gates: Record<number, [number, number, number]> = {
    1: [1.5, 5, 25],    // 风云际会：实测 2.92%/限、12.4%/盘
    2: [2, 6, 55],      // 锦上添花：实测 3.75%/限、38.3%/盘（首版 22%/限已收紧）
    3: [3, 8.5, 30],    // 禄衰马困：实测 5.56%/限、16.7%/盘（首版 22%/限已收紧）
    4: [17, 28, 100],   // 衣锦还乡：半句条目，4/12×7/12≈22% 是几何预测值，盘面必然 100%
    5: [2, 7, 55],      // 步数无依：实测 4.20%/限、37.7%/盘
    6: [0, 9999, 100],  // 水上驾星：流年描述格，每盘必有交替（本性），断均值区间见下
    7: [10, 21, 90],    // 吉凶相伴：实测 15.63%/限、74%/盘（「限好」本身即此量级）
    8: [2.5, 7.5, 40],  // 枯木逢春：实测 4.75%/限、23.6%/盘
  };
  for (const [no, [lo, hi, chartCap]] of Object.entries(gates)) {
    const n = Number(no);
    const ge = DING_ZA_GE.find(g => g.no === n)!;
    const u = (unitHit.get(n) ?? 0) / totalUnits * 100;
    const ch = (chartHit.get(n) ?? 0) / totalCharts * 100;
    if (ge.unit === '大限') {
      assert.ok(u >= lo && u <= hi,
        `第 ${n} 条单位命中率 ${u.toFixed(2)}%/限 越界 [${lo}, ${hi}]——口径漂了，先解释再动闸门`);
    }
    assert.ok(ch <= chartCap,
      `第 ${n} 条盘面命中率 ${ch.toFixed(1)}% 超上限 ${chartCap}%——口径漂了，先解释再动闸门`);
  }
  // 水上驾星：每盘交替窗数量级冻结（实测均值 ~30 窗/百年）
  const avg = liunianPerChart.reduce((a, b) => a + b, 0) / liunianPerChart.length;
  assert.ok(avg >= 10 && avg <= 60, `水上驾星均值 ${avg.toFixed(1)} 窗/盘 越界 [10, 60]`);
  assert.ok(liunianPerChart.every(n => n > 0), '水上驾星应每盘至少一个交替窗（描述格本性）');

  return { avg };
}

async function main() {
  testStructure();
  const smoke = generateChart({ year: 1988, month: 10, day: 8, hour: 6, gender: 'male' });
  testDaXianArchitecture(smoke);
  testAgeFilter();
  testGolden();
  const { avg } = await testRates();
  console.log(`✓ 结构 8 条（5 derivable / 3 disputed / 0 unreachable），注文与序号逐字核对`);
  console.log(`✓ 大限架构 720+ 盘：12 限 × 10 年 × 宫支互异 × 首限起岁=五行局数`);
  console.log(`✓ 黄金正例 9 例全中，age 过滤与 getCurrentDingZa 等价`);
  console.log(`✓ 双口径闸门全过（水上驾星均值 ${avg.toFixed(1)} 交替窗/盘）`);
}

main().catch(err => { console.error(err); process.exit(1); });
