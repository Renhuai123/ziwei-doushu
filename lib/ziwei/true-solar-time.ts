/**
 * 真太阳时统一计算。
 *
 * 口径：地方真太阳时 = 钟表时间 + 经度修正 + 均时差；经度修正 =（出生地经度 − 钟表时区中央经线）× 4 分钟。
 * 国内一律按东八区（中央经线 120°）。★ 2026-10-31 同步上游：海外出生地传 utcOffsetMinutes
 * （出生地时区的固定标准偏移），与主流排盘口径一致——不处理夏令时与历史时区；
 * 用户填的若是当年钟表读数，先用 clock-adjust.ts 换成标准时间再传进来。
 * 均时差采用 NOAA 的 fractional-year 近似式，1900-2026 年范围内足以稳定
 * 判断紫微斗数的两小时时辰边界。
 *
 * 参考：https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export type LateZishiRule = 'next-day' | 'current-day' | 'all-current' | 'day-cur-time-next';

export interface TrueSolarTimeInput extends GregorianDate {
  clockHour: number;
  clockMinute: number;
  /** 未提供经度时保持原钟表时间，不做真太阳时校正。 */
  longitude?: number;
  /** 钟表时间所在时区的标准偏移（分钟，东正西负）；不传 = 北京时间 480（国内、老数据） */
  utcOffsetMinutes?: number;
}

export interface TrueSolarTimeResult {
  dateValid: boolean;
  corrected: boolean;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  totalCorrectionMinutes: number;
  rawMinutes: number;
  normalizedMinutes: number;
  dayOffset: number;
  hour: number;
  minute: number;
  second: number;
  branch: number;
}

const MINUTES_PER_DAY = 1440;
const SECONDS_PER_DAY = 86400;
const mod = (value: number, base: number) => ((value % base) + base) % base;

export function isValidGregorianDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function shiftGregorianDate(date: GregorianDate, dayOffset: number): GregorianDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function sameGregorianDate(a: GregorianDate, b: GregorianDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function dayOfYear(year: number, month: number, day: number): number {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
}

/** NOAA 均时差近似值，返回分钟；正值表示真太阳时快于平太阳时。 */
export function equationOfTimeMinutes(
  year: number,
  month: number,
  day: number,
  clockHour = 12,
  clockMinute = 0,
): number {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const fractionalHour = clockHour + clockMinute / 60;
  const gamma = (2 * Math.PI / daysInYear)
    * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

export function branchFromSolarMinutes(normalizedMinutes: number): number {
  if (normalizedMinutes >= 1380 || normalizedMinutes < 60) return 0;
  return Math.floor((normalizedMinutes - 60) / 120) + 1;
}

export function calculateTrueSolarTime(input: TrueSolarTimeInput): TrueSolarTimeResult {
  const dateValid = isValidGregorianDate(input.year, input.month, input.day);
  const corrected = input.longitude !== undefined && Number.isFinite(input.longitude);
  // 中央经线 = 时区偏移 / 4（480 分钟 → 120°）；国内仍是原式 (经度 − 120) × 4，结果逐位不变
  const meridian = input.utcOffsetMinutes !== undefined && Number.isFinite(input.utcOffsetMinutes) ? input.utcOffsetMinutes / 4 : 120;
  const longitudeCorrectionMinutes = corrected ? (input.longitude! - meridian) * 4 : 0;
  const eot = corrected && dateValid
    ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute)
    : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = input.clockHour * 60 + input.clockMinute + totalCorrectionMinutes;

  // 页面输入精度为分钟；显示和时辰边界统一按最近一秒，避免浮点毛刺。
  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
  const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor((secondOfDay % 3600) / 60);
  const second = secondOfDay % 60;
  const normalizedMinutes = secondOfDay / 60;

  return {
    dateValid,
    corrected,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: eot,
    totalCorrectionMinutes,
    rawMinutes,
    normalizedMinutes,
    dayOffset,
    hour,
    minute,
    second,
    branch: branchFromSolarMinutes(normalizedMinutes),
  };
}

/** 把真太阳日与晚子时流派规则合并成最终排盘日相对输入日的偏移。 */
export function resolveZiweiDayOffset(
  solar: Pick<TrueSolarTimeResult, 'dayOffset' | 'normalizedMinutes' | 'branch'>,
  lateZishi: LateZishiRule = 'next-day',
): number {
  // day-cur-time-next changes the hour-pillar convention, not the Ziwei
  // main-chart date. Only the explicit next-day rule advances this date.
  const nextDayRule = lateZishi === 'next-day';
  const isLateZishi = solar.branch === 0 && solar.normalizedMinutes >= 1380;

  if (solar.dayOffset < 0 && isLateZishi) {
    return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
  }
  if (solar.dayOffset !== 0) return solar.dayOffset;
  if (isLateZishi) return nextDayRule ? 1 : 0;
  return 0;
}

/**
 * 晚子时换日 —— **按出生地钟表时间判定**（2026-10-31 新增，全局唯一口径）
 *
 * ── 依据（上游 README 第 196 行原文）─────────────────────────────
 *   「23:00–23:59 出生（晚子时）按次日排盘、时辰取 0；
 *     00:00–00:59 出生（早子时）按当日排盘、时辰同样取 0。」
 *
 * ── 为什么不能用真太阳时判定（这是本轮实测纠正的坑）────────────
 *   `resolveZiweiDayOffset()` 是按**真太阳时**是否 ≥ 23:00 来判晚子时的。
 *   但真太阳时 = 钟表 + 经度差 + 均时差，经度偏西的城市**永远到不了 23:00**：
 *     经度 87.6°（乌鲁木齐）→ 钟表 23:00 → 真太阳时 20:44 → 判为戌时，不换日
 *     经度 113.4°（中山）  → 钟表 23:00 → 真太阳时 22:27 → 判为亥时，不换日
 *     经度 121.5°（台北）  → 钟表 23:00 → 真太阳时 23:00 → 判为子时，换日 ✅
 *   即：**中国大陆绝大部分地区 23 点出生都不会被认作晚子时**，
 *   与上游规格、与传统命理口径都不符。
 *
 * ── 两件事必须分开（关键）────────────────────────────────────────
 *   · **是否晚子时 / 日期怎么换** → 看**钟表** 23:00–23:59（本地钟点）
 *   · **时辰支是几**           → 看**真太阳时**（经度差 + 均时差）
 *   两者独立：中山 23:30 出生 → 日期按次日排，但真太阳时 22:34 落在亥时，
 *   那么时辰支该取 0（子）还是 11（亥）？见 `resolveZishiHour()` 的说明。
 *
 * ── 与 school-config 的 lateZishi 流派选项的关系 ─────────────────
 *   本函数只负责「晚子时**是否**发生 + 换几天」，
 *   具体换 0 天还是 1 天由调用方按 `lateZishi` 流派选项决定
 *   （'next-day' 主流默认 / 'current-day' 倪师派 / 其余两种是八字口径）。
 */
export interface LateZishiDecision {
  /** 是否为晚子时（钟表 23:00–23:59） */
  isLateZishi: boolean;
  /** 是否为早子时（钟表 00:00–00:59） */
  isEarlyZishi: boolean;
  /** 建议的排盘日偏移天数（'next-day' 口径下晚子时为 +1） */
  dayOffset: number;
  /** 排盘日（已应用偏移） */
  year: number; month: number; day: number;
}

/**
 * 按钟表时间判定早/晚子时，并给出排盘日。
 *
 * @param lateZishi 流派口径，决定晚子时换不换日
 */
export function resolveLateZishi(
  date: { year: number; month: number; day: number },
  clockHour: number,
  clockMinute: number,
  lateZishi: LateZishiRule = 'next-day',
): LateZishiDecision {
  const isLate = clockHour === 23;
  const isEarly = clockHour === 0;
  let dayOffset = 0;
  if (isLate) {
    // 'next-day' / 'day-cur-time-next' → 排盘日进位；'current-day' / 'all-current' → 不进位
    dayOffset = (lateZishi === 'next-day' || lateZishi === 'day-cur-time-next') ? 1 : 0;
  }
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    isLateZishi: isLate,
    isEarlyZishi: isEarly,
    dayOffset,
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function formatTrueSolarClock(solar: Pick<TrueSolarTimeResult, 'hour' | 'minute' | 'second'>, withSeconds = false): string {
  const base = `${String(solar.hour).padStart(2, '0')}:${String(solar.minute).padStart(2, '0')}`;
  return withSeconds ? `${base}:${String(solar.second).padStart(2, '0')}` : base;
}

export function formatSignedMinutes(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}
