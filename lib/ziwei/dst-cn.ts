/**
 * 中国大陆夏令时判定 —— 逐字对齐主流排盘口径。
 *
 * 起因：用户留言（2026-08-13）「1986年至1992年中国大陆执行夏令时，不知道该软件是否核算在内？」
 * 当时答案是「没有」：lib/ziwei/true-solar-time.ts 的口径只有「东八区钟表时间 + 经度修正 + 均时差」，
 * 全站搜不到任何夏令时处理，表单也无提示。
 *
 * 为什么这条要紧：夏令时期间钟表拨快 1 小时，而时辰是 2 小时一档 ——
 * 出生时刻落在时辰边界的人，命宫/身宫/大限会整个换掉。比经度修正（最多 17 分钟）严重得多。
 *
 * ── 数据来源与口径 ───────────────────────────────────────────────
 * 表与判定逻辑**按通行口径整理**（XLS_CN 表与其判定函数），并经金标准盘核对。
 * 本仓铁律是「排盘必须与主流排盘口径一致」，所以照抄，不按自己的理解改。
 *
 * 与 IANA tzdata（Asia/Shanghai）比对过（2026-08-24，用 Node ICU 逐日采样）：
 *   · 1986/1987/1989/1990/1991 起始日**完全一致**；
 *   · 结束日主流口径一律比 IANA「最后一个整天」晚 1 天 —— 这是语义差异不是数据差异：
 *     IANA 在结束日 02:00 转换，主流口径把整个转换日算作夏令时；
 *   · **1988 起始日是真分歧**：主流口径 4/10，IANA 4/17（两天都是周日）。按铁律取主流口径。
 *   · 1979 年之前分歧较大：IANA 的 Asia/Shanghai 对战乱年代与建国初期记录零散
 *     （多数年份记为无夏令时），主流口径用的是一张简化的全国表。同样按铁律取主流口径。
 *
 * ── 为什么只提示、不自动减 1 小时 ─────────────────────────────
 * 主流排盘软件本身就只是弹窗告知（判定为夏令时时提示一段说明文案，
 * 全程没有任何减 1 小时的动作）。这个设计是对的：
 *   **我们无法知道用户报的是夏令时读数、还是他自己已经换算过的标准时。**
 * 默默减一小时既可能算错，又会把所有存量历史命盘悄悄改掉。所以只告知，让用户自己决定。
 * 2026-09-30 站长同意：合盘电脑宽屏的夏令时说明浮层里给一个「减 1 小时，改为 07:30」按钮 ——
 *   仍是**用户自己点**、点了可撤销，从不自动减（components/heming/HemingStepForm.tsx）。
 */

/** 通行口径 XLS_CN，逐字照抄：[年, 起月, 起日, 止月, 止日]，起止日**都含**。 */
const XLS_CN: readonly (readonly [number, number, number, number, number])[] = [
  [1935, 5, 1, 9, 30], [1936, 5, 1, 9, 30], [1937, 5, 1, 9, 30], [1938, 5, 1, 9, 30],
  [1939, 5, 1, 9, 30], [1940, 5, 1, 9, 30], [1941, 5, 1, 9, 30], [1942, 5, 1, 9, 30],
  [1943, 5, 1, 9, 30], [1944, 5, 1, 9, 30], [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30],
  [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30], [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30],
  [1951, 5, 1, 9, 30], [1952, 3, 1, 10, 31], [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
  [1955, 5, 1, 9, 30], [1956, 5, 1, 9, 30], [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30],
  [1959, 4, 1, 9, 30], [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30], [1974, 4, 1, 10, 31],
  [1975, 4, 1, 10, 31], [1979, 7, 1, 9, 30], [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13],
  [1988, 4, 10, 9, 11], [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15],
] as const;

/**
 * 该公历日期是否处于中国大陆夏令时期间。
 *
 * ★ 判定逻辑逐字对齐通行口径（见文件头注）：**纯按日期**，不看小时。
 *   原式：
 *     if (month > m1 && month < m2) return true;
 *     if (month == m1) { if (day >= d1) return true; }
 *     else if (month == m2) { if (day <= d2) return true; }
 *   注意 `else if` —— 当 month == m1 且 day < d1 时不会再去比 m2 分支，这与通行口径一致，别「顺手优化」。
 */
export function isChinaDST(year: number, month: number, day: number): boolean {
  for (const [y, m1, d1, m2, d2] of XLS_CN) {
    if (year !== y) continue;
    if (month > m1 && month < m2) return true;
    if (month === m1) {
      if (day >= d1) return true;
    } else if (month === m2) {
      if (day <= d2) return true;
    }
  }
  return false;
}

/** 该年是否在夏令时表内（用于表单在用户选年份时就提前提示，不必等排完盘）。 */
export function isChinaDSTYear(year: number): boolean {
  return XLS_CN.some(([y]) => y === year);
}

/** 该年的夏令时区间（供文案展示）。不在表内返回 null。 */
export function chinaDSTRange(year: number): { start: string; end: string } | null {
  const hit = XLS_CN.find(([y]) => y === year);
  if (!hit) return null;
  const [, m1, d1, m2, d2] = hit;
  return { start: `${m1} 月 ${d1} 日`, end: `${m2} 月 ${d2} 日` };
}

/** 该年的夏令时起止（数字，供英文等其他语言自己拼月日；起止都含）。不在表内返回 null。 */
export function chinaDSTSpan(year: number): { startMonth: number; startDay: number; endMonth: number; endDay: number } | null {
  const hit = XLS_CN.find(([y]) => y === year);
  if (!hit) return null;
  const [, startMonth, startDay, endMonth, endDay] = hit;
  return { startMonth, startDay, endMonth, endDay };
}

/** 表内覆盖的全部年份（升序），供文案与回归使用。 */
export function chinaDSTYears(): number[] {
  return XLS_CN.map(([y]) => y);
}
