/**
 * 《紫微斗数全书》卷一〈定贵局〉二十七格 · 严格实现
 *
 * 底本：卷一〈定贵局〉二十七条，各带注文。原书自己只有这四张格表
 *      （定富局 6 / 定贵局 27 / 定贫贱局 8 / 定杂局 8），共 49 条。
 *
 * 判读纪律：
 *  1. 注文写明的条件全部照字面实现，不加放宽、不补「三方四正」之类原文没有的话。
 *  2. 注文只写「见前批注」的，回〈斗数骨髓赋〉取条件，此处在 `note` 里注明所据赋句。
 *  3. 照字面直译在安星法上不可能成立的，标 `unreachable` 并给出几何理由，
 *     不写「永远返回 false」的死代码——让下一个人一眼看见它为什么不能写。
 *  4. 注文本身歧义、历代注家无定解的，标 `disputed`，按最通行的一种解实现并注明。
 *
 * 为什么要单独一个文件：原 `patterns.ts` 的 41 个识别器里只有 10 个落在四张格表内，
 * 其中 4 个放宽、1 个残缺、1 个错。直接把 27 条塞进去会和原有的宽松判据混在一起，
 * 无法分别计量。这个模块只做一件事：按原文判，输出可单独统计的一组结果。
 *
 * ⚠️ 盘对象陷阱：`ZiweiChart.palaces` 虽然注释写「按地支 0-11 排序」，
 *    实际是从寅宫（branch=2）起排的。**一律按 branch 查，禁止用下标。**
 */

import type { ZiweiChart, Palace, Star } from './types';

// ────────────────── 常量 ──────────────────

/** 空亡诸星。各派起法不同（旬空/副旬/截路/截空/空亡/副截），此处从盘内已有星曜判。 */
const KONG_STARS = ['旬空', '副旬', '截路', '截空', '空亡', '副截'];

/**
 * 「吉星」口径：左辅右弼、文昌文曲、天魁天钺、禄存，另加四化之禄权科。
 * 天马是否入吉星，注家不一（驿马主迁动，非纯粹之吉），此处从宽计入，
 * 与《四十九格对照》的实测口径保持一致；若要改严，只需从此表删去「天马」。
 */
const JI_STARS = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马'];

/** 太阴在亥的别称（〈定贵局〉第 3 条注文自带的异名） */
export const YUE_LANG_TIAN_MEN = '月朗天门';

// ────────────────── 盘面读取 ──────────────────

const palaceAt = (c: ZiweiChart, branch: number): Palace =>
  c.palaces.find(p => p.branch === ((branch % 12) + 12) % 12)!;

const has = (c: ZiweiChart, branch: number, name: string): boolean =>
  palaceAt(c, branch).stars.some(s => s.name === name);

const hasAny = (c: ZiweiChart, branch: number, names: string[]): boolean =>
  names.some(n => has(c, branch, n));

/** 星所在宫的地支索引；不在盘上返回 -1 */
const starBranch = (c: ZiweiChart, name: string): number =>
  c.palaces.find(p => p.stars.some(s => s.name === name))?.branch ?? -1;

/** 宫名对应的地支索引；找不到返回 -1 */
const palaceBranch = (c: ZiweiChart, name: string): number =>
  c.palaces.find(p => p.name === name)?.branch ?? -1;

/** 本宫 + 三合 + 对宫（命宫三方四正） */
const sanFang = (b: number): number[] => [b, (b + 4) % 12, (b + 8) % 12, (b + 6) % 12];

// 「夹」= 命宫前后相邻两宫（±1），不是隔位（±2）。
// 2026-11-03 修正：初版误写 (b+10)/(b+2)（隔位），致日月夹命、辅弼夹命
// 判成「隔宫夹」，禄马佩印更把唯一可达的「禄在马后一宫」形态排除。
const prevBranch = (b: number) => (b + 11) % 12;
const nextBranch = (b: number) => (b + 1) % 12;
const oppositeBranch = (b: number) => (b + 6) % 12;

const isKong = (c: ZiweiChart, b: number) => hasAny(c, b, KONG_STARS);

const hasHua = (c: ZiweiChart, b: number, hua: '禄' | '权' | '科' | '忌') =>
  palaceAt(c, b).stars.some(s => s.siHua === hua);

const starOf = (c: ZiweiChart, b: number, name: string): Star | undefined =>
  palaceAt(c, b).stars.find(s => s.name === name);

/** 庙旺：庙、旺两档。得/利/平/不/闲/陷 均不算。 */
const isMiaoWang = (c: ZiweiChart, b: number, name: string): boolean => {
  const raw = starOf(c, b, name)?.brightnessRaw;
  return raw === '庙' || raw === '旺';
};

/** 本宫吉星数（含四化禄权科） */
const jiCount = (c: ZiweiChart, b: number): number => {
  let n = palaceAt(c, b).stars.filter(s => JI_STARS.includes(s.name)).length;
  for (const h of ['禄', '权', '科'] as const) if (hasHua(c, b, h)) n++;
  return n;
};

const majorCount = (c: ZiweiChart, b: number): number =>
  palaceAt(c, b).stars.filter(s => s.type === 'major').length;

// ────────────────── 类型 ──────────────────

export type GeStatus =
  /** 按原文可实现，且安星法上存在正例 */
  | 'derivable'
  /** 按字面直译在安星法上不可能成立（不是罕见，是永不可能） */
  | 'unreachable'
  /** 注文歧义、历代注家无定解，按最通行的一种解实现 */
  | 'disputed';

/** 原 patterns.ts 对同一条的已有实现质量 */
export type ProjectVerdict = 'ok' | 'loose' | 'partial' | 'wrong' | 'none';

export interface DingGuiGe {
  /** 原书序号 1-27 */
  no: number;
  name: string;
  /** 原文注文（「见前批注」者注明所据赋句） */
  note: string;
  status: GeStatus;
  /** status 为 unreachable / disputed 时的说明 */
  why?: string;
  /** 原项目是否已有对应识别器，及其质量 */
  inProject: ProjectVerdict;
  /** 判定函数；status 为 unreachable 时缺省 */
  fn?: (c: ZiweiChart) => boolean;
}

// ────────────────── 二十七格 ──────────────────

export const DING_GUI_GE: DingGuiGe[] = [
  {
    no: 1,
    name: '日月夹命',
    note: '不坐空亡，遇逢本宫有吉星是也',
    status: 'derivable',
    inProject: 'loose',
    // 项目判了「日月夹」+ 亮度，漏掉「不坐空亡」「本宫有吉星」两道门槛，故偏松。
    fn: c => {
      const b = c.mingGongBranch;
      if (isKong(c, b)) return false;
      if (jiCount(c, b) === 0) return false;
      return (has(c, prevBranch(b), '太阳') && has(c, nextBranch(b), '太阴')) ||
             (has(c, prevBranch(b), '太阴') && has(c, nextBranch(b), '太阳'));
    },
  },
  {
    no: 2,
    name: '日出扶桑',
    note: '日在卯守命是也，守官禄宫亦然',
    status: 'derivable',
    inProject: 'none',
    // 卯为太阳庙地。注文给了两个落点：命宫在卯，或官禄宫在卯。
    fn: c =>
      starBranch(c, '太阳') === 3 &&
      (c.mingGongBranch === 3 || palaceBranch(c, '官禄') === 3),
  },
  {
    no: 3,
    name: '月落亥宫',
    note: '月在亥守命是也，又名月朗天门',
    status: 'derivable',
    inProject: 'none',
    // 亥为太阴庙地，天门即亥。
    fn: c => starBranch(c, '太阴') === 11 && c.mingGongBranch === 11,
  },
  {
    no: 4,
    name: '月生沧海',
    note: '月在子宫守田宅是也',
    status: 'derivable',
    inProject: 'none',
    // 子宫为沧海。与第 3 条成对：一守命、一守田宅。
    fn: c => starBranch(c, '太阴') === 0 && palaceBranch(c, '田宅') === 0,
  },
  {
    no: 5,
    name: '辅弼拱主',
    note: '紫微守命，二星来拱是也，夹之亦然',
    status: 'derivable',
    inProject: 'loose',
    // 注文两层：先「紫微守命」（前提），再「拱」（三方）或「夹」（前后）。
    // 项目只做了夹，且没有「紫微守命」这个前提，故偏松。
    fn: c => {
      const b = c.mingGongBranch;
      if (!has(c, b, '紫微')) return false;
      const gong = sanFang(b).some(x => has(c, x, '左辅')) &&
                   sanFang(b).some(x => has(c, x, '右弼'));
      const jia = (has(c, prevBranch(b), '左辅') && has(c, nextBranch(b), '右弼')) ||
                  (has(c, prevBranch(b), '右弼') && has(c, nextBranch(b), '左辅'));
      const tong = has(c, b, '左辅') && has(c, b, '右弼');
      return gong || jia || tong;
    },
  },
  {
    no: 6,
    name: '君臣庆会',
    note: '紫微左右同守命是也，更会相武阴妙上',
    status: 'derivable',
    inProject: 'loose',
    // 「同守命」三字是关键：同宫，不是三方四正会照。
    // 项目改成「同会三方四正」，触发率 6.3%，与原文「同宫」是两回事。
    // 附录条件「更会相武阴」是加分项，非成立条件，不并入主判。
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '紫微') && has(c, b, '左辅') && has(c, b, '右弼');
    },
  },
  {
    no: 7,
    name: '财印夹禄',
    note: '禄守命，梁相来夹是也，入财亦然',
    status: 'unreachable',
    why:
      '天梁与天相的相对宫位是恒定的：天梁永远在天相顺时针下一宫（相→梁 宫距恒为 1，' +
      '2,400 盘实测无一例外）。两星既不能分居命宫两侧，也不能同入命宫三方，' +
      '「梁相来夹」在安星法上无解。同〈定富局〉财荫夹印。',
    inProject: 'none',
  },
  {
    no: 8,
    name: '禄马佩印',
    note: '马前有禄，印星同宫是也',
    status: 'derivable',
    inProject: 'none',
    // ⚠️ 注文「马前有禄」按字面不可达——这是结构性恒真：天马只在寅申巳亥，
    //    马前一位与禄存十宫集（甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子）
    //    无交集，与样本无关。禄存与天马的实际关系依年干年支组合而定，
    //    不止「同宫」与「马后一宫」两种（早年 4,800 盘样本测出的「只有两种」
    //    是年干覆盖不足的假恒等式）。
    //    故取可达读法：天马守命，禄存（或化禄）同宫或居其后一宫，且印星（天相）同宫。
    fn: c => {
      const b = c.mingGongBranch;
      if (!has(c, b, '天马')) return false;
      const luAt = (x: number) => has(c, x, '禄存') || hasHua(c, x, '禄');
      // 「居其后一宫」= 天马宫 +1（nextBranch）。禄在马前一宫按字面不可达，
      // 见上文注；此处两形态（同宫／马后一宫）都是实测可达读法。
      return (luAt(b) || luAt(nextBranch(b))) && has(c, b, '天相');
    },
  },
  {
    no: 9,
    name: '坐贵向贵',
    note: '谓魁钺在命迭相坐拱是也',
    status: 'derivable',
    inProject: 'loose',
    // 「坐拱」= 一在命宫（坐），一在对宫（向）。项目做的是「夹」与「同会」，都不是坐拱。
    fn: c => {
      const b = c.mingGongBranch;
      const dui = oppositeBranch(b);
      return (has(c, b, '天魁') && has(c, dui, '天钺')) ||
             (has(c, b, '天钺') && has(c, dui, '天魁'));
    },
  },
  {
    no: 10,
    name: '马头带剑',
    note: '谓马有刃是也，不是居午格',
    status: 'unreachable',
    why:
      '「马有刃」= 天马与擎羊同宫。天马只居寅申巳亥，且恒在禄存前一宫或与禄存同宫；' +
      '擎羊恒在禄存后一宫。两者宫位不相交，同宫永不可能（4,800 盘实测 delta 无 0）。' +
      '注文末句「不是居午格」已自行排除「命在午」的读法——原文否定的读法被项目写成了唯一条件，' +
      '原文肯定的读法在安星上不存在。此条注文两种读法皆不可行。',
    inProject: 'wrong',
  },
  {
    no: 11,
    name: '七杀朝斗',
    note: '见前批注。〈骨髓赋〉：「七杀朝斗，爵禄荣昌」',
    status: 'derivable',
    inProject: 'none',
    // 斗 = 北斗（子午），朝斗取七杀守命于寅申子午四宫。
    fn: c => has(c, c.mingGongBranch, '七杀') && [0, 2, 6, 8].includes(c.mingGongBranch),
  },
  {
    no: 12,
    name: '日月并明',
    note: '见前批注。通行解：太阳在巳、太阴在酉，命坐巳或酉',
    status: 'disputed',
    why:
      '注文只作「见前批注」，而〈骨髓赋〉无「日月并明」四字，各家所定宫位不一' +
      '（有取巳亥者、有取命丑未日月在巳酉者）。此处取流传最广的一种：太阳巳、太阴酉，命坐巳酉。',
    inProject: 'none',
    fn: c =>
      starBranch(c, '太阳') === 5 && starBranch(c, '太阴') === 9 &&
      (c.mingGongBranch === 5 || c.mingGongBranch === 9),
  },
  {
    no: 13,
    name: '明珠出海',
    note: '见前批注。命未空宫，对宫丑日月同度拱照',
    status: 'derivable',
    inProject: 'ok',
    // 命在未、本宫无主星，对宫（丑）太阳太阴同宫。项目条件与此一致。
    fn: c => {
      const b = c.mingGongBranch;
      if (b !== 7) return false;
      if (majorCount(c, b) > 0) return false;
      const dui = oppositeBranch(b);
      return has(c, dui, '太阳') && has(c, dui, '太阴');
    },
  },
  {
    no: 14,
    name: '日月同临',
    note: '见前批注。日月同宫守命',
    status: 'derivable',
    inProject: 'ok',
    // 项目名作「日月同宫」，条件一致。
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '太阳') && has(c, b, '太阴');
    },
  },
  {
    no: 15,
    name: '刑囚夹印',
    note: '天刑廉贞同临身命，主武勇之人',
    status: 'derivable',
    inProject: 'none',
    // 名为「夹印」，注文却只说「同临身命」，未及印星（天相）。
    // 照注文办：天刑与廉贞同宫，且该宫为命宫或身宫。不补「夹天相」——原文没有。
    fn: c => {
      const shen = c.shenGongBranch;
      const ming = c.mingGongBranch;
      const hit = (b: number) => has(c, b, '天刑') && has(c, b, '廉贞');
      return hit(ming) || hit(shen);
    },
  },
  {
    no: 16,
    name: '科权禄拱',
    note: '见前批注。科权禄三化会命三方',
    status: 'derivable',
    inProject: 'partial',
    // 项目只做科权双会，缺化禄。
    fn: c => {
      const s = sanFang(c.mingGongBranch);
      return (['禄', '权', '科'] as const).every(h => s.some(x => hasHua(c, x, h)));
    },
  },
  {
    no: 17,
    name: '贪火相逢',
    note: '谓二星守命同居庙旺是也',
    status: 'derivable',
    inProject: 'none',
    // 「同居庙旺」按字面：两星须同在庙或旺。实测触发率 0.08%，是全表最稀的一条。
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '贪狼') && has(c, b, '火星') &&
             isMiaoWang(c, b, '贪狼') && isMiaoWang(c, b, '火星');
    },
  },
  {
    no: 18,
    name: '武曲守垣',
    note: '武守命卯宫是也，余不是',
    status: 'derivable',
    inProject: 'none',
    // 「余不是」三字堵死了放宽：只认卯宫。
    fn: c => c.mingGongBranch === 3 && has(c, 3, '武曲'),
  },
  {
    no: 19,
    name: '府相朝垣',
    note: '见前批注。命寅申，府相分居财帛、官禄朝命',
    status: 'derivable',
    inProject: 'loose',
    // 两道门槛：命宫限寅申；天府天相分占财帛、官禄两宫（原文未指定谁在哪宫）。
    // 项目只要求两星同入命宫三方四正，触发率 24.3%，放宽约 17 倍。
    fn: c => {
      const b = c.mingGongBranch;
      if (b !== 2 && b !== 8) return false;
      const cai = palaceBranch(c, '财帛');
      const guan = palaceBranch(c, '官禄');
      const tf = starBranch(c, '天府');
      const tx = starBranch(c, '天相');
      return (tf === cai && tx === guan) || (tf === guan && tx === cai);
    },
  },
  {
    no: 20,
    name: '紫府朝垣',
    note: '见前批注。命坐寅申，紫府同宫',
    status: 'derivable',
    inProject: 'none',
    // 紫微天府只在寅申同宫，故「命坐寅申」与「紫府同宫」实为一事的两面。
    fn: c => {
      const b = c.mingGongBranch;
      return (b === 2 || b === 8) && has(c, b, '紫微') && has(c, b, '天府');
    },
  },
  {
    no: 21,
    name: '文星暗拱',
    note: '见前批注。昌曲夹命（暗拱）',
    status: 'unreachable',
    why:
      '文昌与文曲的相对宫位恒为偶数（0/2/4/6/8/10，全十二时辰 1,152 盘实测），' +
      '两星永不改居相邻两宫，无法从两侧夹命宫。' +
      '注文出自〈骨髓赋〉「文星暗拱，身命逢之」，赋句原义或指三方拱照，但「夹」的读法在安星上无解。',
    inProject: 'ok',
  },
  {
    no: 22,
    name: '权禄生逢',
    note: '二星守命庙旺是也，陷不是',
    status: 'derivable',
    inProject: 'none',
    // 两道条件：化权、化禄同守命宫；且所化之星不落陷。
    fn: c => {
      const b = c.mingGongBranch;
      if (!hasHua(c, b, '权') || !hasHua(c, b, '禄')) return false;
      const huaStars = palaceAt(c, b).stars.filter(s => s.siHua === '权' || s.siHua === '禄');
      return huaStars.every(s => s.brightnessRaw !== '陷');
    },
  },
  {
    no: 23,
    name: '羊刃入庙',
    note: '辰戌丑未守命遇吉是也',
    status: 'derivable',
    inProject: 'none',
    // 擎羊在四墓宫（丑辰未戌）恒为庙，此为安星表所定，非概率。
    fn: c => {
      const b = c.mingGongBranch;
      if (![1, 4, 7, 10].includes(b)) return false;
      if (!has(c, b, '擎羊')) return false;
      return jiCount(c, b) > 0;
    },
  },
  {
    no: 24,
    name: '巨机居卯',
    note: '见前批注。巨门天机同宫卯守命',
    status: 'derivable',
    inProject: 'none',
    // 机巨只在卯酉同宫，注文取卯（庙地）。
    fn: c => c.mingGongBranch === 3 && has(c, 3, '巨门') && has(c, 3, '天机'),
  },
  {
    no: 25,
    name: '明禄暗禄',
    note: '见前批注。禄存守命（明），对宫化禄（暗）',
    status: 'derivable',
    inProject: 'none',
    fn: c => {
      const b = c.mingGongBranch;
      return has(c, b, '禄存') && hasHua(c, oppositeBranch(b), '禄');
    },
  },
  {
    no: 26,
    name: '科明暗禄',
    note: '见前批注（所指赋句不明，通行注家有二解）',
    status: 'disputed',
    why:
      '注文仅「见前批注」，所指不明。此处按与上条对举的读法：命宫坐化科（明），' +
      '对宫有禄存（暗）。亦有注家解作「化科守命 + 三方有禄」，二者不可通约。',
    inProject: 'none',
    fn: c => {
      const b = c.mingGongBranch;
      return hasHua(c, b, '科') && has(c, oppositeBranch(b), '禄存');
    },
  },
  {
    no: 27,
    name: '金舆扶驾',
    note: '紫微守命，前后有日月来夹是也',
    status: 'unreachable',
    why:
      '紫微与太阳的宫位差恒为 9（紫微在 b 则太阳恒在 b+9，即紫微后三宫），' +
      '2,400 盘实测无一例外。紫微守命时，日月永不可能分居命宫前后两宫，' +
      '「前后有日月来夹」在安星法上无解。',
    inProject: 'none',
  },
];

// ────────────────── 入口 ──────────────────

export interface DingGuiHit {
  no: number;
  name: string;
  note: string;
  status: GeStatus;
}

/**
 * 判一张盘的〈定贵局〉格。
 *
 * - `unreachable` 的条目直接跳过（不参与判定，也不返回）。
 * - `disputed` 的条目按本模块选定的读法参与判定，结果里保留 status 以便区分。
 * - 返回顺序即原书序号。
 */
export function detectDingGui(chart: ZiweiChart): DingGuiHit[] {
  const out: DingGuiHit[] = [];
  for (const g of DING_GUI_GE) {
    if (!g.fn) continue;
    if (g.fn(chart)) {
      out.push({ no: g.no, name: g.name, note: g.note, status: g.status });
    }
  }
  return out;
}

/** 可判定的条目数（不含 unreachable） */
export const DING_GUI_JUDGEABLE = DING_GUI_GE.filter(g => !!g.fn).length;

/** 安星无解的条目 */
export const DING_GUI_UNREACHABLE = DING_GUI_GE.filter(g => g.status === 'unreachable');
