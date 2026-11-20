/**
 * 真太阳时排盘入口回归测试。
 *
 * 核心断言（PR #69 维护者要求）：新入口 `resolveTrueSolarBirthInfo` 必须与
 * Web 表单路径 `formToBirthInfo` 走同一条路——同一出生输入下，
 * 两者的排盘日与时辰支必须一致。两者内部都只用
 * `calculateTrueSolarTime` + `resolveZiweiDayOffset` + `shiftGregorianDate`，
 * 晚子时按**真太阳时**判定（#63 口径）。
 *
 * 覆盖：
 *  1. 零回归 —— 无钟点时与直接调 `generateChart` 逐位一致
 *  2. 一致性 —— 维护者给出的 4 组对照（含期望值断言）
 *  3. 一致性 —— 东西向多经度的 23 点 / 0 点 / 1 点
 *  4. 一致性 —— 月末、年末、闰年 2 月末边界
 *  5. 海外时区 —— utcOffsetMinutes 经 clock / opts 透传
 *  6. extractClock 与非法钟点报错
 */

import {
  generateTrueSolarChart,
  resolveTrueSolarBirthInfo,
  extractClock,
  type ClockBirthInput,
} from '../../lib/ziwei/chart-entry';
import { generateChart } from '../../lib/ziwei/algorithm';
import { formToBirthInfo } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';
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

const pick = (b: BirthInfo) => [b.year, b.month, b.day, b.hour];

interface ConsistencyCase {
  name: string;
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  longitude: number;
  /** 维护者对照表的期望 [年, 月, 日, 时辰支索引]，仅 4 组对照有 */
  expect?: [number, number, number, number];
}

/** 同一出生输入分别走新入口与 formToBirthInfo，断言排盘日 + 时辰支一致。 */
function assertConsistent(c: ConsistencyCase) {
  const bi: BirthInfo = {
    year: c.year, month: c.month, day: c.day, hour: 0,
    gender: 'male', province: '测试省', longitude: c.longitude,
  };
  const clock: ClockBirthInput = {
    year: c.year, month: c.month, day: c.day,
    clockHour: c.clockHour, clockMinute: c.clockMinute,
  };
  const viaEntry = pick(resolveTrueSolarBirthInfo(bi, clock));

  const form: BirthFormState = {
    name: '',
    year: String(c.year), month: String(c.month), day: String(c.day),
    clockHour: String(c.clockHour), clockMinute: String(c.clockMinute),
    unknownTime: false,
    province: '测试省', city: '', longitude: c.longitude,
    gender: 'male',
  };
  const viaForm = pick(formToBirthInfo(form));

  eq(`一致性：${c.name}`, viaEntry, viaForm);
  if (c.expect) {
    eq(`期望值：${c.name}`, viaEntry, c.expect);
  }
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
// 2. 维护者 4 组对照（均为 UTC+8）——同时断言期望值与两路一致
//    本 PR 旧实现的结果曾分别为：06-15 亥 / 2026-01-01 子 / 06-15 子 / 06-15 子
// ─────────────────────────────────────────────────────────────
assertConsistent({
  name: '东经 80°，2025-06-15 01:30 → 06-14 亥（真太阳时跨到前一日）',
  year: 2025, month: 6, day: 15, clockHour: 1, clockMinute: 30, longitude: 80,
  expect: [2025, 6, 14, 11],
});
assertConsistent({
  name: '香港（114.17°），2025-12-31 23:00 → 12-31 亥（真太阳时 22:34，不换日）',
  year: 2025, month: 12, day: 31, clockHour: 23, clockMinute: 0, longitude: 114.17,
  expect: [2025, 12, 31, 11],
});
assertConsistent({
  name: '乌鲁木齐（87.6°），2025-06-15 00:30 → 06-14 亥（真太阳时为前一日晚间）',
  year: 2025, month: 6, day: 15, clockHour: 0, clockMinute: 30, longitude: 87.6,
  expect: [2025, 6, 14, 11],
});
assertConsistent({
  name: '东经 135°，2025-06-15 22:30 → 06-16 子（真太阳时已过 23:00，晚子时换日）',
  year: 2025, month: 6, day: 15, clockHour: 22, clockMinute: 30, longitude: 135,
  expect: [2025, 6, 16, 0],
});

// ─────────────────────────────────────────────────────────────
// 3. 东西向多经度 × 23 点 / 0 点 / 1 点
// ─────────────────────────────────────────────────────────────
for (const longitude of [135, 120, 100, 80]) {
  for (const [clockHour, clockMinute] of [[23, 30], [0, 30], [1, 30]] as const) {
    assertConsistent({
      name: `经度 ${longitude}°，2025-06-15 ${String(clockHour).padStart(2, '0')}:${clockMinute}`,
      year: 2025, month: 6, day: 15, clockHour, clockMinute, longitude,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 4. 月末 / 年末 / 闰年边界（跨日方向各一）
// ─────────────────────────────────────────────────────────────
assertConsistent({
  name: '月末向前跨日：2025-01-31 01:30，东经 80°',
  year: 2025, month: 1, day: 31, clockHour: 1, clockMinute: 30, longitude: 80,
});
assertConsistent({
  name: '月末向后跨日：2025-03-31 22:30，东经 135°',
  year: 2025, month: 3, day: 31, clockHour: 22, clockMinute: 30, longitude: 135,
});
assertConsistent({
  name: '年末向前跨日：2025-12-31 01:30，东经 80°',
  year: 2025, month: 12, day: 31, clockHour: 1, clockMinute: 30, longitude: 80,
});
assertConsistent({
  name: '年初向前跨年：2026-01-01 01:30，东经 80°',
  year: 2026, month: 1, day: 1, clockHour: 1, clockMinute: 30, longitude: 80,
});
assertConsistent({
  name: '闰年 2 月末向后跨日：2024-02-29 22:30，东经 135°',
  year: 2024, month: 2, day: 29, clockHour: 22, clockMinute: 30, longitude: 135,
});
assertConsistent({
  name: '平年 2 月末向后跨日：2025-02-28 22:30，东经 135°',
  year: 2025, month: 2, day: 28, clockHour: 22, clockMinute: 30, longitude: 135,
});

// ─────────────────────────────────────────────────────────────
// 5. 海外时区：utcOffsetMinutes 透传
//    纽约（经度 -74°，标准时间 UTC-5）2025-06-15 01:30：
//    传 -300 → 按当地时区算，不换日；不传 → 按东八区算，会跨到前一日。
// ─────────────────────────────────────────────────────────────
{
  const bi: BirthInfo = { year: 2025, month: 6, day: 15, hour: 5, gender: 'male', longitude: -74.0 };
  const clock: ClockBirthInput = { year: 2025, month: 6, day: 15, clockHour: 1, clockMinute: 30 };

  const viaOpts = resolveTrueSolarBirthInfo(bi, clock, { utcOffsetMinutes: -300 });
  eq('utcOffsetMinutes 经 opts 透传：纽约 01:30 不换日', pick(viaOpts), [2025, 6, 15, 1]);

  const viaClock = resolveTrueSolarBirthInfo(bi, { ...clock, utcOffsetMinutes: -300 });
  eq('utcOffsetMinutes 经 clock 透传：结果同 opts', pick(viaClock), pick(viaOpts));

  const clockWins = resolveTrueSolarBirthInfo(
    bi, { ...clock, utcOffsetMinutes: -300 }, { utcOffsetMinutes: 480 });
  eq('utcOffsetMinutes 优先级：clock 高于 opts', pick(clockWins), pick(viaOpts));

  const noOffset = resolveTrueSolarBirthInfo(bi, clock);
  check('不传 utcOffsetMinutes → 仍按东八区（与既有行为一致，且与传参结果不同）',
    JSON.stringify(pick(noOffset)) !== JSON.stringify(pick(viaOpts)),
    `noOffset=${JSON.stringify(pick(noOffset))}`);
}

// ─────────────────────────────────────────────────────────────
// 6. lateZishi 流派透传：current-day 时晚子时不换日
// ─────────────────────────────────────────────────────────────
{
  const bi: BirthInfo = { year: 2025, month: 6, day: 15, hour: 0, gender: 'male', longitude: 120 };
  const clock: ClockBirthInput = { year: 2025, month: 6, day: 15, clockHour: 23, clockMinute: 30 };
  eq('lateZishi 默认 next-day：真太阳时 23:30 换日',
    pick(resolveTrueSolarBirthInfo(bi, clock)), [2025, 6, 16, 0]);
  eq('lateZishi current-day：晚子时不换日',
    pick(resolveTrueSolarBirthInfo(bi, clock, { lateZishi: 'current-day' })), [2025, 6, 15, 0]);
}

// ─────────────────────────────────────────────────────────────
// 7. extractClock：从 origInput 取钟点
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
// 8. 非法钟点必须报错，而不是静默产出错盘
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

console.log(`\n${failed === 0 ? '✓' : '✗'} 真太阳时入口回归：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exit(1);
