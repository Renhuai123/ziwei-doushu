/**
 * 四化工具模块 — 年干 / 大限宫干 / 流年干 / 流月干 / 流日干 / 流时干
 *                + 宫干自化检测 + 来因宫追溯
 *
 * 排盘口径（2026-07-21 铁律：排盘以金标准盘为准）：
 *   本命四化 = 出生年天干四化（盘上朱红印章，始终显示）
 *   运限四化 = 大限宫干 / 流年干 / 流月干 / 流日干 / 流时干 → 叠层色章
 * 论断正文仍按倪师；本模块供排盘叠层使用。
 */

import { Lunar } from 'lunar-javascript';
import type { ZiweiChart, Palace, SiHua } from './types';
import { SI_HUA_TABLE, STEMS } from './constants';
import { CHILDHOOD_DAXIAN_INDEX, getChildhoodDaXianPalace } from './yunxian-context';

// ─── 1) 由天干索引取四化四星 ───────────────────────────────────
/** 天干索引 0-9 → { 禄, 权, 科, 忌 } 对应星名 */
export function getSiHuaByStem(stemIndex: number): Record<SiHua, string> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return { 禄: '', 权: '', 科: '', 忌: '' };
  return { 禄: arr[0], 权: arr[1], 科: arr[2], 忌: arr[3] };
}

/** 星名 → 四化类型（由某天干确定） */
export function buildStarSiHuaMap(stemIndex: number): Record<string, SiHua> {
  const arr = SI_HUA_TABLE[stemIndex];
  if (!arr) return {};
  return { [arr[0]]: '禄', [arr[1]]: '权', [arr[2]]: '科', [arr[3]]: '忌' };
}

// ─── 2) 公历年 → 年柱天干索引 ──────────────────────────────────
/** 公历年份 → 年柱天干索引（0=甲, ... 9=癸） */
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/** 公历年份 → 年柱地支索引（0=子, ... 11=亥） */
export function getYearBranchIndex(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

// ─── 3) 大限四化：取大限宫的宫干（非本命年干）───────────────
/**
 * 大限宫干四化
 * @param chart 命盘
 * @param dxIndex 大限索引（chart.daXians[dxIndex]）；童限传 CHILDHOOD_DAXIAN_INDEX
 * @returns 该大限的四化四星
 */
export function getDaXianSiHua(
  chart: ZiweiChart,
  dxIndex: number,
  year?: number,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  const dxPalace = dxIndex === CHILDHOOD_DAXIAN_INDEX
    ? getChildhoodDaXianPalace(chart, year)
    : (() => {
        const dx = chart.daXians[dxIndex];
        if (!dx) return null;
        return chart.palaces.find(p => p.branch === dx.palaceBranch) ?? null;
      })();
  if (!dxPalace) return null;
  const stemIndex = dxPalace.stem;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 4) 流年四化 ──────────────────────────────────────────────
export function getLiuNianSiHua(year: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  const stemIndex = getYearStemIndex(year);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 5) 流月四化（月柱天干，由年干 + 月序推） ───────────────
/**
 * 流月天干（五虎遁：甲己年起丙寅、乙庚年起戊寅、丙辛年起庚寅、丁壬年起壬寅、戊癸年起甲寅）
 * month: 农历月 1-12
 */
export function getLiuYueStemIndex(yearStem: number, month: number): number {
  // 五虎遁：正月（寅月）天干
  const startStemOfYin: Record<number, number> = {
    0: 2, 5: 2,  // 甲己 → 丙
    1: 4, 6: 4,  // 乙庚 → 戊
    2: 6, 7: 6,  // 丙辛 → 庚
    3: 8, 8: 8,  // 丁壬 → 壬
    4: 0, 9: 0,  // 戊癸 → 甲
  };
  const yinStem = startStemOfYin[yearStem] ?? 0;
  // 从寅（正月）到目标月（month 取 1-12）
  return (yinStem + ((month - 1) % 12) + 10) % 10;
}

export interface LiuYueSiHuaOptions {
  /** 闰月流月按实际农历日的前后半月取本月/下月口径。 */
  isLeapMonth?: boolean;
  liuriDay?: number;
  /** 闰十二月后半段跨到次年正月时使用的年干。 */
  nextYearStem?: number;
}

export function getEffectiveLiuYueMonth(month: number, options: LiuYueSiHuaOptions = {}): number {
  const normalizedMonth = Math.max(1, Math.min(12, Math.trunc(month)));
  if (!options.isLeapMonth || (options.liuriDay ?? 1) <= 15) return normalizedMonth;
  return normalizedMonth >= 12 ? 1 : normalizedMonth + 1;
}

export function getLiuYueSiHua(yearStem: number, month: number, options: LiuYueSiHuaOptions = {}): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
  month: number;
} {
  const effectiveMonth = getEffectiveLiuYueMonth(month, options);
  const sourceYearStem = options.isLeapMonth
    && effectiveMonth === 1
    && (options.liuriDay ?? 1) > 15
    ? (options.nextYearStem ?? yearStem)
    : yearStem;
  const stemIndex = getLiuYueStemIndex(sourceYearStem, effectiveMonth);
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
    month: effectiveMonth,
  };
}

// ─── 5b) 流日四化（农历日柱天干）──────────────────────────────
/**
 * 流日天干四化：用农历年月日取日柱干（通行口径「显示日干四化」）。
 * 闰月传 isLeapMonth=true（lunar-javascript 以负月表示闰月）。
 */
export function getLiuRiSiHua(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false,
): { stemIndex: number; stemName: string; transforms: Record<SiHua, string> } | null {
  try {
    const monthKey = isLeapMonth ? -Math.abs(lunarMonth) : Math.abs(lunarMonth);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lunar = (Lunar as any).fromYmd(lunarYear, monthKey, lunarDay) as { getDayGan(): string };
    const stemIndex = STEMS.indexOf(lunar.getDayGan());
    if (stemIndex < 0) return null;
    return {
      stemIndex,
      stemName: STEMS[stemIndex] ?? '',
      transforms: getSiHuaByStem(stemIndex),
    };
  } catch {
    return null;
  }
}

// ─── 5c) 流时四化（五鼠遁：日干起子时天干）───────────────────
/** 时支 0=子…11=亥；日干推时干后取四化 */
export function getLiuShiSiHua(dayStemIndex: number, hourBranch: number): {
  stemIndex: number;
  stemName: string;
  transforms: Record<SiHua, string>;
} {
  // 甲己→甲子，乙庚→丙子，丙辛→戊子，丁壬→庚子，戊癸→壬子
  const ziStemByDayStem: Record<number, number> = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const branch = ((Math.trunc(hourBranch) % 12) + 12) % 12;
  const stemIndex = ((ziStemByDayStem[dayStemIndex] ?? 0) + branch) % 10;
  return {
    stemIndex,
    stemName: STEMS[stemIndex] ?? '',
    transforms: getSiHuaByStem(stemIndex),
  };
}

// ─── 6) 宫干自化检测 ──────────────────────────────────────────
/**
 * 自化：该宫宫干引发的四化，被化星恰在本宫
 * e.g. 宫干为甲（廉破武阳），如果本宫主星含"廉贞"，则该宫有"自化禄"
 */
export interface SelfSihua {
  siHua: SiHua;        // 禄/权/科/忌
  starName: string;    // 被化的星
}

export function detectSelfSihua(palace: Palace): SelfSihua[] {
  const transforms = getSiHuaByStem(palace.stem);
  const found: SelfSihua[] = [];
  const palaceStarNames = new Set(palace.stars.map(s => s.name));
  (['禄', '权', '科', '忌'] as SiHua[]).forEach(sh => {
    const starName = transforms[sh];
    if (starName && palaceStarNames.has(starName)) {
      found.push({ siHua: sh, starName });
    }
  });
  return found;
}

// ─── 7) 来因宫追溯 ────────────────────────────────────────────
/**
 * 来因宫：对某颗星某种化，追溯是哪个宫的宫干"飞"过来的
 *
 * 倪师体系常用：化忌的来因宫——化忌由哪个宫位的"宫干"引发，那个宫位就是问题的根源宫位
 *
 * @param chart 命盘
 * @param starName 被化的星名（如 "太阴"）
 * @param sihua  四化类型（如 "忌"）
 * @returns 引发该化的宫位数组（通常只有一个，但若多宫宫干相同可能多个）
 */
export function findIncomingPalaces(
  chart: ZiweiChart,
  starName: string,
  sihua: SiHua,
): Palace[] {
  const result: Palace[] = [];
  chart.palaces.forEach(p => {
    const transforms = getSiHuaByStem(p.stem);
    if (transforms[sihua] === starName) {
      result.push(p);
    }
  });
  return result;
}

/**
 * 批量计算盘面所有宫位的自化列表
 */
export function buildAllSelfSihua(chart: ZiweiChart): Record<number, SelfSihua[]> {
  const result: Record<number, SelfSihua[]> = {};
  chart.palaces.forEach(p => {
    const list = detectSelfSihua(p);
    if (list.length > 0) result[p.branch] = list;
  });
  return result;
}

// ─── 8) 综合覆盖（overlay）：多个四化层叠加后的效果 ──────────
/**
 * 生成某星名 → 多层四化的合成视图
 * 用于在宫位上同时显示：本命化 / 大限化 / 流年化
 * 优先级：本命 < 大限 < 流年（但都标出来）
 */
export interface SiHuaOverlay {
  native?: SiHua;    // 本命（年干）
  daXian?: SiHua;    // 大限
  liuNian?: SiHua;   // 流年
  liuYue?: SiHua;    // 流月
}

export function buildOverlayForStar(
  starName: string,
  nativeMap: Record<string, SiHua>,
  daXianMap?: Record<string, SiHua>,
  liuNianMap?: Record<string, SiHua>,
  liuYueMap?: Record<string, SiHua>,
): SiHuaOverlay {
  return {
    native: nativeMap[starName],
    daXian: daXianMap?.[starName],
    liuNian: liuNianMap?.[starName],
    liuYue: liuYueMap?.[starName],
  };
}
