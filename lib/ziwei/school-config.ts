/**
 * 排盘流派配置 — 9 类排盘流派开关 + 默认值 + 持久化
 *
 * 数据源：按通行口径整理（详见 docs/school-alignment.md）
 *
 * 用户在 chart 页设置面板切换，立即重新排盘
 */

import type { BrightnessSchool } from './school-data';

// ─── 9 类流派配置 ───────────────────────────────────────────────────────

/** 1. 14 主星亮度表 */
export type BrightnessSchoolOption = 'default' | BrightnessSchool;

/** 2. 庚年四化（5 种变体）*/
export type GengYearSihua =
  | 'GYWYT'   // 阳武阴同（主流默认口径，与 iztro 一致）
  | 'GYWTY'   // 阳武同阴（科忌互换说）
  | 'GYWFT'   // 阳武府同
  | 'GYWFX'   // 阳武府相
  | 'GYWTX';  // 阳武同相

/** 3. 安天马 */
export type TianmaSchool = 'year-branch' | 'month-branch';

/** 4. 安天空 */
export type TiankongSchool = 'normal' | 'shun-jia-shi';

/** 5. 截空旬空 */
export type JiekongSchool = 'single' | 'double' | 'zhanyan';

/** 6. 安魁钺 */
export type KuiyueSchool = 'qs1' | 'qs2' | 'zhong-yiming' | 'network';

/** 7. 安天使天伤 */
export type TianshiTianshangSchool = 'normal' | 'zhongzhou';

/** 8. 安长生十二神 */
export type ChangshengSchool = 'yin-yang-shun-ni' | 'shui-tu' | 'huo-tu';

/** 9. 晚子时处理 */
export type LateZishi =
  | 'next-day'           // 视为次日（主流默认口径 + 我们当前）
  | 'current-day'        // 视为当日（倪师派）
  | 'all-current'        // 日柱当日时柱当日（八字）
  | 'day-cur-time-next'; // 日柱当日时柱次日（八字）

/** 10. 闰月处理（用户反馈：倪师派要求闰月归下月）*/
export type LeapMonth =
  | 'split'         // 分半（前 15 天归上月，后 15 天归下月）— ★我们默认 = 主流排盘默认口径「月中分界」（2026-09-05 150 组金标准盘对照：9 张闰月后半月盘唯此口径逐星全同）
  | 'next-month'    // 整月归下月（倪师派：闰四月当五月）
  | 'prev-month'    // 整月当本月普通月（闰四月当四月）— 可选口径「视为本月」；早先 2.6 万盘验证针对的是另一套参照引擎，与金标准盘默认口径不一致
  | 'origin-month'; // 不调整（闰四月仍标闰月，iztro fixLeap=false）

// ─── 完整配置对象 ──────────────────────────────────────────────────────

export interface SchoolConfig {
  brightnessSchool: BrightnessSchoolOption;
  gengYearSihua: GengYearSihua;
  tianmaSchool: TianmaSchool;
  tiankongSchool: TiankongSchool;
  jiekongSchool: JiekongSchool;
  kuiyueSchool: KuiyueSchool;
  tianshiTianshang: TianshiTianshangSchool;
  changshengSchool: ChangshengSchool;
  lateZishi: LateZishi;
  leapMonth: LeapMonth;
}

/** 默认配置 = 对齐主流排盘默认口径（辅星六煞杂曜+四化+运限 穷举零差异；闰月口径=整月归本月）*/
/**
 * ★ 2026-09-05 默认闰月口径 prev-month → split：150 组金标准盘对照，随机 100 盘 0 排星差异，
 * 唯一系统性差异是 9 张闰月后半月盘——金标准盘默认「月中分界」(split)，Metis 旧默认整月归本月；切 split 后逐星全同。
 * 站长 2026-09-05 拍板改默认。algorithm / school-patches / yunxian-palace 的兜底默认都引用这一个常量，别再各写字面量。
 */
export const DEFAULT_LEAP_MONTH: LeapMonth = 'split';

/** 四个合法闰月口径，供运行时校验（引擎对非法 policy 抛 RangeError，分享链接解析在到达引擎前回落默认）。 */
const LEAP_MONTH_VALUES: readonly LeapMonth[] = ['split', 'prev-month', 'next-month', 'origin-month'];

export const SCHOOL_DEFAULT_CONFIG: SchoolConfig = {
  brightnessSchool: 'default',           // = 《斗数全书》（algorithm.ts 把 'default' 当 QS 用，对齐主流排盘默认口径，10-20 改）
  gengYearSihua: 'GYWYT',                // 阳武阴同
  tianmaSchool: 'year-branch',           // 依据年支
  tiankongSchool: 'normal',              // 常规
  jiekongSchool: 'double',               // 正副双星
  kuiyueSchool: 'qs1',                   // 斗数全书歌诀理解1
  tianshiTianshang: 'normal',            // 常规
  changshengSchool: 'yin-yang-shun-ni',  // 区分阴阳顺逆
  lateZishi: 'next-day',                 // 视为次日
  leapMonth: DEFAULT_LEAP_MONTH,         // 闰月分半（主流排盘默认口径「月中分界」，150 组金标准盘对照验证）
};

// ─── localStorage 持久化 key ───────────────────────────────────────────
export const SCHOOL_CONFIG_LS_KEY = 'ziwei-school-config-v1';
/** 2026-09-05 闰月默认 prev-month→split 的一次性迁移标记（见 loadSchoolConfig） */
export const SCHOOL_LEAP_MIGRATED_KEY = 'ziwei-school-leap-split-migrated';

/**
 * ★ 2026-10-20 键名统一改名：早期版本存在 `ziwei-<旧名>-config-v1` / `ziwei-<旧名>-leap-split-migrated`。
 * 新键还没有时，把旧键里的流派配置（认 brightnessSchool 字段）与闰月迁移标记搬过来、删掉旧键；只认这两种形状，不碰别的键。
 */
function migrateLegacyKeys(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) keys.push(k); }
    if (localStorage.getItem(SCHOOL_CONFIG_LS_KEY) === null) {
      for (const k of keys) {
        if (k === SCHOOL_CONFIG_LS_KEY || !/^ziwei-[a-z]+-config-v1$/.test(k)) continue;
        const raw = localStorage.getItem(k);
        let parsed: unknown = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch { /* 不是流派配置 */ }
        if (!parsed || typeof parsed !== 'object' || !('brightnessSchool' in parsed)) continue;
        localStorage.setItem(SCHOOL_CONFIG_LS_KEY, raw as string);
        localStorage.removeItem(k);
        break;
      }
    }
    for (const k of keys) {
      if (k === SCHOOL_LEAP_MIGRATED_KEY || !/^ziwei-[a-z]+-leap-split-migrated$/.test(k)) continue;
      if (localStorage.getItem(SCHOOL_LEAP_MIGRATED_KEY) === null) localStorage.setItem(SCHOOL_LEAP_MIGRATED_KEY, localStorage.getItem(k) ?? '1');
      localStorage.removeItem(k);
    }
  } catch { /* localStorage 被禁：照旧走默认 */ }
}

/**
 * 读 localStorage 配置（安全 fallback 到默认）
 * 浏览器端调用，服务端返回默认
 */
export function loadSchoolConfig(): SchoolConfig {
  if (typeof window === 'undefined') return SCHOOL_DEFAULT_CONFIG;
  migrateLegacyKeys();
  try {
    const raw = localStorage.getItem(SCHOOL_CONFIG_LS_KEY);
    if (!raw) return SCHOOL_DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SchoolConfig>;
    // ★ 2026-09-05 一次性迁移：旧默认 prev-month 是被整份存进 localStorage 的（抽屉存完整配置），分不清「默认」还是「手选」；
    //   而旧选项本身就标着「默认」，选它的人要的也是对齐默认口径 → 统一迁到新默认 split，只迁一次（迁移标记），之后再手选 prev-month 就尊重
    if (parsed.leapMonth === 'prev-month' && !localStorage.getItem(SCHOOL_LEAP_MIGRATED_KEY)) {
      parsed.leapMonth = DEFAULT_LEAP_MONTH;
      try { localStorage.setItem(SCHOOL_LEAP_MIGRATED_KEY, '1'); localStorage.setItem(SCHOOL_CONFIG_LS_KEY, JSON.stringify({ ...SCHOOL_DEFAULT_CONFIG, ...parsed })); } catch { /* noop */ }
    }
    return normalizeBrightness({ ...SCHOOL_DEFAULT_CONFIG, ...parsed });
  } catch {
    return SCHOOL_DEFAULT_CONFIG;
  }
}

/**
 * ★ 2026-10-18 默认项与它底层的那张表只留一项（站长：两项排出来一样，别并排摆）。
 * ★ 2026-10-20 默认改成《斗数全书》（主流排盘默认口径，见 algorithm.ts setBrightnessSchool），归并方向随之改：
 *   手选 QS（本机存的、分享链接 bs=QS）一律当默认，勾落在「《斗数全书》派（默认）」；
 *   XD2 不再归并——它现在是单独一项「现代修正 v2」，手选了就尊重。
 *   10-18 到 10-20 之间被归成 'default' 的老 XD2 选择分不出来，随默认一起变成全书（站长定：跟默认口径走）。
 */
function normalizeBrightness(cfg: SchoolConfig): SchoolConfig {
  return cfg.brightnessSchool === 'QS' ? { ...cfg, brightnessSchool: 'default' } : cfg;
}

/** 保存配置到 localStorage */
export function saveSchoolConfig(cfg: SchoolConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHOOL_CONFIG_LS_KEY, JSON.stringify(cfg));
  } catch { /* localStorage 满或被禁 */ }
}

/** 重置为默认 */
export function resetSchoolConfig(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(SCHOOL_CONFIG_LS_KEY); } catch { /* noop */ }
}

// ─── 配置 → URL query 双向转换（用于分享带流派的命盘）────────────────────

/**
 * 流派 URL 参数 key 全集 — 与 configToParams 输出一一对应，10 类配置 10 个 key。
 *
 * ★ 2026-06-12 修「分享链接丢闰月口径」：chart 页此前两处手写 key 数组判断
 *   「URL 是否带流派参数」，都漏了 'lm'（闰月归属）——用户改成 next-month 后分享，
 *   对方打开 ?lm=next-month 被无视、按默认闰月口径排出不同的盘。
 *   今后判断一律复用本常量；configToParams 加字段时必须同步加这里。
 */
export const SCHOOL_PARAM_KEYS = ['bs', 'gys', 'tm', 'tk', 'jk', 'ky', 'tst', 'cs', 'lz', 'lm'] as const;

/** SchoolConfig → URL params（紧凑形式：?bs=qs&sh=GYWTY...）*/
export function configToParams(cfg: SchoolConfig): Record<string, string> {
  const out: Record<string, string> = {};
  if (cfg.brightnessSchool !== 'default') out.bs = cfg.brightnessSchool;
  if (cfg.gengYearSihua !== 'GYWYT') out.gys = cfg.gengYearSihua;
  if (cfg.tianmaSchool !== 'year-branch') out.tm = cfg.tianmaSchool;
  if (cfg.tiankongSchool !== 'normal') out.tk = cfg.tiankongSchool;
  if (cfg.jiekongSchool !== 'double') out.jk = cfg.jiekongSchool;
  if (cfg.kuiyueSchool !== 'qs1') out.ky = cfg.kuiyueSchool;
  if (cfg.tianshiTianshang !== 'normal') out.tst = cfg.tianshiTianshang;
  if (cfg.changshengSchool !== 'yin-yang-shun-ni') out.cs = cfg.changshengSchool;
  if (cfg.lateZishi !== 'next-day') out.lz = cfg.lateZishi;
  if (cfg.leapMonth !== DEFAULT_LEAP_MONTH) out.lm = cfg.leapMonth;   // 老分享链接不带 lm 的，现按新默认 split 解析（与主流排盘默认口径一致）
  return out;
}

/** URLSearchParams → SchoolConfig（缺省字段用默认值填充）*/
export function paramsToConfig(params: URLSearchParams): SchoolConfig {
  return normalizeBrightness({
    brightnessSchool: (params.get('bs') as BrightnessSchoolOption) || SCHOOL_DEFAULT_CONFIG.brightnessSchool,
    gengYearSihua: (params.get('gys') as GengYearSihua) || SCHOOL_DEFAULT_CONFIG.gengYearSihua,
    tianmaSchool: (params.get('tm') as TianmaSchool) || SCHOOL_DEFAULT_CONFIG.tianmaSchool,
    tiankongSchool: (params.get('tk') as TiankongSchool) || SCHOOL_DEFAULT_CONFIG.tiankongSchool,
    jiekongSchool: (params.get('jk') as JiekongSchool) || SCHOOL_DEFAULT_CONFIG.jiekongSchool,
    kuiyueSchool: (params.get('ky') as KuiyueSchool) || SCHOOL_DEFAULT_CONFIG.kuiyueSchool,
    tianshiTianshang: (params.get('tst') as TianshiTianshangSchool) || SCHOOL_DEFAULT_CONFIG.tianshiTianshang,
    changshengSchool: (params.get('cs') as ChangshengSchool) || SCHOOL_DEFAULT_CONFIG.changshengSchool,
    lateZishi: (params.get('lz') as LateZishi) || SCHOOL_DEFAULT_CONFIG.lateZishi,
    // 分享链接的 lm 可能是任意字符串（老链接/手改 URL）；引擎现在对非法 policy 抛
    // RangeError，这里先校验，坏值回落默认口径，别让一张坏链接崩掉整页。
    leapMonth: LEAP_MONTH_VALUES.includes(params.get('lm') as LeapMonth)
      ? (params.get('lm') as LeapMonth)
      : SCHOOL_DEFAULT_CONFIG.leapMonth,
  });
}

// ─── UI 显示用：每个开关的所有选项 + 中文标签 ──────────────────────────

export const SCHOOL_OPTIONS = {
  // ★ 2026-06-17 统一格式(用户要求):每组【默认项】固定排第一,且 desc 统一以「默认 · xxx」开头
  brightnessSchool: [
    // ★ 10-20 默认项 = 《斗数全书》（主流排盘默认口径「星曜亮度依据斗数全书」），底层就是 QS 表，所以不再另列 QS
    { value: 'default', label: '《斗数全书》派', desc: '默认 · 与主流排盘软件默认一致' },
    { value: 'XD2', label: '现代修正 v2', desc: '现代修订亮度表（第二版）' },
    { value: 'XD1', label: '现代修正 v1', desc: '现代修订亮度表（第一版）' },
    { value: 'ZZ', label: '中州派', desc: '中州派理论' },
  ],
  gengYearSihua: [
    { value: 'GYWYT', label: '阳武阴同', desc: '默认 · 与 iztro / 主流一致' },
    { value: 'GYWTY', label: '阳武同阴', desc: '科忌互换说' },
    { value: 'GYWFT', label: '阳武府同' },
    { value: 'GYWFX', label: '阳武府相' },
    { value: 'GYWTX', label: '阳武同相' },
  ],
  tianmaSchool: [
    { value: 'year-branch', label: '依据年支', desc: '默认 · 年支起天马' },
    { value: 'month-branch', label: '依据月支' },
  ],
  tiankongSchool: [
    { value: 'normal', label: '常规排法', desc: '默认 · 常规起天空' },
    { value: 'shun-jia-shi', label: '顺加生时' },
  ],
  jiekongSchool: [
    { value: 'double', label: '正副双星', desc: '默认 · 正副双星并用' },
    { value: 'single', label: '常规单星' },
    { value: 'zhanyan', label: '占验派' },
  ],
  kuiyueSchool: [
    { value: 'qs1', label: '《斗数全书》理解 1', desc: '默认 · 全书歌诀理解一' },
    { value: 'qs2', label: '《斗数全书》理解 2', desc: '差异仅在庚辛壬癸年生人' },
    { value: 'zhong-yiming', label: '钟义明先生书籍排法' },
    { value: 'network', label: '网络流传排法' },
  ],
  tianshiTianshang: [
    { value: 'normal', label: '常规排法', desc: '默认 · 身宫 ±5 位' },
    { value: 'zhongzhou', label: '中州派排法', desc: '生月奇偶 × 性别 交换' },
  ],
  changshengSchool: [
    { value: 'yin-yang-shun-ni', label: '区分阴阳顺逆', desc: '默认 · 阴阳顺逆起长生' },
    { value: 'shui-tu', label: '水土共长生', desc: '土五局起点 = 水二局起点 (申)' },
    { value: 'huo-tu', label: '火土共长生', desc: '土五局起点 = 火六局起点 (寅)' },
  ],
  lateZishi: [
    { value: 'next-day', label: '视为次日', desc: '默认 · 主流做法' },
    { value: 'current-day', label: '视为当日', desc: '倪师派' },
    { value: 'all-current', label: '日柱当日 / 时柱当日（八字）' },
    { value: 'day-cur-time-next', label: '日柱当日 / 时柱次日（八字）' },
  ],
  // ★ 2026-06-17 全站约定:每组默认选项一律排第一；去「天机」二字(避商标侵权)
  // ★ 2026-09-05 默认改为分半：主流排盘默认口径「月中分界」，150 组金标准盘对照唯此口径逐星全同
  leapMonth: [
    { value: 'split', label: '视为分半', desc: '默认 · 「月中分界」，与主流排盘软件默认一致（前 15 天归本月 / 后 15 天归下月，150 组对照盘验证）' },
    { value: 'prev-month', label: '视为本月', desc: '闰四月整月当四月普通月排' },
    { value: 'next-month', label: '视为下月', desc: '倪师派（闰四月整月当五月排）' },
    { value: 'origin-month', label: '保持闰月', desc: '不调整，闰四月仍标闰月' },
  ],
} as const;

/** 10 类配置的中文标签（用于 UI 标题）*/
export const SCHOOL_LABELS: Record<keyof SchoolConfig, string> = {
  brightnessSchool: '星曜亮度表',
  gengYearSihua: '庚年四化',
  tianmaSchool: '安天马',
  tiankongSchool: '安天空',
  jiekongSchool: '安截空旬空',
  kuiyueSchool: '安魁钺',
  tianshiTianshang: '安天使天伤',
  changshengSchool: '长生十二神',
  lateZishi: '晚子时',
  leapMonth: '闰月归属',
};
