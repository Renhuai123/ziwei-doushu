import type { Palace, ZiweiChart } from './types';

export type YunxianView = 'mingpan' | 'daxian' | 'liunian' | 'xiaoxian' | 'liuyue' | 'liuri' | 'liushi';

/** 独立童限选择的专用 sentinel；-1 保留给“没有所属实际大限”。 */
export const CHILDHOOD_DAXIAN_INDEX = -2;

// 小限与流年一样按所选流年（虚岁）定所属大限，故同归 FLOW_VIEWS。
const FLOW_VIEWS = new Set<YunxianView>(['liunian', 'xiaoxian', 'liuyue', 'liuri', 'liushi']);

function isValidDaXianIndex(chart: ZiweiChart, index: number | null | undefined): index is number {
  return typeof index === 'number'
    && Number.isInteger(index)
    && index >= 0
    && index < chart.daXians.length;
}

/** 按虚岁查所属大限。大限年龄区间按首尾均包含处理。 */
export function getDaXianIndexForAge(chart: ZiweiChart, age: number): number {
  if (!Number.isFinite(age)) return -1;
  const safeAge = Math.trunc(age);
  return chart.daXians.findIndex(dx => safeAge >= dx.startAge && safeAge <= dx.endAge);
}

/** 农历流年换算虚岁后查所属大限。 */
export function getDaXianIndexForYear(chart: ZiweiChart, year: number): number {
  if (!Number.isFinite(year)) return -1;
  // UI 的 liunianYear 是农历流年。春节前出生者的农历生年可能比公历小 1，
  // 虚岁必须用农历年差，否则整组大限边界会晚一年。
  return getDaXianIndexForAge(chart, Math.trunc(year) - chart.lunarInfo.lunarYear + 1);
}

/** 大限起始虚岁换算为对应农历流年。 */
export function getDaXianStartYear(chart: ZiweiChart, index: number): number | null {
  if (!isValidDaXianIndex(chart, index)) return null;
  return chart.lunarInfo.lunarYear + chart.daXians[index].startAge - 1;
}

/** 返回该大限完整对应的公历流年；正常大限恰好十年。 */
export function getDaXianYears(chart: ZiweiChart, index: number): number[] {
  if (!isValidDaXianIndex(chart, index)) return [];
  const dx = chart.daXians[index];
  const startYear = getDaXianStartYear(chart, index);
  if (startYear === null) return [];
  return Array.from({ length: dx.endAge - dx.startAge + 1 }, (_, offset) => startYear + offset);
}

/** 主流排盘口径把第一实际大限之前的 1..起限-1 虚岁作为独立童限。 */
export function getChildhoodYears(chart: ZiweiChart): number[] {
  const firstStartAge = chart.daXians[0]?.startAge;
  if (!Number.isFinite(firstStartAge) || firstStartAge <= 1) return [];
  return Array.from({ length: firstStartAge - 1 }, (_, offset) => chart.lunarInfo.lunarYear + offset);
}

export function isChildhoodYear(chart: ZiweiChart, year: number): boolean {
  const age = Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
  const firstStartAge = chart.daXians[0]?.startAge;
  return Number.isFinite(firstStartAge) && age >= 1 && age < firstStartAge;
}

/**
 * 童限大命相对本命命宫的地支偏移（虚岁 1–5）。
 * 与四张金标准盘逐年宫底「大命」同一套：虚岁1=本命命宫，其后 −4/−1/+3/+4。
 * 阳男亥→未→午→酉；阴男亥→未；阳女亥→未→午→酉→丑；立春阴女未→卯→寅→巳→酉。
 */
const CHILDHOOD_MING_OFFSET: Record<number, number> = {
  1: 0,
  2: -4,
  3: -5,
  4: -2,
  5: 2,
};

/**
 * 童限大命所在本命宫（用来取宫干，再走 getSiHuaByStem / 大昌大曲）。
 * 有农历流年且虚岁 1–5：按 CHILDHOOD_MING_OFFSET 走宫。
 * 无年或表外年：阴女回退命宫−2（保住已锁 2026=巳），其余取本命命宫。
 */
export function getChildhoodDaXianPalace(chart: ZiweiChart, year?: number): Palace | null {
  if (getChildhoodYears(chart).length === 0) return null;
  if (year != null) {
    const age = Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
    if (age in CHILDHOOD_MING_OFFSET) {
      const branch = ((chart.mingGongBranch + CHILDHOOD_MING_OFFSET[age]) % 12 + 12) % 12;
      return chart.palaces.find((p) => p.branch === branch) ?? null;
    }
  }
  const yinFemale = chart.yinYangGender === '阴女'
    || (chart.birthInfo.gender === 'female' && chart.lunarInfo.yearStem % 2 === 1);
  const branch = yinFemale
    ? ((chart.mingGongBranch - 2) % 12 + 12) % 12
    : chart.mingGongBranch;
  return chart.palaces.find((p) => p.branch === branch) ?? null;
}

/**
 * 所有运限界面共用的大限来源：
 * - 大限视图使用用户点选的大限；
 * - 流年、流月、流日、流时使用所选流年实际所属的大限；
 * - 本命或异常输入回退现实当前大限。
 */
export function resolveEffectiveDaXianIndex(
  chart: ZiweiChart,
  view: YunxianView,
  liunianYear: number,
  selectedDaXianIndex?: number | null,
): number {
  if (view === 'daxian' && isValidDaXianIndex(chart, selectedDaXianIndex)) {
    return selectedDaXianIndex;
  }
  if (view === 'daxian' && selectedDaXianIndex === CHILDHOOD_DAXIAN_INDEX && getChildhoodYears(chart).length > 0) {
    return CHILDHOOD_DAXIAN_INDEX;
  }

  if (FLOW_VIEWS.has(view)) {
    const yearIndex = getDaXianIndexForYear(chart, liunianYear);
    // -1 表示童限或超出已生成的大限范围；不能错误回退到现实当前大限。
    return isValidDaXianIndex(chart, yearIndex) ? yearIndex : -1;
  }

  if (isValidDaXianIndex(chart, chart.currentDaXianIndex)) return chart.currentDaXianIndex;
  // 真实童限时 currentDaXianIndex=-1；不能为了有值而误套第一个实际大限。
  return -1;
}
