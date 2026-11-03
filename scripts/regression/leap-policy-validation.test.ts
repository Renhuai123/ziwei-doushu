/**
 * 回归：闰月归属 policy 的运行时校验与四口径互异性。
 *
 * `generateChart` / `resolveEffectiveLunarDate` 可从运行时 JavaScript 与 JSON API 直接调用，
 * `LunarMonthPolicy` 的字面量联合类型形同虚设。拼错的 policy 原本会落进 if/else 链尾部、
 * 静默按「归本月」排盘，且错误值随 `chart.birthInfo.leapMonthPolicy` 序列化传播——
 * 与 gender 校验（#38）同族：类型在运行时不设防。
 *
 * 口径神谕表（独立誊写自 README/注释里的四口径定义，不引用被测实现的分支）：
 * 对闰月内的某日（rawLunarDay 记 d）：
 *   origin-month → 真闰本月（isLeapMonth=true，月份不变）
 *   prev-month   → 归本月（isLeapMonth=false，月份不变）
 *   split        → d ≤ 15 归本月，d > 15 归下月（isLeapMonth=false）
 *   next-month   → 归下月（月份 +1，isLeapMonth=false）
 *
 * 为什么值得这么较真：闰月归属差一个月，命宫/身宫/四化整盘皆错，而拼错 policy
 * 原本没有任何报错。
 */
import { generateChart, resolveEffectiveLunarDate } from '../../lib/ziwei/algorithm';

const POLICIES = ['split', 'next-month', 'prev-month', 'origin-month'] as const;

/** 2025 年闰六月（公历 2025-07-25 ~ 2025-08-22），取上半月与下半月各一天。 */
const LEAP_MONTH_DATES: Array<[number, number, number]> = [
  [2025, 8, 10], // 闰六月初十（上半月）
  [2025, 8, 18], // 闰六月下旬（下半月）
];

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };

/* ── ① 无效 policy 必须当场 RangeError ──────────────────────────── */
{
  console.log('① 无效 policy 当场拒绝');
  const invalid: unknown[] = ['nextmonth', 'next-monthh', '', 'NEXT-MONTH', null, 42, true];
  for (const p of invalid) {
    try {
      resolveEffectiveLunarDate(2025, 8, 10, p as never);
      fail(`policy=${JSON.stringify(p)} 未被拒绝（静默按归本月排盘）`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!(e instanceof RangeError) || !msg.includes('leapMonth policy')) {
        fail(`policy=${JSON.stringify(p)} 抛错类型/信息不对：${msg}`);
      }
    }
  }
  if (!bad) console.log('  ✅ 7 个无效值全部 RangeError 且信息点名 leapMonth policy');
}

/* ── ② 显式 undefined = 走默认值，不得报错 ──────────────────────── */
{
  console.log('② 显式 undefined 走默认 prev-month');
  try {
    const r = resolveEffectiveLunarDate(2025, 8, 10);
    console.log('  ✅ 默认口径可用');
    void r;
  } catch (e) {
    fail(`默认调用被误拒：${e instanceof Error ? e.message : String(e)}`);
  }
}

/* ── ③ 四口径在闰月内互异，且与神谕表逐项一致 ────────────────────── */
{
  console.log('③ 四口径与神谕表逐项一致（闰六月上/下半月各一天）');
  for (const [y, m, d] of LEAP_MONTH_DATES) {
    for (const policy of POLICIES) {
      const r = resolveEffectiveLunarDate(y, m, d, policy);
      if (r.rawLunarMonth !== -6) {
        fail(`${y}-${m}-${d} 不是闰六月（rawLunarMonth=${r.rawLunarMonth}），神谕表基准失效`);
        continue;
      }
      const day = r.rawLunarDay;
      // 神谕表：按四口径定义独立誊写
      const want =
        policy === 'origin-month' ? { month: 6, leap: true }
        : policy === 'prev-month' ? { month: 6, leap: false }
        : policy === 'next-month' ? { month: 7, leap: false }
        : (day > 15 ? { month: 7, leap: false } : { month: 6, leap: false });
      if (r.lunarMonth !== want.month || r.isLeapMonth !== want.leap) {
        fail(`${policy} @ 闰六月${day}日 → 实得 (月${r.lunarMonth}, 闰=${r.isLeapMonth})，应为 (月${want.month}, 闰=${want.leap})`);
      }
    }
  }
  if (!bad) console.log('  ✅ 四口径 × 两日期全部与神谕表一致');
}

/* ── ④ generateChart 端到端：合法 policy 正常排盘并回写 ──────────── */
{
  console.log('④ generateChart 端到端（合法 policy 排盘并回写 leapMonthPolicy）');
  for (const policy of POLICIES) {
    try {
      const chart = generateChart(
        { year: 2025, month: 8, day: 10, hour: 5, gender: 'female' },
        { leapMonth: policy },
      );
      const echoed = (chart.birthInfo as { leapMonthPolicy?: string }).leapMonthPolicy;
      if (echoed !== policy) fail(`policy=${policy} 回写不符：${String(echoed)}`);
      if (!chart.palaces || chart.palaces.length !== 12) fail(`policy=${policy} 排盘结果异常`);
    } catch (e) {
      fail(`policy=${policy} 排盘抛错：${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (!bad) console.log('  ✅ 四口径端到端排盘正常，leapMonthPolicy 回写一致');
}

if (bad) {
  console.error(`\n❌ ${bad} 项不符 —— 闰月归属 policy 校验或口径与定义不一致，会导致整盘错位。`);
  process.exit(1);
}
console.log('\n✅ 全部通过：无效 policy 当场拒绝，四口径互异且与定义一致。');
