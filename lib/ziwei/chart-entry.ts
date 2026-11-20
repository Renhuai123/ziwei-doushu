/**
 * 真太阳时排盘入口 —— 给直接调用 `generateChart` 的库使用者。
 *
 * ## 为什么需要这个文件
 *
 * `BirthInfo.longitude` 在 `types.ts` 里被标注为「出生地经度（用于真太阳时校正）」，
 * 但 `generateChart`（`lib/ziwei/algorithm.ts`）只解构 `{ year, month, day, hour, gender }`，
 * 从不读 `longitude`。结果：库使用者若自己调 `generateChart` 并填了经度，
 * 时辰仍按原始钟表时间取，**静默无任何提示**。
 *
 * ## 关键约束：hour 是时辰支索引，不是钟表小时
 *
 * `BirthInfo.hour` 是 0–11 的**时辰支索引**（0=子、1=丑、…、11=亥），不是钟表小时。
 * `generateChart` 因此永远拿不到原始钟点，无法自行推算真太阳时。
 * 原始钟点只保存在 `BirthInfo.origInput`（可选字段）里，或由调用方显式传入。
 *
 * 这正是 `generateChart` 无法「顺手」修好的原因，也是本文件存在的原因：
 * 把「知道原始钟点」的职责交给调用方，用一个显式入口来承接。
 * 本文件**不修改** `generateChart` 的既有行为（默认开启校正属于破坏性变更）。
 *
 * ## 口径：与 Web 表单路径完全同一条路
 *
 * 本入口的换算逻辑与 `share.ts` 的 `formToBirthInfo` **逐行同构**，只复用
 * `true-solar-time.ts` 的三个现成函数，不另写任何公式：
 *
 *   solar     = calculateTrueSolarTime(钟点 + 经度 + 时区偏移)
 *   dayOffset = resolveZiweiDayOffset(solar, lateZishi)
 *   排盘日     = shiftGregorianDate(出生日, dayOffset)（dateValid 时）
 *   时辰支     = solar.branch
 *
 * 晚子时（真太阳时 23:00–23:59）是否换日由 `resolveZiweiDayOffset` 按
 * **真太阳时**判定，与时辰支同一口径——这是 #63 合入后的引擎规格，
 * 也是线上排盘的默认口径。注意：README 数据集章节里「23:00–23:59 按次日
 * 排盘」那句只适用于经度固定 120°、不做校正的样本集，不能当引擎规格用。
 *
 * 回归测试 `chart-entry.test.ts` 钉住这一点：同一出生输入，
 * 本入口与 `formToBirthInfo` 的排盘日、时辰支必须一致。
 *
 * ## 海外出生地：utcOffsetMinutes
 *
 * `BirthInfo` 上没有时区字段。海外出生地的钟表读数所属时区，
 * 通过 `clock.utcOffsetMinutes` 或 `opts.utcOffsetMinutes` 显式传入并透传给
 * `calculateTrueSolarTime`；不传时引擎按东八区（480）计算，与既有行为一致。
 * 与引擎既有口径一致：这里只接受**标准时间**偏移，不处理夏令时——
 * 若手头是夏令时的钟表读数，先用 `clock-adjust.ts` 换成标准时间再传进来。
 */

import { generateChart, type LunarMonthPolicy } from './algorithm';
import {
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  shiftGregorianDate,
  type LateZishiRule,
} from './true-solar-time';
import type { BirthInfo, ZiweiChart } from './types';

export interface TrueSolarChartOptions {
  /**
   * 晚子时换日流派，透传给 `resolveZiweiDayOffset`。
   * - `next-day`（默认）：真太阳时 23:00–23:59 按次日排盘（主流口径，与表单路径一致）
   * - `current-day`：晚子时仍按当日排盘
   * 其余两个值是八字口径，紫微主盘不采用，仅在需要与八字对齐时传入。
   */
  lateZishi?: LateZishiRule;
  /** 闰月流派口径，直接透传给 `generateChart`。 */
  leapMonth?: LunarMonthPolicy;
  /**
   * 钟表读数所在时区的标准偏移（分钟，东正西负），如纽约标准时间 -300。
   * `clock.utcOffsetMinutes` 的优先级高于此项；两者都不传时按东八区（480）计算。
   */
  utcOffsetMinutes?: number;
}

/**
 * 已知出生钟点时的排盘输入。
 * `clockHour/clockMinute` 是**钟表读数**（0–23 / 0–59），与时辰支索引无关。
 */
export interface ClockBirthInput {
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  /** 该钟表读数所在时区的标准偏移（分钟，东正西负）；不传则用 opts 的值，再不传按东八区。 */
  utcOffsetMinutes?: number;
}

function isValidClock(hour: number, minute: number): boolean {
  return Number.isInteger(hour) && Number.isInteger(minute)
    && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * 从 `BirthInfo` 里取出原始钟点。
 *
 * 数据来源：`birthInfo.origInput`（表单路径会自动填）。
 * 没有时返回 null —— 此时无法做真太阳时校正，调用方会拿到未修正的盘。
 */
export function extractClock(birthInfo: BirthInfo): ClockBirthInput | null {
  const oi = birthInfo.origInput;
  if (oi && isValidClock(oi.clockHour, oi.clockMinute)) {
    return {
      year: oi.year,
      month: oi.month,
      day: oi.day,
      clockHour: oi.clockHour,
      clockMinute: oi.clockMinute,
    };
  }
  return null;
}

/**
 * 把「原始出生输入 + 经度」转换成「已按真太阳时校正的 BirthInfo」。
 *
 * 返回的 `BirthInfo` 可以直接喂给 `generateChart`。
 * 换算路径与 `formToBirthInfo` 完全一致（见文件头说明）：
 * 真太阳时跨日（`dayOffset`，含晚子时换日）会反映到排盘日，时辰支取真太阳时支。
 *
 * @param birthInfo 原始输入。`year/month/day` 视为**用户填的公历生日**（未换日）。
 * @param clock 已知钟点时的原始钟表读数；不传则尝试从 `birthInfo.origInput` 取。
 * @param opts.lateZishi 晚子时换日流派，默认 `next-day`（与表单路径一致）。
 * @param opts.utcOffsetMinutes 钟表读数所在时区的标准偏移；`clock` 上同名字段优先。
 *
 * @throws 当传了 `clock` 但它不合法（小时不在 0–23、分钟不在 0–59）时抛出。
 */
export function resolveTrueSolarBirthInfo(
  birthInfo: BirthInfo,
  clock?: ClockBirthInput,
  opts: TrueSolarChartOptions = {},
): BirthInfo {
  const src = clock ?? extractClock(birthInfo);

  // 没有钟点 → 无法校正 → 原样返回，但把经度带上，
  // 让下游（若自行调用 true-solar-time）仍有机会处理。
  if (!src) {
    return birthInfo;
  }
  if (!isValidClock(src.clockHour, src.clockMinute)) {
    throw new RangeError(
      `clock must be valid clock time; received ${src.clockHour}:${src.clockMinute}`,
    );
  }

  const longitude = birthInfo.longitude;
  const hasLongitude = longitude !== undefined && Number.isFinite(longitude);

  // 与 formToBirthInfo 同一条路：真太阳时 → 时辰支 + 换日偏移 → 排盘日。
  const solar = calculateTrueSolarTime({
    year: src.year,
    month: src.month,
    day: src.day,
    clockHour: src.clockHour,
    clockMinute: src.clockMinute,
    longitude: hasLongitude ? longitude : undefined,
    utcOffsetMinutes: src.utcOffsetMinutes ?? opts.utcOffsetMinutes,
  });

  const dayOffset = resolveZiweiDayOffset(solar, opts.lateZishi ?? 'next-day');
  const chartDate = dayOffset !== 0 && solar.dateValid
    ? shiftGregorianDate({ year: src.year, month: src.month, day: src.day }, dayOffset)
    : { year: src.year, month: src.month, day: src.day };

  return {
    ...birthInfo,
    year: chartDate.year,
    month: chartDate.month,
    day: chartDate.day,
    hour: solar.branch,
  };
}

/**
 * 真太阳时排盘入口 —— 已知出生钟点时使用。
 *
 * @param birthInfo 原始输入。`year/month/day` 视为用户填的公历生日（未换日）。
 * @param clock 已知钟点时的原始钟表读数；不传则尝试从 `birthInfo.origInput` 取。
 * @param opts.lateZishi 晚子时换日流派，默认 `next-day`。
 *
 * 行为：
 *  - 无经度且无钟点 → 与直接调 `generateChart` 完全一致（零回归）。
 *  - 有经度且有钟点 → 按真太阳时校正排盘日与时辰支，与表单路径结果一致。
 */
export function generateTrueSolarChart(
  birthInfo: BirthInfo,
  clock?: ClockBirthInput,
  opts: TrueSolarChartOptions = {},
): ZiweiChart {
  const resolved = resolveTrueSolarBirthInfo(birthInfo, clock, opts);
  return generateChart(resolved, { leapMonth: opts.leapMonth });
}
