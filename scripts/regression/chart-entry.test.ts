/**
 * 真太阳时排盘入口回归测试。
 *
 * 覆盖三组：
 *  1. 零回归 —— 不传经度/钟点时，与直接调 `generateChart` 逐位一致
 *  2. issue #45 原始复现 —— 香港 2025-12-31 23:00 边界案例
 *  3. 晚子时按钟表判定（与经度无关）
 */

import {
  generateTrueSolarChart,
  resolveTrueSolarBirthInfo,
  extractClock,
} from '../../lib/ziwei/chart-entry';
import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthInfo } from '../../lib/ziwei/types';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? '' : `got ${a}, expected ${e}`);
}

/** 取盘的「盘面指纹」——用于 golden 一致性断言 */
function fingerprint(chart: any) {
  return {
    mingGong: chart.mingGongBranch,
    shenGong: chart.shenGongBranch,
    wuxingJu: chart.wuxingJu,
    palaces: chart.palaces
      .map((p: any) => `${p.name}:${p.branch}:${p.stars.map((s: any) => s.name).join('')}`)
      .sort(),
    siHua: chart.palaces
      .flatMap((p: any) => p.stars.filter((s: any) => s.siHua).map((s: any) => `${p.name}:${s.name}:${s.siHua}`))
      .sort(),
  };
}

// ─────────────────────────────────────────────────────────────
// 1. 零回归：不传经度、不传钟点 → 与 generateChart 完全一致
// ─────────────────────────────────────────────────────────────
{
  const bi: BirthInfo = { year: 1985, month: 8, day: 8, hour: 4, gender: 'male' };
  const direct = fingerprint(generateChart(bi));
  const viaEntry = fingerprint(generateTrueSolarChart(bi));
  eq('零回归：无经度无钟点 → 盘面与 generateChart 一致', viaEntry, direct);
}

// ─────────────────────────────────────────────────────────────
// 2. 零回归：传了 origInput 但没有经度 → 仍不应改动盘面
// ─────────────────────────────────────────────────────────────
{
  const bi: BirthInfo = {
    year: 1985, month: 8, day: 8, hour: 4, gender: 'male',
    origInput: { year: 1985, month: 8, day: 8, clockHour: 7, clockMinute: 40 },
  };
  const direct = fingerprint(generateChart(bi));
  const viaEntry = fingerprint(generateTrueSolarChart(bi));
  eq('零回归：有 origInput 无经度 → 盘面与 generateChart 一致', viaEntry, direct);
}

// ─────────────────────────────────────────────────────────────
// 3. extractClock：从 origInput 取钟点
// ─────────────────────────────────────────────────────────────
{
  const c = extractClock({
    year: 1985, month: 8, day: 8, hour: 4, gender: 'male',
    origInput: { year: 1985, month: 8, day: 8, clockHour: 7, clockMinute: 40 },
  });
  eq('extractClock：从 origInput 取出钟点', c && [c.clockHour, c.clockMinute], [7, 40]);

  const none = extractClock({ year: 1985, month: 8, day: 8, hour: 4, gender: 'male' });
  check('extractClock：无 origInput → null', none === null);
}

// ─────────────────────────────────────────────────────────────
// 4. issue #45 复现：香港 2025-12-31 23:00（经度 114.17）
//
//    issue #45 原文描述的**未修正**行为：
//      generateChart 直接用 hour=0 → 排到 2026-01-01，日柱乙亥，
//      而真太阳时约为 22:34（亥时）→ 应当仍属 12-31。
//
//    ⚠️ 但按本仓库 README 第 209 行的正式规格：
//      「23:00–23:59 出生（晚子时）按次日排盘、时辰取 0；
//        00:00–00:59 出生（早子时）按当日排盘、时辰同样取 0。」
//      规格是**按钟表**判晚子时，与真太阳时无关。
//      因此 23:00 出生 → 排盘日进位到 2026-01-01 是**符合规格**的，
//      且「时辰取 0」——注意规格要求时辰支取子(0)，不是亥(11)。
//
//    这与 issue #45 的隐含预期（亥时、不换日）不同，属于**规格歧义**，
//    已在 PR 描述中单独列出，请作者裁定：
//      读法 A（README 规格）：晚子时按钟表 → 换日 + 时辰取 0
//      读法 B（issue 隐含）：晚子时按真太阳时 → 亥时、不换日
//
//    本实现采用读法 A（与 README 一致），故断言如下。
// ─────────────────────────────────────────────────────────────
{
  const clock = { year: 2025, month: 12, day: 31, clockHour: 23, clockMinute: 0 };
  const bi: BirthInfo = {
    year: 2025, month: 12, day: 31, hour: 0, gender: 'male',
    longitude: 114.17,
  };

  const resolved = resolveTrueSolarBirthInfo(bi, clock);
  eq('晚子时按钟表（README 规格）：香港 23:00 → 排盘日进位到 2026-01-01',
    [resolved.year, resolved.month, resolved.day], [2026, 1, 1]);
  check('晚子时（README 规格）：时辰支取 0（子），而非按真太阳时取亥(11)',
    resolved.hour === 0, `got ${resolved.hour}`);
}

// ─────────────────────────────────────────────────────────────
// 5. 晚子时按钟表判定，与经度无关
//    乌鲁木齐 23:00 → 真太阳时 20:44，也必须判为晚子时（换日）
// ─────────────────────────────────────────────────────────────
{
  const clock = { year: 2025, month: 12, day: 31, clockHour: 23, clockMinute: 0 };
  const urumqi = resolveTrueSolarBirthInfo(
    { year: 2025, month: 12, day: 31, hour: 0, gender: 'male', longitude: 87.6 },
    clock,
  );
  eq('晚子时按钟表：乌鲁木齐 23:00 也进位到次日',
    [urumqi.year, urumqi.month, urumqi.day], [2026, 1, 1]);
}

// ─────────────────────────────────────────────────────────────
// 6. 经度修正生效：同一钟点，不同经度 → 不同时辰支
// ─────────────────────────────────────────────────────────────
{
  const clock = { year: 1985, month: 8, day: 8, clockHour: 7, clockMinute: 0 };
  const hk = resolveTrueSolarBirthInfo(
    { year: 1985, month: 8, day: 8, hour: 0, gender: 'male', longitude: 114.17 }, clock);
  const ny = resolveTrueSolarBirthInfo(
    { year: 1985, month: 8, day: 8, hour: 0, gender: 'male', longitude: -74.0 }, clock);
  check('经度修正生效：香港与纽约同钟点得出不同时辰支', hk.hour !== ny.hour,
    `hk=${hk.hour} ny=${ny.hour}`);
}

// ─────────────────────────────────────────────────────────────
// 7. 非法钟点必须报错，而不是静默产出错盘
// ─────────────────────────────────────────────────────────────
{
  let threw = false;
  try {
    resolveTrueSolarBirthInfo(
      { year: 1985, month: 8, day: 8, hour: 4, gender: 'male', longitude: 120 },
      { year: 1985, month: 8, day: 8, clockHour: 25, clockMinute: 0 },
    );
  } catch (e) {
    threw = true;
  }
  check('非法钟点（25 时）→ 抛错，不静默出错盘', threw);
}

// ─────────────────────────────────────────────────────────────
// 8. 早子时（00:00–00:59）按当日排盘，不进位
// ─────────────────────────────────────────────────────────────
{
  const resolved = resolveTrueSolarBirthInfo(
    { year: 1985, month: 8, day: 8, hour: 0, gender: 'male', longitude: 113.4 },
    { year: 1985, month: 8, day: 8, clockHour: 0, clockMinute: 30 },
  );
  eq('早子时不换日', [resolved.year, resolved.month, resolved.day], [1985, 8, 8]);
}

console.log(`\n${failed === 0 ? '✓' : '✗'} 真太阳时入口回归：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exit(1);
