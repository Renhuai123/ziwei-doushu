/**
 * 《紫微斗数全书》卷一〈定杂局〉八格 · 严格实现
 *
 * 底本：卷一〈定杂局〉八条，各带注文。姊妹篇〈定贵局〉〈定富局〉〈定贫贱局〉
 *      见 patterns-dinggui/dingfu/dingpin.ts；判读纪律（照字面、不放宽、
 *      注文歧义标 disputed 并注明所取读法）与彼处相同。
 *
 * ★ 本表与前四表的根本区别：命中单位不是命盘，是运限。
 *   注文里的「二限」「限破」「限逢」「四十后行墓运」「前限接后限」「一年好
 *   一年不好」，八条全部以大限或流年为单位。所以本模块的返回值是
 *   「哪一条格、在哪个大限（或哪段流年）成立」，不是布尔的「有没有格」。
 *   消费方式：`detectDingZa(chart)` 取全量；`detectDingZa(chart, { age })`
 *   取覆盖该虚岁的部分（UI 展示「当前大限」用 chart.currentAge）。
 *   **不要**把本表接进 detectPatterns——把运限格塞进命盘格列表，
 *   正是《全书》原文自己都分开的两类。
 *
 * 共用度量（八条注文反复用到「弱 / 吉地 / 好」，必须一套口径判到底，
 * 否则各条各判等于暗中放宽）：
 *  - 宫弱：无主星，或主星 brightnessRaw 全为「陷」（7 档口径，与 dingpin 一致）；
 *  - 宫强（行吉地）：主星 ≥1 且至少一颗 brightnessRaw 为「庙」或「旺」；
 *  - 限好：限命宫强，且限命三方四正会吉星 ≥2，且六煞 ≤1；
 *  - 吉星口径：左辅右弼、昌曲、魁钺、禄存、天马，另加主星四化之禄权科（与 dinggui 一致）；
 *  - 空亡口径：旬空/副旬/截路/截空/空亡/副截六星全表（与 dinggui/dingpin 一致）；
 *  - 流年命宫：安于流年地支所在宫（斗数正统安法）。流年地支按公历年序推
 *    （(出生年 + 虚岁 − 5) mod 12），农历/立春交节边界 ±1 岁的盘位误差
 *    只影响边界年，见 no.6 的 why。流年四化不立（本实现不计流年四化），
 *    流年吉凶只由生年四化与星曜落宫判——颗粒度粗，所以 no.6 标 disputed。
 *
 * ⚠️ 盘对象陷阱：`ZiweiChart.palaces` 实际从寅宫（branch=2）起排，
 *    一律按 branch 查，禁止用下标。大限顺序必须按 startAge 排，
 *    daXians 数组本身不保证有序（patterns-dinggui 时代已确认）。
 */

import type { ZiweiChart, Star, DaXian } from './types';
import type { GeStatus } from './patterns-dinggui';

// ────────────────── 盘面读取 ──────────────────

const palaceAt = (c: ZiweiChart, branch: number) =>
  c.palaces.find(p => p.branch === ((branch % 12) + 12) % 12)!;

const starsAt = (c: ZiweiChart, branch: number): Star[] => palaceAt(c, branch).stars;

const has = (c: ZiweiChart, branch: number, name: string): boolean =>
  starsAt(c, branch).some(s => s.name === name);

const starOf = (c: ZiweiChart, branch: number, name: string): Star | undefined =>
  starsAt(c, branch).find(s => s.name === name);

const majorsAt = (c: ZiweiChart, branch: number): Star[] =>
  starsAt(c, branch).filter(s => s.type === 'major');

/** 本宫 + 三合 + 对宫 */
const sanFang = (b: number): number[] => [b, (b + 4) % 12, (b + 8) % 12, (b + 6) % 12];

// ────────────────── 共用度量 ──────────────────

const SHA_STARS = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
const JI_STARS = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马'];
const KONG_STARS = ['旬空', '副旬', '截路', '截空', '空亡', '副截'];
const MU_BRANCHES = [1, 4, 7, 10]; // 丑辰未戌，四墓库

const isXian = (s: Star): boolean => s.brightnessRaw === '陷';
const isMiaoWang = (s: Star): boolean => s.brightnessRaw === '庙' || s.brightnessRaw === '旺';

/** 宫弱：无主星，或主星全陷 */
const isWeakPalace = (c: ZiweiChart, b: number): boolean => {
  const majors = majorsAt(c, b);
  return majors.length === 0 || majors.every(isXian);
};

/** 宫强（行吉地）：有主星且至少一颗庙旺 */
const isStrongPalace = (c: ZiweiChart, b: number): boolean =>
  majorsAt(c, b).some(isMiaoWang);

/** 诸宫会吉星数（吉星曜 + 主星四化禄权科） */
const jiCountIn = (c: ZiweiChart, branches: number[]): number =>
  branches.reduce((n, b) => n + starsAt(c, b).filter(
    s => JI_STARS.includes(s.name) || (s.type === 'major' && s.siHua && s.siHua !== '忌'),
  ).length, 0);

/** 诸宫六煞数 */
const shaCountIn = (c: ZiweiChart, branches: number[]): number =>
  branches.reduce((n, b) => n + starsAt(c, b).filter(s => SHA_STARS.includes(s.name)).length, 0);

const isKongPalace = (c: ZiweiChart, b: number): boolean =>
  starsAt(c, b).some(s => KONG_STARS.includes(s.name));

/** 限好：限命宫强 + 三方四正会吉 ≥2 + 六煞 ≤1（口径见头部注释） */
const isXianHao = (c: ZiweiChart, dx: DaXian): boolean => {
  const b = dx.palaceBranch;
  if (!isStrongPalace(c, b)) return false;
  const sf = sanFang(b);
  return jiCountIn(c, sf) >= 2 && shaCountIn(c, sf) <= 1;
};

/** 星坐空亡宫（禄衰马困用）：该星所在宫含空亡诸星 */
const starSitsKong = (c: ZiweiChart, name: string): boolean => {
  const b = c.palaces.find(p => p.stars.some(s => s.name === name))?.branch;
  return b === undefined ? false : isKongPalace(c, b);
};

/** 流年地支（公历年序近似，见头部注释）：虚岁 age → 地支索引 */
const yearBranchOf = (c: ZiweiChart, age: number): number =>
  (((c.birthInfo.year + age - 1 - 4) % 12) + 12) % 12;

type Grade = 'ji' | 'xiong' | 'ping';

/**
 * 流年吉凶（no.6 用，口径见头部注释）：
 *  - 凶：流年命宫坐生年化忌，或坐六煞 ≥2；
 *  - 吉：三方四正会禄（禄存/化禄）或会吉星 ≥2，且命宫不凶；
 *  - 平：其余。
 */
const liuNianGrade = (c: ZiweiChart, age: number): Grade => {
  const b = yearBranchOf(c, age);
  const shaInMing = starsAt(c, b).filter(s => SHA_STARS.includes(s.name)).length;
  const jiInMing = starsAt(c, b).some(s => s.siHua === '忌');
  if (jiInMing || shaInMing >= 2) return 'xiong';
  const sf = sanFang(b);
  const hasLu = sf.some(x => starsAt(c, x).some(s => s.name === '禄存' || s.siHua === '禄'));
  if (hasLu || jiCountIn(c, sf) >= 2) return 'ji';
  return 'ping';
};

// ────────────────── 类型 ──────────────────

export interface DingZaGe {
  /** 原书序号 1-8 */
  no: number;
  name: string;
  /** 原文注文 */
  note: string;
  status: GeStatus;
  /** status 为 disputed 时的说明；derivable 而读法需交代时也用 */
  why?: string;
  /** 命中单位：大限 / 流年 / 命盘 */
  unit: '大限' | '流年';
  /**
   * 判定函数：返回命中的运限列表。
   *  - unit === '大限'：返回命中的大限（dxs 按起岁排序）；
   *  - unit === '流年'：返回的是「流年窗」——用 startAge/endAge 表达
   *    交替发生的连续两岁，palaceBranch/palaceName 表达后一年的流年命宫。
   */
  judge?: (c: ZiweiChart, dxs: DaXian[]) => Array<{
    dx?: DaXian;
    startAge?: number;
    endAge?: number;
    detail?: string;
  }>;
}

// ────────────────── 八格 ──────────────────

export const DING_ZA_GE: DingZaGe[] = [
  {
    no: 1,
    name: '风云际会',
    note: '身命虽弱二限逢禄马是也',
    status: 'derivable',
    unit: '大限',
    // 「二限」通解为大限与流年双层。流年层按几何近乎空转：流年命宫十年走
    // 十宫，三方四正覆盖 10×4 个宫位，几乎盖满全盘——只要大限三方会了禄马，
    // 窗口内几乎必有流年也逢（探针实测双层与单层计数相同）。故取大限层，
    // 结论已在 no.1 why 里交代，不算放宽。
    // 「身命虽弱」：命宫与身宫皆弱（宫弱口径见头部）。
    // 「逢禄马」：限命三方四正会禄（禄存/化禄）且会天马。
    why:
      '「二限」双层读法流年层近空转：流年命宫十年走十宫，三方四正覆盖面 ' +
      '≈ 全盘，大限层成立时流年层几乎必然成立（实测计数相同），故判大限层。',
    judge: (c, dxs) => {
      if (!isWeakPalace(c, c.mingGongBranch)) return [];
      if (!isWeakPalace(c, c.shenGongBranch)) return [];
      return dxs.filter(dx => {
        const sf = sanFang(dx.palaceBranch);
        const hasLu = sf.some(b =>
          starsAt(c, b).some(s => s.name === '禄存' || s.siHua === '禄'));
        const hasMa = sf.some(b => has(c, b, '天马'));
        return hasLu && hasMa;
      }).map(dx => ({ dx }));
    },
  },
  {
    no: 2,
    name: '锦上添花',
    note: '谓限破恶星而行吉地是也',
    status: 'derivable',
    unit: '大限',
    // 「限破恶星」取恶星守限（坐限命宫本宫）；「行吉地」取完整限好口径
    // （限命宫强 + 三方会吉≥2 + 六煞≤1）——守限那颗煞恰为全三方唯一煞，
    // 破而不破，正是「锦上添花」。首版只取宫强（无会吉/煞门槛）实测 22%/限、
    // 96% 的盘都有，无判别力，已收紧。
    judge: (c, dxs) => dxs.filter(dx =>
      starsAt(c, dx.palaceBranch).some(s => SHA_STARS.includes(s.name)) &&
      isXianHao(c, dx),
    ).map(dx => ({ dx })),
  },
  {
    no: 3,
    name: '禄衰马困',
    note: '限逢七杀禄马空亡是也',
    status: 'derivable',
    unit: '大限',
    // 「限逢七杀」：限命三方四正会七杀（「逢」取会遇，与本表其他「逢」一致）。
    // 「禄马空亡」：格名自拆为「禄衰」（禄存坐空亡）＋「马困」（天马坐空亡），
    // 两者并举，取**皆**坐空亡（六空亡星口径，命局状态不限限宫）。
    // 首版「任一坐空亡」实测 22%/限、66% 的盘都有，无判别力，已收紧。
    judge: (c, dxs) => dxs.filter(dx => {
      const sf = sanFang(dx.palaceBranch);
      const sha7 = sf.some(b => has(c, b, '七杀'));
      const luMaKong = starSitsKong(c, '禄存') && starSitsKong(c, '天马');
      return sha7 && luMaKong;
    }).map(dx => ({ dx })),
  },
  {
    no: 4,
    name: '衣锦还乡',
    note: '少年不遂四十后行墓运是也',
    status: 'disputed',
    unit: '大限',
    // 「少年不遂」是履历陈述，盘面无判据，本模块只判可判的后半：
    // 大限起岁 ≥ 40 且限命宫在四墓库（丑辰未戌，墓运口径）。
    why:
      '「少年不遂」为履历陈述，命盘不可判，仅实现「四十后行墓运」半句：' +
      '大限起岁 ≥ 40 且限命宫在丑辰未戌。前半句留待使用者自证或他表旁证。',
    judge: (c, dxs) => dxs.filter(dx =>
      dx.startAge >= 40 && MU_BRANCHES.includes(dx.palaceBranch),
    ).map(dx => ({ dx })),
  },
  {
    no: 5,
    name: '步数无依',
    note: '前限接后限连绵不分是也',
    status: 'disputed',
    unit: '大限',
    // 「连绵不分」注家无定解。取读法：相邻两大限的限命宫皆弱（宫弱口径）
    // ——接连两限都无主星可依，即「无依」；hit 记在后限，why 里带前限宫位。
    why:
      '「连绵不分」注家无定解，取「相邻两限限命宫皆弱（无主星可依）」读法，' +
      'hit 记在后限。宫弱 = 无主星或主星全陷。',
    judge: (c, dxs) => {
      const out: Array<{ dx: DaXian; detail?: string }> = [];
      for (let i = 1; i < dxs.length; i++) {
        const prev = dxs[i - 1], cur = dxs[i];
        if (isWeakPalace(c, prev.palaceBranch) && isWeakPalace(c, cur.palaceBranch)) {
          out.push({
            dx: cur,
            detail: `前限 ${prev.startAge}-${prev.endAge} 岁（${palaceAt(c, prev.palaceBranch).name}）连此限皆弱`,
          });
        }
      }
      return out;
    },
  },
  {
    no: 6,
    name: '水上驾星',
    note: '一年好一年不好是也',
    status: 'disputed',
    unit: '流年',
    // 唯一一条流年格。「好」「不好」原文无判据，自建度量（liuNianGrade，
    // 口径见头部注释）：凶 = 流年命宫坐生年化忌或坐六煞 ≥2；吉 = 三方会禄
    // 或会吉 ≥2 且命宫不凶；平 = 其余。「一年好一年不好」= 存在连续两岁
    // 吉凶相接（中间无平年隔断）。hit 记在交替发生的那对岁次上。
    why:
      '「好」「不好」原文无判据，自建度量判（凶 = 流年命宫坐生年化忌或六煞≥2；' +
      '吉 = 三方会禄或会吉≥2 且命宫不凶），不计流年四化，故颗粒度粗；' +
      '流年地支按公历年序推，农历/立春边界年 ±1 岁误差。交替 = 连续两岁吉凶相接。',
    judge: (c, dxs) => {
      const lastAge = dxs.length ? dxs[dxs.length - 1].endAge : 100;
      const out: Array<{ startAge: number; endAge: number; detail: string }> = [];
      for (let a = 1; a < lastAge; a++) {
        const g1 = liuNianGrade(c, a), g2 = liuNianGrade(c, a + 1);
        const alt = (g1 === 'ji' && g2 === 'xiong') || (g1 === 'xiong' && g2 === 'ji');
        if (alt) {
          const b2 = yearBranchOf(c, a + 1);
          out.push({
            startAge: a,
            endAge: a + 1,
            detail: `第 ${a}-${a + 1} 岁（虚岁）吉凶交替，后一年流年命宫在 ${palaceAt(c, b2).name}`,
          });
        }
      }
      return out;
    },
  },
  {
    no: 7,
    name: '吉凶相伴',
    note: '命有主星限前则发限衰不发是也',
    status: 'disputed',
    unit: '大限',
    // 断句歧义：「命有主星 / 限前则发 / 限衰不发」——「限前」一作「限逢」、
    // 一作「限强」。取可计量的读法：命宫有主星（前提），本限限好（限好口径
    // 见头部）则该限为「发」限；限不好则不发。hit = 命有主星且该限限好。
    why:
      '断句歧义（「限前则发」一作限逢、一作限强），取「命宫有主星且本限限好 ' +
      '（限命宫强 + 三方会吉≥2 + 六煞≤1）则为发限」读法。',
    judge: (c, dxs) => {
      if (majorsAt(c, c.mingGongBranch).length === 0) return [];
      return dxs.filter(dx => isXianHao(c, dx)).map(dx => ({ dx }));
    },
  },
  {
    no: 8,
    name: '枯木逢春',
    note: '谓命衰限好是也',
    status: 'derivable',
    unit: '大限',
    // 「命衰」= 命宫弱（宫弱口径）；「限好」= 限好口径（限命宫强 + 三方会吉
    // ≥2 + 六煞 ≤1）。与 no.7 的差别只在前提：此条命宫弱，彼条命宫有主星。
    judge: (c, dxs) => {
      if (!isWeakPalace(c, c.mingGongBranch)) return [];
      return dxs.filter(dx => isXianHao(c, dx)).map(dx => ({ dx }));
    },
  },
];

// ────────────────── 入口 ──────────────────

export interface DingZaHit {
  no: number;
  name: string;
  note: string;
  status: GeStatus;
  /** 命中单位：大限 / 流年 */
  unit: '大限' | '流年';
  /** 大限起岁（大限格）或交替起始岁（流年格） */
  startAge?: number;
  endAge?: number;
  /** 限命宫（大限格）或后一年流年命宫（流年格） */
  palaceBranch?: number;
  palaceName?: string;
  detail?: string;
  why?: string;
}

/**
 * 判一张盘的〈定杂局〉格。返回全量命中（每个大限/流年窗一条）。
 *
 * - `opts.age` 给定时只返回覆盖该虚岁的命中（大限：startAge ≤ age ≤ endAge；
 *   流年窗：startAge 或 endAge 等于 age）。
 * - 返回顺序：先按格序号、再按起岁。
 */
export function detectDingZa(
  chart: ZiweiChart,
  opts?: { age?: number },
): DingZaHit[] {
  const dxs = [...chart.daXians].sort((a, b) => a.startAge - b.startAge);
  const out: DingZaHit[] = [];
  for (const g of DING_ZA_GE) {
    if (!g.judge) continue;
    const geWhy = g.why;
    for (const u of g.judge(chart, dxs)) {
      const dx = u.dx;
      const startAge = dx?.startAge ?? u.startAge;
      const endAge = dx?.endAge ?? u.endAge;
      const b = dx?.palaceBranch ?? (u.startAge !== undefined
        ? yearBranchOf(chart, u.endAge ?? u.startAge) : undefined);
      if (opts?.age !== undefined) {
        if (startAge === undefined || endAge === undefined) continue;
        if (g.unit === '大限' ? (opts.age < startAge || opts.age > endAge)
                              : (opts.age !== startAge && opts.age !== endAge)) continue;
      }
      out.push({
        no: g.no,
        name: g.name,
        note: g.note,
        status: g.status,
        unit: g.unit,
        startAge,
        endAge,
        palaceBranch: b,
        palaceName: b === undefined ? undefined : palaceAt(chart, b).name,
        detail: u.detail,
        why: geWhy,
      });
    }
  }
  out.sort((a, b) => a.no - b.no || (a.startAge ?? 0) - (b.startAge ?? 0));
  return out;
}

/** 可判定条目数（八条全部有实现，disputed 也带） */
export const DING_ZA_JUDGEABLE = DING_ZA_GE.filter(g => !!g.judge).length;

/** 按「当前虚岁」取当前运限的杂局命中（UI 便捷入口） */
export function getCurrentDingZa(chart: ZiweiChart): DingZaHit[] {
  return detectDingZa(chart, { age: chart.currentAge });
}
