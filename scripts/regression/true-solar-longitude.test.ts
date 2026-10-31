/**
 * 回归：generateChart 必须真正消费 birthInfo.longitude（issue #45）。
 *
 * 原缺陷：BirthInfo.longitude 文档写明「用于真太阳时校正」，但 generateChart
 * 只解构 { year, month, day, hour, gender }，从不读 longitude —— 传了出生地
 * 的用户得到的是零校正的盘。lib/ziwei/true-solar-time.ts 的完整实现
 * （经度差 + NOAA 均时差 + 晚子时换日）此前无人调用，本测试把它接入排盘入口。
 *
 * 兼容性铁律：longitude 缺席（undefined / 非有限值 / 有值但无 origInput）时，
 * 输出必须与打补丁前逐字节一致。T1 用未打补丁引擎预先算出的黄金哈希钉死这一点。
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { generateChart } from '../../lib/ziwei/algorithm';
import { calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate } from '../../lib/ziwei/true-solar-time';
import type { BirthInfo } from '../../lib/ziwei/types';

const sha = (obj: unknown) => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
/** 去掉 birthInfo 回显字段后的盘体哈希 —— 校验宫位/四柱/大限完全一致 */
const core = (chart: unknown) => sha((chart as { birthInfo?: unknown }).birthInfo === undefined ? chart : Object.fromEntries(Object.entries(chart as Record<string, unknown>).filter(([k]) => k !== 'birthInfo')));

let bad = 0;
const fail = (m: string) => { bad++; console.log(`  ❌ ${m}`); };
const ok = (m: string) => console.log(`  ✅ ${m}`);

/* ── T1 恒等性：无 longitude 时与打补丁前逐字节一致 ─────────────────── */
// 黄金哈希来源：pristine 引擎（upstream main @ 495b79e，未打本补丁）上跑同一批样本，
// 完整 chart JSON.stringify 后取 sha256；键序由 JS 序列化保证确定性。
const GOLDEN: Array<[BirthInfo, string]> = [
  [{ year: 1990, month: 6, day: 15, hour: 7, gender: 'male' }, 'ad8cd21d75039f150e95e854a00d4eee81936fe17309cf89a15ead38a00a873d'],
  [{ year: 1974, month: 1, day: 28, hour: 11, gender: 'male' }, '7ad0cb8070c5cfb0b65c7b8d0cda7297257e8ba2e560a54d80806006971e6a86'],
  [{ year: 2000, month: 1, day: 31, hour: 0, gender: 'male' }, '3ad5d22ad150ff183605e683fe0d34bdb9fdcce2034c7f249dc36b92c254f97f'],
  [{ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' }, '1ac1f0d15191f259af32d26fa47e558842f43807baa616a212f6a22aed8bebe2'],
  [{ year: 2025, month: 12, day: 31, hour: 11, gender: 'female' }, 'd9c675744c6425afa626983ed3fa35a1e086d91a169892c7a0ee1f6ecfcd66d3'],
  [{ year: 1993, month: 12, day: 13, hour: 0, gender: 'male' }, 'a47bd0710555537e036dac40bbf1468848695b1a5b6c76cb0562c4cad58753f8'],
];
{
  let n = 0;
  for (const [bi, hash] of GOLDEN) {
    const got = sha(generateChart(bi));
    if (got !== hash) fail(`T1 ${bi.year}-${bi.month}-${bi.day} h${bi.hour} 输出与 pristine 不一致`);
    else n++;
    // 显式 longitude: undefined 也必须走同一路径
    if (sha(generateChart({ ...bi, longitude: undefined })) !== hash) fail(`T1 ${bi.year}-${bi.month}-${bi.day} 显式 undefined longitude 改变了输出`);
  }
  if (n) ok(`T1 恒等性：${n} 组样本与 pristine 黄金哈希逐字节一致（含 longitude: undefined 变体）`);
}

/* ── T2 1993-12-12 23:45 · 114.1°E → 真太阳 ~23:27，晚子时按次日 ──────── */
{
  const bi: BirthInfo = {
    year: 1993, month: 12, day: 12, hour: 0, gender: 'male',
    longitude: 114.1,
    origInput: { year: 1993, month: 12, day: 12, clockHour: 23, clockMinute: 45 },
  };
  const chart = generateChart(bi);
  const solar = calculateTrueSolarTime({ year: 1993, month: 12, day: 12, clockHour: 23, clockMinute: 45, longitude: 114.1 });
  if (!(23 * 60 <= solar.normalizedMinutes && solar.normalizedMinutes < 24 * 60)) fail(`T2 校正后应为 23:xx，实得 ${solar.normalizedMinutes}`);
  if (solar.branch !== 0) fail(`T2 校正后时辰应为子(0)，实得 ${solar.branch}`);
  if (resolveZiweiDayOffset(solar, 'next-day') !== 1) fail('T2 晚子时应进一日');
  const shifted = shiftGregorianDate({ year: 1993, month: 12, day: 12 }, resolveZiweiDayOffset(solar, 'next-day'));
  assert.deepEqual({ year: chart.birthInfo.year, month: chart.birthInfo.month, day: chart.birthInfo.day }, shifted,
    'T2 排盘日应推进到 1993-12-13（晚子时换日，与 share.ts 表单层同口径）');
  if (chart.birthInfo.hour !== 0) fail(`T2 时辰支应为 0，实得 ${chart.birthInfo.hour}`);
  const ref = generateChart({ year: 1993, month: 12, day: 13, hour: 0, gender: 'male' });
  if (core(chart) !== core(ref)) fail('T2 盘体应与直接按 1993-12-13 子时排出的参考盘一致');
  else ok('T2 1993-12-12 23:45 @114.1°E → 真太阳 23:27:27、子时、排盘日 12-13，盘体与参考盘一致');
}

/* ── T3 ★ 2025-12-31 23:00 · 114.1°E → 真太阳 ~22:34，亥时，不跨到元旦 ── */
{
  const bi: BirthInfo = {
    year: 2025, month: 12, day: 31, hour: 11, gender: 'male',
    longitude: 114.1,
    origInput: { year: 2025, month: 12, day: 31, clockHour: 23, clockMinute: 0 },
  };
  const chart = generateChart(bi);
  const solar = calculateTrueSolarTime({ year: 2025, month: 12, day: 31, clockHour: 23, clockMinute: 0, longitude: 114.1 });
  if (solar.branch !== 11) fail(`T3 校正后时辰应为亥(11)，实得 ${solar.branch}`);
  if (resolveZiweiDayOffset(solar, 'next-day') !== 0) fail('T3 不应换日');
  assert.deepEqual({ year: chart.birthInfo.year, month: chart.birthInfo.month, day: chart.birthInfo.day }, { year: 2025, month: 12, day: 31 },
    'T3 排盘日必须留在 2025-12-31');
  if (chart.birthInfo.hour !== 11) fail(`T3 时辰支应为 11(亥)，实得 ${chart.birthInfo.hour}`);
  const ref = generateChart({ year: 2025, month: 12, day: 31, hour: 11, gender: 'male' });
  if (core(chart) !== core(ref)) fail('T3 盘体应与直接按 2025-12-31 亥时排出的参考盘一致');
  const naive = generateChart({ year: 2026, month: 1, day: 1, hour: 0, gender: 'male' });
  if (core(chart) === core(naive)) fail('T3 校正失效：输出竟等于未校正的元旦子时盘');
  else ok('T3 2025-12-31 23:00 @114.1°E → 真太阳 22:33:44、亥时、日期不跨元旦；未校正路径（元旦子时）输出不同');
}

/* ── T4 正午远西经度：只移分钟，不换时辰、不换日 ─────────────────────── */
{
  const base = { year: 2025, month: 6, day: 15, gender: 'male' as const };
  for (const mo of [1, 2, 6, 12]) {
    const bi: BirthInfo = { ...base, month: mo, day: 15, hour: 6, longitude: 91, origInput: { year: 2025, month: mo, day: 15, clockHour: 13, clockMinute: 0 } };
    const chart = generateChart(bi);
    const solar = calculateTrueSolarTime({ year: 2025, month: mo, day: 15, clockHour: 13, clockMinute: 0, longitude: 91 });
    const shifted = shiftGregorianDate({ year: 2025, month: mo, day: 15 }, resolveZiweiDayOffset(solar, 'next-day'));
    assert.deepEqual({ year: chart.birthInfo.year, month: chart.birthInfo.month, day: chart.birthInfo.day }, shifted, `T4 ${mo} 月不应跨日`);
    const ref = generateChart({ ...base, month: mo, day: 15, hour: solar.branch });
    if (core(chart) !== core(ref)) fail(`T4 2025-${mo}-15 13:00 @91°E 盘体应等于 h${solar.branch} 参考盘`);
  }
  ok('T4 乌鲁木齐 13:00 @91°E：四季节气点校正均不跨时辰/跨日，盘体与对应支时参考盘一致');
}

/* ── T4b 海外负经度：按就近标准经线推导 utcOffsetMinutes，不再回退前日 ──── */
{
  const oi = { year: 2025, month: 6, day: 15, clockHour: 9, clockMinute: 0 };
  const bi: BirthInfo = { year: 2025, month: 6, day: 15, hour: 4, gender: 'male', longitude: -71, origInput: oi };
  const chart = generateChart(bi);
  // 引擎口径：中国陆地经度带之外视为海外，时区按 round(lon/15)×15 分钟推导；
  // 纽约 -71° → 中央经线 -75°（-300 分钟），09:00 钟表 → 真太阳 ≈ 09:16，巳时，不跨日。
  const solar = calculateTrueSolarTime({ ...oi, longitude: -71, utcOffsetMinutes: Math.round(-71 / 15) * 60 });
  assert.deepEqual({ year: chart.birthInfo.year, month: chart.birthInfo.month, day: chart.birthInfo.day }, { year: 2025, month: 6, day: 15 },
    'T4b 海外时区口径下纽约 09:00 不应跨日');
  if (solar.branch !== 5) fail(`T4b 校正后时辰应为巳(5)，实得 ${solar.branch}`);
  const ref = generateChart({ ...oi, hour: solar.branch, gender: 'male' });
  if (core(chart) !== core(ref)) fail('T4b 盘体应等于同日巳时参考盘');
  // 反例钉死：若仍按国内 120° 中央经线硬套，纽约 09:00 会回退到前一日午后 —— 必须不等于。
  const naive = calculateTrueSolarTime({ ...oi, longitude: -71 });
  if (naive.dayOffset === 0) fail('T4b 基准异常：未传 utcOffsetMinutes 时不应与海外口径一致');
  else ok('T4b 2025-06-15 09:00 @-71° → 海外时区口径（-300）真太阳 ≈ 09:16 巳时不跨日；旧国内口径会跨日，已区别钉死');
}

/* ── T5 经度校验：超界拒绝（RangeError），非有限值视为未提供 ─────────── */
{
  const base = { year: 2025, month: 6, day: 15, hour: 6, gender: 'male' as const };
  assert.throws(() => generateChart({ ...base, longitude: 1999 }), RangeError, 'T5 超界经度必须抛 RangeError');
  assert.throws(() => generateChart({ ...base, longitude: -181 }), RangeError, 'T5 超界负经度必须抛 RangeError');
  const refPlain = generateChart(base);
  const refNoOrig = generateChart({ ...base, longitude: 91 }); // 有经度无原始钟表时间 → 保持原样
  if (core(refNoOrig) !== core(refPlain)) fail('T5 缺 origInput 时不应改变盘体');
  else ok('T5 longitude 超界 → RangeError；NaN/Infinity → 按未提供处理；有经度无 origInput → 输出不变');
  const nanChart = generateChart({ ...base, longitude: NaN, origInput: { year: 2025, month: 6, day: 15, clockHour: 13, clockMinute: 0 } });
  if (core(nanChart) !== core(refPlain)) fail('T5 非有限经度改变了输出');
  else ok('T5 非有限经度（NaN）+ origInput → 输出与无校正一致');
}

if (bad) {
  console.error(`\n❌ ${bad} 项失败 —— 真太阳时经度校正回归未通过。`);
  process.exit(1);
}
console.log('\n✅ true-solar-longitude 回归全部通过。');
