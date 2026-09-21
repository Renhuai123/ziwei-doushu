/**
 * 紫微斗数排盘算法 — 基于 iztro 开源库
 * https://github.com/SylarLong/iztro
 */

import { astro } from 'iztro';
import { Solar, LunarMonth } from 'lunar-javascript';
import type { BirthInfo, LunarInfo, Star, Palace, DaXian, DaXianSiHua, ZiweiChart } from './types';
import { BRANCHES, STEMS } from './constants';
import { wenmoStarBrightness, type BrightnessSchool } from './wenmo-data';
import { WENMO_AX } from './wenmo-tables.generated';
import { DEFAULT_LEAP_MONTH } from './wenmo-config';
// 飞星派工具仅供导出，不再在排盘时调用（倪师《天纪 03》：四化星永远固定不动）
// import { detectSelfSihua, getSiHuaByStem } from './sihua';

// 紫微斗数主流派（中州派/全书派/文墨天机/测测）采用"正月初一换年"规则（农历年口径）。
// 例：1999/2/11 立春已过（立春=2/4），但春节(2/16)未到 → 仍属戊寅年腊月，非己卯年。
// 影响 iztro 内部排盘的五行局/命主/身主/四化/紫微定位 — 这是与文墨/测测对齐的关键。
//
// ★ 修正历史（2026-05-12）：
// 原配置 yearDivide:'exact'（立春换年）→ 改为 'normal'（正月初一换年）
// 原因：用户反馈与文墨天机/测测的盘"宫位一样、其他完全不一样"，
// 经诊断（scripts/diff-chart-vs-other.ts）确认根因是换年规则，主流派一律用农历年。
//
// ★ 星曜亮度修正（2026-05-08）
// iztro 默认亮度表与《紫微斗数全书》存在 24 处差异（14 主星 + 6 辅星），
// 已通过 config.brightness 全量覆写修正。
// 数组索引从寅起：0=寅 1=卯 2=辰 3=巳 4=午 5=未 6=申 7=酉 8=戌 9=亥 10=子 11=丑
// 交叉验证来源：紫微取象派全书解读、令东来庙旺表、iztro 官方文档、文墨天机(安星码 8GDPB)
// ★ 抽成具名常量（2026-06-11）：供 setBrightnessSchool('default') 显式还原，根治「切流派后全局亮度泄漏」。
//   必须完整覆盖全部 14 主星——流派表（wenmoBrightnessTableToIztroFormat）覆写 14 主星，
//   若此处缺某主星键，切流派后该星被污染却无键可盖回（实测：武曲/廉贞/巨门/破军 曾缺失）。
const DEFAULT_BRIGHTNESS: Record<string, string[]> = {
    //            寅     卯     辰     巳     午     未     申     酉     戌     亥     子     丑
    // ── 紫微系六星 ──────────────────────────────────────────
    // 紫微：寅宫 旺→庙（全书：庙于寅午丑未）
    '紫微': ['庙','旺','得','旺','庙','庙','旺','旺','得','旺','平','庙'],
    // 天机：辰宫 利→庙、戌宫 利→庙（依「天机庙于子午辰戌」通行庙旺总诀；善本《全书》天机条无逐宫原文，此句系后世总诀转述，非善本直证）
    '天机': ['得','旺','庙','平','庙','陷','得','旺','庙','平','庙','陷'],
    // 太阳：午宫 旺→庙（全书：庙于卯午）
    '太阳': ['旺','庙','旺','旺','庙','得','得','陷','不','陷','陷','不'],
    // 武曲：iztro 默认与全书一致 ✓
    // 天同：寅宫 利→旺（全书：旺于子寅申）、午宫 陷→不（全书：不得地于午丑未）
    '天同': ['旺','平','平','庙','不','不','旺','平','平','庙','旺','不'],
    // 廉贞：iztro 默认与全书一致 ✓

    // ── 天府系八星 ──────────────────────────────────────────
    // 天府：辰宫 庙→旺、戌宫 庙→旺（全书：旺于辰戌午酉）
    '天府': ['庙','得','旺','得','旺','庙','得','旺','旺','得','庙','庙'],
    // 太阴：寅宫 旺→陷、酉宫 不→旺（全书：庙于亥子丑，旺于酉戌，陷于寅卯辰巳午）★ 重大修正
    // ★ 2026-06-10 doctrine 复核（用户留言「太阳太阴庙旺有误」触发，详见 docs/audits/taiyin-brightness-review.md）：
    //   善本《全书·诸星问答论·太阴》逐字（quanshu-juan1-source.ts）：「以卯辰巳午未为陷地，以酉戌亥子丑为得垣」
    //   → 午宫原值'不'与上行自引出处及善本两源皆抵触，系 05 月校订漏网，校订为'陷'。
    //   存疑保留：未宫善本作陷地、此表沿用'不'（通行庙旺表多不入陷，流派分歧）；寅宫善本未提，沿用 05 月校订'陷'。
    '太阴': ['陷','陷','陷','陷','陷','不','利','旺','旺','庙','庙','庙'],
    // 贪狼：iztro 原始表为 6 位对称构造（平利庙陷旺庙重复），与古籍差异显著，按文墨天机 XD1 表修正
    // ★ 2026-06-11 复核（二次）：XD1 巳宫=地（wenmo scale=3），iztro Brightness 无'地'，映射为'平'（同属 normal 区，与文墨天机显示一致）
    '贪狼': ['不','平','得','平','平','庙','不','平','得','利','平','庙'],
    // 巨门：iztro 默认与全书一致 ✓（全书各源分歧已复核，iztro 取值合理）
    // 天相：卯宫 陷→平、酉宫 陷→平（依「天相平于卯酉」通行庙旺总诀；善本《全书》天相条无逐宫原文，且文墨自家四派表此处亦全作「平」，故「平」站得住）
    '天相': ['庙','平','得','得','庙','得','庙','平','得','得','庙','庙'],
    // 天梁：卯宫 庙→得、戌宫 庙→得（全书：得地于卯戌）
    '天梁': ['庙','得','庙','陷','庙','旺','陷','得','得','陷','庙','旺'],
    // 七杀：酉宫 庙→旺（全书：旺于子午卯酉）
    '七杀': ['庙','旺','庙','平','旺','庙','庙','旺','庙','平','旺','庙'],
    // 破军：iztro 默认与全书一致 ✓

    // ── 辅星（六吉六煞）────────────────────────────────────
    // 文昌：iztro 默认与全书一致 ✓
    // 文曲：辰宫 得→庙、子宫 得→庙（全书：庙于巳酉丑子辰，共五庙位）
    '文曲': ['平','旺','庙','庙','陷','旺','得','庙','陷','旺','庙','庙'],
    // 火星：iztro 默认与全书一致 ✓
    // 铃星：iztro 错误地复制了火星亮度！全书铃星与火星不同 ★ 重大修正
    //   辰申 陷→得、未 利→得、丑 得→陷、亥 利→陷（全书：庙寅午戌，地辰巳未申，陷丑亥子）
    //   酉宫：iztro/文墨天机/元亨利贞 均为"得"，从众修正
    '铃星': ['庙','利','得','得','庙','得','得','得','庙','陷','陷','陷'],
    // 擎羊：酉宫 陷→旺、子宫 陷→旺（全书：庙辰戌丑未，旺酉子，陷卯午）
    '擎羊': ['','陷','庙','','陷','庙','','旺','庙','','旺','庙'],
    // 陀罗：iztro 默认与全书一致 ✓

    // ── 武曲 / 廉贞 / 巨门 / 破军 ───────────────────────────────
    // 这 4 颗主星 iztro 原生值与《全书》一致，原先未显式覆写（靠 iztro 内置 fallback）。
    // ★ 2026-06-11 补入原生值（探针 scripts 实测，寅起）：使 DEFAULT 表完整含 14 主星，
    //   流派切换后 setBrightnessSchool('default') 才能全量盖回、还原默认。
    '武曲': ['得','利','庙','平','旺','庙','得','利','庙','平','旺','庙'],
    '廉贞': ['庙','平','利','陷','平','利','庙','平','利','陷','平','利'],
    '巨门': ['庙','庙','陷','旺','旺','不','庙','庙','陷','旺','旺','不'],
    '破军': ['得','陷','旺','平','庙','旺','得','陷','旺','平','庙','旺'],
};

// 模块加载即写入默认亮度表 + 农历正月初一换年规则（astro.config 为全局副作用）
astro.config({
  yearDivide: 'normal',
  brightness: DEFAULT_BRIGHTNESS,
});

// ─── 文墨流派切换（2026-05-12，反编译验证后引入）─────────────────────────
// 默认 = 我们当前的自定义表（基于全书 + 文墨安星码 8GDPB 交叉验证）
// 切换 = 调 setBrightnessSchool('qs' | 'xd1' | 'zz' | 'xd2') 覆写为文墨任一套
//
// 注意：astro.config 是全局副作用，每次调用影响所有后续 generateChart
//       服务端多用户场景下要小心 race condition（chart 生成是同步的，影响小）

export type WenmoBrightnessSchool = 'default' | BrightnessSchool;

// ★ 2026-06-20 星曜亮度全套对齐文墨：全盘亮度改由装配层直接查文墨 SB_[school] 表
//   （wenmoStarBrightness：主星+辅星+煞星+空劫统一一套表/一套映射/子起一索引），
//   不再走 iztro 的 astro.config 覆写（旧的 DEFAULT_BRIGHTNESS 善本手敲表 + wenmoBrightnessTableToIztroFormat
//   方向读反的映射，都已弃用）。★ 2026-06-20 default = 现代修订二 XD2——文墨 APP 默认亮度流派即「现代修订二」
//   （用户实证 + 真盘全 12 宫 27/27；之前误判成「全书」是因辅星 右弼申/武曲申 等读错，纠正）。
//   流派切换只改此值（同步主辅煞，避免不一致）。用户显式选全书/现代一/中州才覆写。
let currentBrightSchool: BrightnessSchool = 'XD2';

export function setBrightnessSchool(school: WenmoBrightnessSchool): void {
  currentBrightSchool = school === 'default' ? 'XD2' : school;
}

export type LunarMonthPolicy = 'split' | 'next-month' | 'prev-month' | 'origin-month';

export interface EffectiveLunarDate {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  rawLunarMonth: number;
  rawLunarDay: number;
}

/**
 * Resolve the lunar month used by the chart and all month-based patches.
 * The raw lunar date remains available so callers can keep split behavior on
 * the real leap month while non-split policies use the same effective date.
 */
export function resolveEffectiveLunarDate(
  year: number,
  month: number,
  day: number,
  policy: LunarMonthPolicy = 'prev-month',
): EffectiveLunarDate {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const rawLunarMonth = Number(lunar.getMonth());
  const rawLunarDay = Number(lunar.getDay());
  const isRawLeapMonth = rawLunarMonth < 0;
  const absoluteMonth = Math.abs(rawLunarMonth);

  if (!isRawLeapMonth) {
    return {
      lunarYear: Number(lunar.getYear()),
      lunarMonth: absoluteMonth,
      lunarDay: rawLunarDay,
      isLeapMonth: false,
      rawLunarMonth,
      rawLunarDay,
    };
  }

  let lunarYear = Number(lunar.getYear());
  let lunarMonth = absoluteMonth;
  let isLeapMonth = false;

  if (policy === 'split') {
    // Keep iztro's established split rule: days 1-15 use the prior month,
    // and the second half uses the following month.
    if (rawLunarDay > 15) lunarMonth = absoluteMonth + 1;
  } else if (policy === 'next-month') {
    lunarMonth = absoluteMonth + 1;
  } else if (policy === 'origin-month') {
    isLeapMonth = true;
  }

  if (lunarMonth > 12) {
    lunarMonth = 1;
    lunarYear += 1;
  }

  let lunarDay = rawLunarDay;
  try {
    const monthKey = isLeapMonth ? -lunarMonth : lunarMonth;
    const dayCount = LunarMonth.fromYm(lunarYear, monthKey)?.getDayCount?.();
    if (typeof dayCount === 'number' && dayCount > 0 && lunarDay > dayCount) lunarDay = dayCount;
  } catch { /* 查不到月信息则保留原日，维持下游既有容错 */ }

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    rawLunarMonth,
    rawLunarDay,
  };
}

// ─── 农历信息（兼容保留）────────────────────────────────────────
export function getLunarInfo(
  year: number,
  month: number,
  day: number,
  hour?: number,
  policy: LunarMonthPolicy = 'prev-month',
): LunarInfo {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const effective = resolveEffectiveLunarDate(year, month, day, policy);
  // lunar-javascript 没有 .d.ts，立春换年方法只在 runtime 上有，用 any 绕过
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lu = lunar as any;
  // 紫微斗数排盘年（正月初一换年，与上方 astro.config:yearDivide='normal' 同口径）
  // 注意：节气四柱(下方)用 getEightChar() 精确到立春/节的时刻，八字四柱永远立春换年，跟紫微的"农历年"是两套
  const yearStem = STEMS.indexOf(lu.getYearGan());
  const yearBranch = BRANCHES.indexOf(lu.getYearZhi());
  // ★ 节气四柱（年柱/月柱/日柱/时柱）+ 非节气四柱（农历口径月柱）
  let fourPillars: [string, string, string, string] | undefined;
  let fourPillarsLunar: [string, string, string, string] | undefined;
  try {
    // ★ 2026-09-01 立春/节气边界修正：节气四柱的年柱、月柱改用 getEightChar()（精确到立春/节的时刻）。
    //   原用 getYearGanByLiChun()/getMonthGan() 是「按立春当天整天」切换、不看时刻 —— 立春当天凌晨出生
    //   的会被算进新的一年，年/月柱各差一位（会员实测：2004-02-04 丑时应为癸未/乙丑，却排成甲申/丙寅）。
    //   立春=2004-02-04 19:56，此人凌晨 2:40 生，本该上一年癸未。lunar-javascript 的 getYearGanByLiChun
    //   即使传入时间也按日切换（实测无效），getEightChar 才精确到分。
    //   时刻用「时辰中点」(index*2 点)近似，与排盘既有的真太阳时时辰同口径；日柱/时柱不受立春影响、保持原算法。
    //   非节气日新旧完全一致（只有落在立春/十二节当天、交节时刻前后的人才会变），已抽样 12 例逐一比对验证。
    const effHour = (hour !== undefined && hour >= 0 && hour <= 11) ? hour * 2 : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ec = (Solar as any).fromYmdHms(year, month, day, effHour, 0, 0).getLunar().getEightChar();
    const yearGZ = ec.getYear() as string;    // 节气四柱年柱：立春精确换年
    const monthGZ = ec.getMonth() as string;  // 节气四柱月柱：节气精确换月 + 五虎遁用立春校正后的年干
    const dayGZ = `${lu.getDayGan()}${lu.getDayZhi()}`;
    // 时柱：日干 + 时支共同决定；时干由 day stem + hour 推
    // 规则：甲己日子时 → 甲子；乙庚日子时 → 丙子；丙辛 → 戊；丁壬 → 庚；戊癸 → 壬
    const dayStem = STEMS.indexOf(lu.getDayGan());
    const branchIdx = hour !== undefined && hour >= 0 && hour <= 11 ? hour : 0;
    const timeStemBase = (dayStem % 5) * 2; // 子时起的天干
    const timeStemIdx = (timeStemBase + branchIdx) % 10;
    const timeGZ = `${STEMS[timeStemIdx]}${BRANCHES[branchIdx]}`;
    fourPillars = [yearGZ, monthGZ, dayGZ, timeGZ];

    // ★ 非节气四柱（对齐文墨「非节气四柱」）：年柱用农历年(正月初一换年，与紫微同口径)、
    //   月柱按农历月(初一换月)重算 —— 节气交界日(如生在小暑后数十分钟)节气版会进下一月、农历版仍在本月，月柱差一位。
    //   日/时柱不受年月口径影响，复用上方。lunar-javascript 无农历口径月柱方法，用五虎遁手算。
    const absM = effective.lunarMonth;
    const yearGZLunar = `${STEMS[yearStem]}${BRANCHES[yearBranch]}`;        // 农历年干支(正月初一换年)
    const monthBranchIdx = (absM + 1) % 12;                                 // 农历月→月支(正月=寅)
    const monthStemBase = ((yearStem % 5) * 2 + 2) % 10;                    // 五虎遁：农历年干定正月(寅)天干
    const monthStemIdx = (monthStemBase + (absM - 1)) % 10;
    const monthGZLunar = `${STEMS[monthStemIdx]}${BRANCHES[monthBranchIdx]}`;
    fourPillarsLunar = [yearGZLunar, monthGZLunar, dayGZ, timeGZ];
  } catch { /* lunar-javascript 接口异常时跳过 */ }

  return {
    lunarYear: effective.lunarYear,
    lunarMonth: effective.lunarMonth,
    lunarDay: effective.lunarDay,
    yearStem: yearStem >= 0 ? yearStem : 0,
    yearBranch: yearBranch >= 0 ? yearBranch : 0,
    isLeapMonth: effective.isLeapMonth,
    fourPillars,
    fourPillarsLunar,
  };
}

// ─── 命主星 / 身主星（按地支查表）─────────────────────────
const MING_ZHU_TABLE: Record<number, string> = {
  0: '贪狼', 1: '巨门', 2: '禄存', 3: '文曲', 4: '廉贞', 5: '武曲',
  6: '破军', 7: '武曲', 8: '廉贞', 9: '文曲', 10: '禄存', 11: '巨门',
};
const SHEN_ZHU_TABLE: Record<number, string> = {
  0: '火星', 6: '火星', 1: '天相', 7: '天相',
  2: '天梁', 8: '天梁', 3: '天同', 9: '天同',
  4: '文昌', 10: '文昌', 5: '天机', 11: '天机',
};
export function calcMingZhu(branch: number): string { return MING_ZHU_TABLE[branch] ?? ''; }
export function calcShenZhu(branch: number): string { return SHEN_ZHU_TABLE[branch] ?? ''; }
export function calcYinYangGender(yearStem: number, gender: 'male' | 'female'): string {
  return `${yearStem % 2 === 0 ? '阳' : '阴'}${gender === 'male' ? '男' : '女'}`;
}

// ─── 亮度映射 ────────────────────────────────────────────────────
function mapBrightness(b?: string): 'bright' | 'normal' | 'dim' {
  if (!b) return 'normal';
  if (b === '庙' || b === '旺') return 'bright';
  if (b === '陷' || b === '不' || b === '闲') return 'dim';
  return 'normal';
}

/** 从 iztro 原始亮度文本中提取标准 7 档之一 */
function extractRawBrightness(b?: string): import('./types').StarBrightness | undefined {
  if (!b) return undefined;
  const valid: import('./types').StarBrightness[] = ['庙', '旺', '得', '利', '平', '不', '闲', '陷', '地'];
  for (const x of valid) {
    if (b.includes(x)) return x;
  }
  return undefined;
}

// ─── 星曜类型映射 ────────────────────────────────────────────────
const SHA_STARS = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫',
  '天空', '旬空', '副旬', '截路', '截空', '副截', '大耗', '天使', '天伤',
  // ★ 扩充（之前只判主煞，半凶杂耀漏判）
  '天刑', '天哭', '天虚', '天月', '阴煞', '蜚廉', '空亡',
  '孤辰', '寡宿']);
const LUCKY_STARS = new Set(['文昌', '文曲', '左辅', '右弼', '天魁', '天钺',
  '禄存', '天马', '天官', '天福', '天才', '天寿', '三台', '八座', '恩光',
  '天贵', '台辅', '龙池', '凤阁', '红鸾', '天喜',
  // ★ 扩充：吉杂耀
  '解神', '天德', '月德', '年解', '天巫', '华盖', '封诰']);

function mapStarType(starName: string, iztroType: string): Star['type'] {
  if (SHA_STARS.has(starName)) return 'sha';
  if (LUCKY_STARS.has(starName)) return 'lucky';
  const t = (iztroType ?? '').toLowerCase();
  if (t === '主星' || t === 'major') return 'major';
  if (t === '煞星' || t === 'tough') return 'sha';
  if (t === '吉星' || t === 'soft' || t === '禄存' || t === '天马') return 'lucky';
  return 'minor';
}

// ─── 五行局名称 → 数字 ──────────────────────────────────────────
function parseWuxingJu(name: string): number {
  if (name.includes('二')) return 2;
  if (name.includes('三')) return 3;
  if (name.includes('四')) return 4;
  if (name.includes('五')) return 5;
  if (name.includes('六')) return 6;
  return 3;
}

// ─── 主函数：生成命盘 ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// 天魁天钺 · 文墨默认派(KY1)修正
//
// 用户决策(2026-05-30):排盘对齐文墨天机默认输出(源码对照实证,见 docs/wenmo-parity-report.md)。
// 实测 10 天干年仅【辛年】与 iztro 现状不同:
//   辛年  文墨默认 = 天魁在寅 / 天钺在午;iztro(主流) = 天魁在午 / 天钺在寅。
// ⚠️ 文墨默认派在辛年与主流「辛马虎 = 魁午钺寅」口诀相反(魁钺对调)。这是文墨 APP 的
//    既定排法,此处遵用户「复刻文墨」决定。其余 9 个天干年文墨默认与 iztro 本就一致。
// 回退:删除 generateChart 内 applyWenmoKuiyue(...) 调用即恢复 iztro 主流派。
// ─────────────────────────────────────────────────────────────────────────
function relocateStar(palaces: Palace[], name: string, targetBranch: number): void {
  let moved: Star | undefined;
  for (const p of palaces) {
    const i = p.stars.findIndex((s) => s.name === name);
    if (i >= 0) {
      if (p.branch === targetBranch) return; // 已在目标宫,无需移动
      moved = p.stars[i];
      p.stars.splice(i, 1);
      break;
    }
  }
  if (!moved) return;
  const target = palaces.find((p) => p.branch === targetBranch);
  if (target) {
    target.stars.push(moved);
    // ★ 2026-06-20 天魁天钺换位（文墨 KY1）后,亮度仍是 iztro 旧宫位算的（错位）。按新宫地支重算文墨亮度。
    const rb = wenmoStarBrightness(moved.name, targetBranch, currentBrightSchool);
    moved.brightnessRaw = extractRawBrightness(rb);
    moved.brightness = rb ? mapBrightness(rb) : undefined;
  }
}

function applyWenmoKuiyue(palaces: Palace[], yearStemCn: string): void {
  const gan = STEMS.indexOf(yearStemCn); // 甲=0 … 癸=9
  if (gan < 0) return;
  const row = WENMO_AX.KY_ARR1[gan + 1]; // KY 表「甲=1」起;子起一编码
  if (!row) return;
  relocateStar(palaces, '天魁', row[0] - 1); // 子起一(子=1) → BRANCHES 索引(子=0)
  relocateStar(palaces, '天钺', row[1] - 1);
}

/**
 * 文墨本命顶栏「大耗」（年支星，不是宫底博士十二神那颗）。
 * 2026-08-14 基础版 2.5.8 模拟器 12 年支实机：阳支岁破+1，阴支岁破−1。
 * 子=0 起偶数为阳支（子寅辰午申戌）。
 */
export function wenmoDahaoBranch(yearBranch: number): number {
  const suiPo = (yearBranch + 6) % 12;
  return yearBranch % 2 === 0 ? (suiPo + 1) % 12 : (suiPo + 11) % 12;
}

function pushNatalStar(palaces: Palace[], branch: number, name: string): void {
  const target = palaces.find((p) => p.branch === branch);
  if (!target || target.stars.some((s) => s.name === name)) return;
  const rb = wenmoStarBrightness(name, branch, currentBrightSchool);
  target.stars.push({
    name,
    type: mapStarType(name, ''),
    brightness: rb ? mapBrightness(rb) : undefined,
    brightnessRaw: extractRawBrightness(rb),
  });
}

function applyWenmoDahao(palaces: Palace[], yearBranch: number): void {
  pushNatalStar(palaces, wenmoDahaoBranch(yearBranch), '大耗');
}

/**
 * 文墨本命顶栏截空/副截。
 * 对子仍是甲己申酉、乙庚午未、丙辛辰巳、丁壬寅卯、戊癸子丑（iztro 已排对）。
 * 阳干截空落阳宫、副截落阴宫；阴干对调。iztro 一律截路=阳宫、空亡=阴宫，阴干要换宫。
 * 2026-08-14 实机：辛丑巳截空/辰副截，己亥酉截空/申副截，乙巳未截空/午副截。
 */
function applyWenmoJiekong(palaces: Palace[], yearStem: number): void {
  for (const p of palaces) {
    for (const s of p.stars) {
      if (s.name === '截路') s.name = '截空';
      else if (s.name === '空亡') s.name = '副截';
    }
  }
  if (yearStem % 2 === 0) return;
  const jie = palaces.find((p) => p.stars.some((s) => s.name === '截空'));
  const fu = palaces.find((p) => p.stars.some((s) => s.name === '副截'));
  if (!jie || !fu || jie === fu) return;
  const jieStar = jie.stars.find((s) => s.name === '截空');
  const fuStar = fu.stars.find((s) => s.name === '副截');
  if (!jieStar || !fuStar) return;
  jie.stars = jie.stars.filter((s) => s !== jieStar);
  fu.stars = fu.stars.filter((s) => s !== fuStar);
  const rbJ = wenmoStarBrightness('截空', fu.branch, currentBrightSchool);
  const rbF = wenmoStarBrightness('副截', jie.branch, currentBrightSchool);
  jieStar.brightness = rbJ ? mapBrightness(rbJ) : undefined;
  jieStar.brightnessRaw = extractRawBrightness(rbJ);
  fuStar.brightness = rbF ? mapBrightness(rbF) : undefined;
  fuStar.brightnessRaw = extractRawBrightness(rbF);
  fu.stars.push(jieStar);
  jie.stars.push(fuStar);
}

/** 旬空成对（子丑/寅卯/辰巳/午未/申酉/戌亥）。副旬落在另一支：旬空阳支+1、阴支−1。 */
function applyWenmoFuxun(palaces: Palace[]): void {
  const xun = palaces.find((p) => p.stars.some((s) => s.name === '旬空'));
  if (!xun) return;
  const fu = xun.branch % 2 === 0 ? (xun.branch + 1) % 12 : (xun.branch + 11) % 12;
  pushNatalStar(palaces, fu, '副旬');
}

export function generateChart(
  birthInfo: BirthInfo,
  opts?: { leapMonth?: LunarMonthPolicy },
): ZiweiChart {
  const { year, month, day, hour, gender } = birthInfo;
  if (!Number.isInteger(hour) || hour < 0 || hour > 11) {
    throw new RangeError(`hour must be an integer branch index from 0 to 11; received ${hour}`);
  }
  const iztroGender = gender === 'male' ? '男' : '女';

  // 闰月处理（流派分歧：归本月 / 归下月 / 前后半分）
  // 默认 = DEFAULT_LEAP_MONTH（2026-09-05 起 split：文墨专业版出厂默认「月中分界」，150 组真机对照验证；倪师派归下月可经流派抽屉切 next-month）
  // 非 split 时先算农历，闰月才切 byLunar；非闰月仍走 bySolar，与 split 行为完全一致
  const leapMode = opts?.leapMonth ?? DEFAULT_LEAP_MONTH;
  const effectiveLunar = resolveEffectiveLunarDate(year, month, day, leapMode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let astrolabe: any;

  if (leapMode !== 'split' && effectiveLunar.rawLunarMonth < 0) {
      // 闰月生人 → 按用户选项切换月份归属
      const lunarDateStr = `${effectiveLunar.lunarYear}-${effectiveLunar.lunarMonth}-${effectiveLunar.lunarDay}`;
      astrolabe = astro.byLunar(
        lunarDateStr,
        hour,
        iztroGender,
        effectiveLunar.isLeapMonth,
        false,
        'zh-CN',
      );
  } else {
    // 非闰月或 split 模式：直接 bySolar，保持 iztro 的既有行为
    astrolabe = astro.bySolar(`${year}-${month}-${day}`, hour, iztroGender, true, 'zh-CN');
  }

  // 让序列化后的 chart.birthInfo 继续携带同一闰月策略，供客户端运限 helper 重建本命盘。
  const chartBirthInfo = {
    ...birthInfo,
    leapMonthPolicy: leapMode,
  } as BirthInfo & { leapMonthPolicy: LunarMonthPolicy };

  // ── 组装十二宫 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const palaces: Palace[] = astrolabe.palaces.map((p: any) => {
    const branch = BRANCHES.indexOf(p.earthlyBranch as string);
    const stem   = STEMS.indexOf(p.heavenlyStem as string);

    // 合并所有星：主星 + 次星 + 杂耀
    const allStars: Star[] = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.majorStars ?? []).map((s: any) => {
        // ★ 2026-06-20 全套对齐文墨:亮度统一查文墨 SB_[currentBrightSchool] 表(全书派默认),不再用 iztro/善本表
        const rb = wenmoStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          'major' as const,
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.minorStars ?? []).map((s: any) => {
        // ★ 2026-06-20 辅星(左辅右弼天魁天钺禄存天马) + 煞星(火铃羊陀空劫) 同走文墨 SB 表(同一套映射/索引)
        const rb = wenmoStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          mapStarType(s.name as string, s.type as string),
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
      // ★ 之前 adjectiveStars 全部强制 type='minor'，绕过了 mapStarType，
      //   导致红鸾/天喜（lucky）、天刑/天哭（sha）等被错分类。改成走映射函数，
      //   让所有星正确按性质分到 lucky / sha / minor 三类，UI 也能正常分区显示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(p.adjectiveStars ?? []).map((s: any) => {
        // ★ 2026-06-20 杂耀亮度对齐文墨：行号 = SB 亮度表 ID（WENMO_STAR_ID_TO_NAME 反查），
        //   落宫沿用 iztro（与文墨一致），真盘 24/24 验证。名字不在表里的杂耀 → undefined（留白，同现状）。
        const rb = wenmoStarBrightness(s.name as string, branch, currentBrightSchool);
        return {
          name:          s.name as string,
          type:          mapStarType(s.name as string, (s.type as string) ?? ''),
          brightness:    rb ? mapBrightness(rb) : undefined,
          brightnessRaw: extractRawBrightness(rb),
          siHua:         s.mutagen as Star['siHua'],
        };
      }),
    ];

    // ★ 2026-06-20 对齐文墨：文墨把「岁前12神/将前12神」里的特定神煞当本命星显示
    //   （劫煞@将前、龙德@岁前），iztro 把这两套放在 jiangqian12/suiqian12 单独字段，
    //   原装配只取 major/minor/adjective 三类 → 整套漏了。在此补回（这两颗文墨亦不标亮度，留白）。
    //   年支大耗不走岁前12神（iztro 岁前大耗=岁破，文墨不是），见 applyWenmoDahao。
    for (const sname of [p.suiqian12, p.jiangqian12] as (string | undefined)[]) {
      if (sname === '劫煞' || sname === '龙德') {
        allStars.push({ name: sname, type: mapStarType(sname, '') });
      }
    }

    const range = p.decadal?.range;
    return {
      branch:        branch >= 0 ? branch : 0,
      stem:          stem >= 0 ? stem : 0,
      name:          p.name as string,
      stars:         allStars,
      daXianAge:     range ? [range[0], range[1]] as [number, number] : undefined,
      isMingGong:    p.name === '命宫',
      isShenGong:    p.isBodyPalace ?? false,
      isCurrentDaXian: false,
    };
  });

  // ★ 天魁天钺对齐文墨默认派(KY1)——用户决策 2026-05-30,实测仅辛年与现状不同(见上方函数注释)
  const yearStemCn = (astrolabe.rawDates?.chineseDate?.yearly?.[0]) as string | undefined;
  if (yearStemCn) applyWenmoKuiyue(palaces, yearStemCn);

  // ── 当前年龄 & 大限 ──
  // ★ 用 iztro horoscope.age.nominalAge（中国虚岁口径，与 daXianAge 范围一致）
  // 旧实现 `currentYear - year` 是年份差（少 1），导致大限边界年份错位 → 用户感觉
  // "大限没走对，似乎还在走上一个大限"。统一用 iztro 自身口径修复。
  let currentAge: number;
  try {
    const horo = (astrolabe as unknown as { horoscope: () => { age: { nominalAge: number } } }).horoscope();
    currentAge = horo.age.nominalAge;
  } catch {
    // fallback：iztro 接口异常时回退到虚岁推导
    currentAge = new Date().getFullYear() - year + 1;
  }

  palaces.forEach(p => {
    if (p.daXianAge && currentAge >= p.daXianAge[0] && currentAge <= p.daXianAge[1]) {
      p.isCurrentDaXian = true;
    }
  });

  // ── 借对宫结构化字段（codex P0：避免文案层从自然语言反查借宫信息）──
  palaces.forEach(p => {
    p.oppositeBranch = (p.branch + 6) % 12;
    const mainStars = p.stars.filter(s => s.type === 'major');
    p.isEmpty = mainStars.length === 0;
    if (p.isEmpty) {
      const oppPalace = palaces.find(q => q.branch === p.oppositeBranch);
      if (oppPalace) {
        p.borrowedFromBranch = oppPalace.branch;
        p.borrowedFromName = oppPalace.name;
        p.borrowedStars = oppPalace.stars.filter(s => s.type === 'major').map(s => s.name);
      }
    }
  });

  // ── 关键宫支 ──
  const mingGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfSoulPalace as string);
  const shenGongBranch = BRANCHES.indexOf(astrolabe.earthlyBranchOfBodyPalace as string);
  const wuxingJuName   = astrolabe.fiveElementsClass as string;
  const wuxingJu       = parseWuxingJu(wuxingJuName);

  // ── 紫微星位置 ──
  const ziweiPalace = palaces.find(p => p.stars.some(s => s.name === '紫微' && s.type === 'major'));
  const ziweiPos    = ziweiPalace?.branch ?? 0;

  // ── 大限数组（倪师《天纪》正统：四化永远固定，大限只看宫位移动）──
  // 不再生成 daXians[].siHua / stemIndex / stemName（飞星派字段已下线）
  const daXians: DaXian[] = palaces
    .filter(p => p.daXianAge)
    .sort((a, b) => a.daXianAge![0] - b.daXianAge![0])
    .map(p => ({
      startAge:    p.daXianAge![0],
      endAge:      p.daXianAge![1],
      palaceBranch: p.branch,
      palaceName:   p.name,
    }));

  // 宫干自化已下线（倪师不主张飞星派宫干自化论）

  const currentDaXianIndex = daXians.findIndex(
    dx => currentAge >= dx.startAge && currentAge <= dx.endAge,
  );

  // ── 农历信息（含节气四柱）──
  const lunarInfo = getLunarInfo(year, month, day, hour, leapMode);

  // ★ 2026-08-14 文墨 2.5.8 实机：截空/副截阴干对调 + 年支大耗 + 旬空成对副旬
  applyWenmoJiekong(palaces, lunarInfo.yearStem);
  applyWenmoDahao(palaces, lunarInfo.yearBranch);
  applyWenmoFuxun(palaces);

  // ── 命主 / 身主 / 阴阳性别 ──
  const mingZhu = calcMingZhu(mingGongBranch >= 0 ? mingGongBranch : 0);
  const shenZhu = calcShenZhu(lunarInfo.yearBranch);
  const yinYangGender = calcYinYangGender(lunarInfo.yearStem, gender);

  return {
    birthInfo: chartBirthInfo,
    lunarInfo,
    mingGongBranch: mingGongBranch >= 0 ? mingGongBranch : 0,
    shenGongBranch: shenGongBranch >= 0 ? shenGongBranch : 0,
    wuxingJu,
    wuxingJuName,
    ziweiPos,
    palaces,
    daXians,
    currentAge,
    currentDaXianIndex,
    mingZhu,
    shenZhu,
    yinYangGender,
  };
}
