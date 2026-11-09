/**
 * 《紫微斗数全书》卷一〈定贫贱局〉八格 · 严格实现
 *
 * 底本：卷一〈定贫贱局〉八条，各带注文。姊妹篇〈定贵局〉〈定富局〉见
 *      `patterns-dinggui.ts` / `patterns-dingfu.ts`；判读纪律相同。
 *
 * 本表八条**没有一条安星结构性无解**——贫贱格的条件多是「星＋状态」（空亡、
 * 落陷、煞星同宫），不要求梁相式的位置配合。但有三条按最严字面读法
 * 在 17,280 盘上 0 次（三陷互斥、四杀全守身命），取注家宽读并标 disputed。
 *
 * 「空亡」口径：与定贵局一致，取盘内旬空／副旬／截路／截空／空亡／副截六星
 * 全表（`isKong`）。本表空亡是**成立条件**而非排除条件，口径过宽会放大触发——
 * 实测对照见 no.3 的 why（任意宫读法宽口径 49%）。故涉及空亡的条目一律
 * 限定在命宫体系内判。
 *
 * ⚠️ 盘对象陷阱：`ZiweiChart.palaces` 实际从寅宫（branch=2）起排，
 *    一律按 branch 查，禁止用下标。样本纪律：足年干、满十二时辰、满日。
 */

import type { ZiweiChart, Palace } from './types';
import type { GeStatus, ProjectVerdict } from './patterns-dinggui';

// ────────────────── 盘面读取 ──────────────────

const KONG_STARS = ['旬空', '副旬', '截路', '截空', '空亡', '副截'];
const KONGJIE = ['地空', '地劫'];
const SHA4 = ['擎羊', '陀罗', '火星', '铃星'];

const palaceAt = (c: ZiweiChart, branch: number): Palace =>
  c.palaces.find(p => p.branch === ((branch % 12) + 12) % 12)!;

const has = (c: ZiweiChart, branch: number, name: string): boolean =>
  palaceAt(c, branch).stars.some(s => s.name === name);

const hasAny = (c: ZiweiChart, branch: number, names: string[]): boolean =>
  names.some(n => has(c, branch, n));

const hasHua = (c: ZiweiChart, branch: number, hua: '禄' | '权' | '科' | '忌'): boolean =>
  palaceAt(c, branch).stars.some(s => s.siHua === hua);

const starBranch = (c: ZiweiChart, name: string): number =>
  c.palaces.find(p => p.stars.some(s => s.name === name))?.branch ?? -1;

const sanFang = (b: number): number[] => [b, (b + 4) % 12, (b + 8) % 12, (b + 6) % 12];

const isKong = (c: ZiweiChart, b: number): boolean => hasAny(c, b, KONG_STARS);

const starOf = (c: ZiweiChart, b: number, name: string) =>
  palaceAt(c, b).stars.find(s => s.name === name);

/** 落陷：仅「陷」一档 */
const isXian = (c: ZiweiChart, b: number, name: string): boolean =>
  starOf(c, b, name)?.brightnessRaw === '陷';

// ────────────────── 类型 ──────────────────

export interface DingPinGe {
  /** 原书序号 1-8 */
  no: number;
  name: string;
  note: string;
  status: GeStatus;
  why?: string;
  inProject: ProjectVerdict;
  fn?: (c: ZiweiChart) => boolean;
}

// ────────────────── 八格 ──────────────────

export const DING_PIN_GE: DingPinGe[] = [
  {
    no: 1,
    name: '生不逢时',
    note: '命坐空亡逢廉贞是也',
    status: 'derivable',
    inProject: 'none',
    fn: c => {
      const b = c.mingGongBranch;
      return isKong(c, b) && has(c, b, '廉贞');
    },
  },
  {
    no: 2,
    name: '禄逢两杀',
    note: '禄坐空亡又逢空劫杀星是也',
    status: 'derivable',
    inProject: 'none',
    // 「两杀」取严读法：地空地劫双至（同宫）。安星上空劫同宫只出现在
    // 子、午两个时辰（地劫自亥顺数时支、地空自亥逆数，同宫 ⇔ 2h ≡ 0）。
    // 宽读法（空劫任一）实测 0.70%，双至 0.156%。
    fn: c => {
      const b = c.mingGongBranch;
      const lu = has(c, b, '禄存') || hasHua(c, b, '禄');
      return lu && isKong(c, b) && KONGJIE.every(x => has(c, b, x));
    },
    why:
      '「两杀」按空劫双至读（注文「空劫杀星」并列）。空劫同宫是时辰的结构性条件，' +
      '只在子午时出现，故此格天然稀有（17,280 盘 27 例，0.156%）。',
  },
  {
    no: 3,
    name: '马落空亡',
    note: '马既落亡，虽禄冲会无用，主奔波',
    status: 'disputed',
    inProject: 'none',
    // 取守命读法：天马守命且命宫坐空亡（4.10%）。
    // 任意宫读法（天马所在宫坐空亡，不限守命）：宽口径（六空亡星全算）
    // 49.17%、仅旬空口径 32.99%——旬空宫位与天马宫位同由年支定，
    // 特定年支组恒定重叠，约三分之一的盘按年生年即注定触发，作为
    // 命盘格失去判别力。故收敛到命宫体系。
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '天马') && isKong(c, b);
    },
    why:
      '注文未限定守命。任意宫读法在宽空亡口径下 49.17%（仅旬空 32.99%），' +
      '且因旬空宫与天马宫同由年支定，触发按年支组恒定——三分之一的人按生年即注定，' +
      '失去格的判别力。取守命读法（4.10%），保留稀疏性并注明取舍。',
  },
  {
    no: 4,
    name: '日月藏辉',
    note: '日月反背又逢巨暗是也',
    status: 'disputed',
    inProject: 'none',
    // 严读法（太阳、太阴、巨门三者皆落陷）17,280 盘 0 次：三颗星的「陷」档
    // 在安星几何上互斥——太阳陷宫、巨门陷宫由紫微落宫联动（差值恒定），
    // 两者同时落陷的紫微位置不存在。取注家宽读：反背 = 日月任一失辉，
    // 「逢巨暗」= 命宫三方四正逢巨门落陷。
    fn: c => {
      const b = c.mingGongBranch;
      const riB = starBranch(c, '太阳');
      const yueB = starBranch(c, '太阴');
      if (riB < 0 || yueB < 0) return false;
      const fanBei = isXian(c, riB, '太阳') || isXian(c, yueB, '太阴');
      if (!fanBei) return false;
      return sanFang(b).some(x => has(c, x, '巨门') && isXian(c, x, '巨门'));
    },
    why:
      '「反背」严读为日月皆陷，再合巨门落陷共三条件——17,280 盘 0 次。' +
      '三陷互斥是安星几何的结果：太阳与巨门同属紫微系（宫距恒定），' +
      '太阳陷宫与巨门陷宫不可能同时出现。取宽读：日月任一陷（反背）+' +
      '命三方逢陷巨门。历代注家对「反背」本无定解，故标 disputed。',
  },
  {
    no: 5,
    name: '财与囚仇',
    note: '武贞同守身命是也',
    status: 'derivable',
    inProject: 'none',
    // 武曲与廉贞宫距恒为 4（永不同宫），「同守」只能是分守身、命两宫。
    fn: c => {
      const b = c.mingGongBranch;
      const s = c.shenGongBranch;
      return (has(c, b, '武曲') && has(c, s, '廉贞')) ||
             (has(c, b, '廉贞') && has(c, s, '武曲'));
    },
    why:
      '武曲与廉贞宫距恒为 4（2,304 盘实测，武廉永不同宫），注文「同守身命」' +
      '只能取分守读法：一守命、一守身。身宫与命宫之差恒为偶数（身 = 命 + 2×时支序），' +
      '与武廉恒距 4 相容，实测可达（17,280 盘 457 例，2.65%）。',
  },
  {
    no: 6,
    name: '一生孤贫',
    note: '谓破守命星陷地是也',
    status: 'derivable',
    inProject: 'none',
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '破军') && isXian(c, b, '破军');
    },
  },
  {
    no: 7,
    name: '君子在野',
    note: '谓四杀守身命而言临陷地是也',
    status: 'disputed',
    inProject: 'none',
    // 严读法（擎羊陀罗火星铃星四星全部落在身、命两宫）17,280 盘 0 次：
    // 羊陀恒隔二宫（羊在禄前、陀在禄后），分居身命要求身命恰隔二宫
    // （丑时或巳时），火铃再恰好同落这两宫——可能而非恒不可能，但极稀。
    // 取宽读：命宫有 ≥2 颗四杀且其一落陷（1.89%）。
    fn: c => {
      const b = c.mingGongBranch;
      const sha = SHA4.filter(n => has(c, b, n));
      if (sha.length < 2) return false;
      return sha.some(n => isXian(c, b, n));
    },
    why:
      '「四杀守身命」严读为四星全落身命两宫——羊陀恒隔二宫可以分居身命' +
      '（身命恰隔二宫时），但火铃再同落此两宫在 17,280 盘上 0 次。非结构性' +
      '无解（无纯安星证明），故不标 unreachable，取宽读：命宫 ≥2 颗四杀且' +
      '其一落陷。「身命并判」的更宽读法未并入，触发率会更高。',
  },
  {
    no: 8,
    name: '两重华盖',
    note: '谓禄存化禄坐命遇空劫是也',
    status: 'derivable',
    inProject: 'none',
    // 「两重」取严读法：禄存与化禄双禄同坐命（0.60%），再遇空劫（0.064%）。
    // 宽读法（禄存或化禄单禄坐命遇空劫）实测 1.9%。
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '禄存') && hasHua(c, b, '禄') && hasAny(c, b, KONGJIE);
    },
    why:
      '「两重」按双禄同坐命读：禄存坐命且命宫有化禄（年干使某星化禄恰好落在' +
      '禄存宫，17,280 盘 104 例，0.60%），再遇地空地劫，得 11 例（0.064%）。' +
      '历代注家有取单禄宽读者（1.9%），从严。',
  },
];

// ────────────────── 入口 ──────────────────

export interface DingPinHit {
  no: number;
  name: string;
  note: string;
  status: GeStatus;
}

/**
 * 判一张盘的〈定贫贱局〉格。返回顺序即原书序号。
 */
export function detectDingPin(chart: ZiweiChart): DingPinHit[] {
  const out: DingPinHit[] = [];
  for (const g of DING_PIN_GE) {
    if (!g.fn) continue;
    if (g.fn(chart)) {
      out.push({ no: g.no, name: g.name, note: g.note, status: g.status });
    }
  }
  return out;
}

/** 可判定的条目数（八条全部可判，disputed 也带实现） */
export const DING_PIN_JUDGEABLE = DING_PIN_GE.filter(g => !!g.fn).length;

/** 安星无解的条目（本表为空） */
export const DING_PIN_UNREACHABLE = DING_PIN_GE.filter(g => g.status === 'unreachable');
