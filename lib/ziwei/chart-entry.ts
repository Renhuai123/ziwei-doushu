/**
 * 真太阳时排盘入口 —— 给直接调用 `generateChart` 的库使用者。
 *
 * ## 为什么需要这个文件
 *
 * `BirthInfo.longitude` 在 `types.ts` 里被标注为「出生地经度（用于真太阳时校正）」，
 * 但 `generateChart`（`lib/ziwei/algorithm.ts`）只解构 `{ year, month, day, hour, gender }`，
 * 从不读 `longitude`；`true-solar-time.ts` 里的完整实现（`calculateTrueSolarTime`、
 * `resolveZiweiDayOffset`、NOAA 均时差）也没有被仓库内任何模块 import。
 *
 * 结果：库使用者若自己调 `generateChart` 并填了经度，时辰仍按原始钟表时间取，
 * **静默无任何提示**。Web 应用路径之所以能修正，是因为 `share.ts` 在调 `generateChart`
 * 之前自己先算了一遍真太阳时——这造成了「同一个引擎、两套真太阳时实现」，
 * 两者在时辰边界附近可能给出不同结果（一条算均时差，另一条不算）。
 *
 * ## 关键约束：hour 是时辰支索引，不是钟表小时
 *
 * `BirthInfo.hour` 是 0–11 的**时辰支索引**（0=子、1=丑、…、11=亥），不是钟表小时。
 * `generateChart` 因此永远拿不到原始钟点，无法自行推算真太阳时。
 * 原始钟点只保存在 `BirthInfo.origInput`（可选字段）里。
 *
 * 这正是 `generateChart` 无法「顺手」修好的原因，也是本文件存在的原因：
 * 把「知道原始钟点」的职责交给调用方，用一个显式入口来承接。
 *
 * ## 设计取向：不改 `generateChart` 的既有行为
 *
 * 本文件**不修改** `generateChart`。理由：
 *  1. 让 `generateChart` 默认开始做真太阳时校正，会改变所有既有调用者的排盘结果，
 *     属于破坏性变更（issue #45 的作者也明确要求 gate）。
 *  2. `generateChart` 只拿到时辰支索引，无法在不引入新输入的前提下推断钟点。
 *
 * 取而代之，提供两个新入口：
 *  - `generateTrueSolarChart(birthInfo, opts)` —— 已知钟点时用这个。传入 `origInput`
 *    或显式 `clockHour/clockMinute`，返回按真太阳时校正过的盘。
 *  - `resolveTrueSolarBirthInfo(birthInfo, opts)` —— 只做「原始输入 → 校正后的
 *    `BirthInfo`」这一步转换，之后你仍可自由调用 `generateChart` 或任何其他消费方。
 *
 * ## 零回归保证
 *
 * **不传经度时，输出与 `generateChart` 逐字节一致。** 回归测试 `chart-entry.test.ts`
 * 对此有 golden-hash 断言覆盖：不传 longitude / 不传 origInput 时，
 * 排盘日、时辰支、十二宫主星、生年四化与直接调 `generateChart` 完全相同。
 *
 * ## 晚子时口径
 *
 * 沿用仓库既有规格（README 第 209 行原文）：
 * 「23:00–23:59 出生（晚子时）按次日排盘、时辰取 0；
 *   00:00–00:59 出生（早子时）按当日排盘、时辰同样取 0。」
 *
 * 三件事必须分开看：
 *  - **是否晚子时 / 日期怎么换** → 看**钟表** 23:00–23:59（与经度无关）
 *  - **早/晚子时的时辰支**   → 规格显式指定取 **0**
 *  - **其余时段的时辰支**     → 看**真太阳时**（经度差 + 均时差）
 *
 * 例：香港 23:00 出生 → 按钟表属晚子时 → 排盘日进位到次日，时辰取 0（子）。
 * 同一时刻真太阳时为 22:34（亥），但规格对晚子时显式取 0，故以规格为准。
 */

import { generateChart, type LunarMonthPolicy } from './algorithm';
import { calculateTrueSolarTime, resolveLateZishi, type LateZishiRule } from './true-solar-time';
import type { BirthInfo, ZiweiChart } from './types';

export interface TrueSolarChartOptions {
  /**
   * 晚子时换日流派。
   * - `next-day`（默认）：23:00–23:59 出生按次日排盘（主流口径）
   * - `current-day`：23:00–23:59 出生仍按当日排盘
   * 其余两个值是八字口径，紫微主盘不采用，仅在需要与八字对齐时传入。
   */
  lateZishi?: LateZishiRule;
  /** 闰月流派口径，直接透传给 `generateChart`。 */
  leapMonth?: LunarMonthPolicy;
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
}

function isValidClock(hour: number, minute: number): boolean {
  return Number.isInteger(hour) && Number.isInteger(minute)
    && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * 从 `BirthInfo` 里取出原始钟点。
 *
 * 取值优先级：
 *  1. `birthInfo.origInput.clockHour / clockMinute`（表单路径会自动填）
 *  2. 显式传入的 `clock`
 *
 * 两者都没有时返回 null —— 此时无法做真太阳时校正，调用方会拿到未修正的盘。
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
 *
 * @param birthInfo 原始输入。`year/month/day` 视为**用户填的公历生日**（未换日）。
 * @param clock 已知钟点时的原始钟表读数；不传则尝试从 `birthInfo.origInput` 取。
 * @param opts.lateZishi 晚子时换日流派，默认 `next-day`。
 *
 * @throws 当传了 `clock` 但它不合法（小时不在 0–23、分钟不在 0–59）时抛出。
 */
export function resolveTrueSolarBirthInfo(
  birthInfo: BirthInfo,
  clock?: ClockBirthInput,
  opts: TrueSolarChartOptions = {},
): BirthInfo {
  const lateZishi = opts.lateZishi ?? 'next-day';
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

  // 晚子时判定与换日按**钟表**，不受经度影响。
  const lz = resolveLateZishi(
    { year: src.year, month: src.month, day: src.day },
    src.clockHour,
    src.clockMinute,
    lateZishi,
  );

  // 时辰支取几看**真太阳时**；但早/晚子时是规格特例，一律取 0。
  //
  // README 第 209 行规格原文：
  //   「23:00–23:59 出生（晚子时）按次日排盘、时辰取 0；
  //     00:00–00:59 出生（早子时）按当日排盘、时辰同样取 0。」
  //
  // 即：规格对早/晚子时**显式指定时辰取 0**，覆盖真太阳时算出的支。
  // 例：香港 23:00 出生，真太阳时 22:34 落在亥(11)，但按规格仍取子(0)。
  const solar = calculateTrueSolarTime({
    year: src.year,
    month: src.month,
    day: src.day,
    clockHour: src.clockHour,
    clockMinute: src.clockMinute,
    longitude: hasLongitude ? longitude : undefined,
    utcOffsetMinutes: (birthInfo as BirthInfo & { utcOffsetMinutes?: number }).utcOffsetMinutes,
  });

  // 排盘日 = 晚子时换日后的日期（按钟表判定，不受经度影响）。
  const chartYear = lz.year;
  const chartMonth = lz.month;
  const chartDay = lz.day;

  // 早/晚子时 → 时辰取 0（规格特例）；其余时段 → 取真太阳时的时辰支。
  const chartHour = (lz.isLateZishi || lz.isEarlyZishi) ? 0 : solar.branch;

  return {
    ...birthInfo,
    year: chartYear,
    month: chartMonth,
    day: chartDay,
    hour: chartHour,
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
 *  - 有经度且有钟点 → 按真太阳时校正排盘日与时辰支。
 */
export function generateTrueSolarChart(
  birthInfo: BirthInfo,
  clock?: ClockBirthInput,
  opts: TrueSolarChartOptions = {},
): ZiweiChart {
  const resolved = resolveTrueSolarBirthInfo(birthInfo, clock, opts);
  return generateChart(resolved, { leapMonth: opts.leapMonth });
}
