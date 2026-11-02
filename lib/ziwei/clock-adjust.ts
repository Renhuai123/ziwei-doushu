/**
 * 出生钟表时间平移（夏令时 / 当年时区与现在不同）—— 纯函数，排盘引擎层。
 *
 * 用途：出生那天当地在实行夏令时（如中国大陆 1986–1991 年夏季，见 dst-cn.ts），或当年时区与现在不同时，
 * 用户报的往往是当年钟表读数。排盘口径按标准时间算（true-solar-time.ts），所以要先把钟表读数换成标准时间。
 * 建议做成「用户亲手点、可撤销」的按钮，**不要自动改**：程序无法知道用户填的是当年钟表读数，还是已换算过的标准时间
 * （主流排盘软件也只提示、不自动减，见 dst-cn.ts 文件头）。
 *
 * 换算方向：标准时间 = 钟表读数 −（当年实际偏移 − 标准偏移）。
 *   · 中国大陆 1986–1991 夏令时：差 +60 分钟 → 减 60；
 *   · 海外夏令时同理（如美东 −4:00 对 −5:00 → 减 60）；当年时区比现在慢（如马来西亚 1982 年前 +7:30、现在 +8:00）：差 −30 → 加 30。
 *
 * 跨日（结果不在 0:00–23:59）一律给 null，不替用户改日期：农历月大小、闰月、晚子时换日交织，
 * 自动跨日容易改错，交给用户手动改日期和时间。
 */

export interface ClockTime { clockHour: string; clockMinute: string }

/** 当年钟表读数 → 标准时间要平移的分钟数（actual、std 都是相对 UTC 的分钟偏移，东正西负） */
export function clockToStandardDelta(actualOffsetMin: number, stdOffsetMin: number): number {
  return stdOffsetMin - actualOffsetMin;
}

/** 钟表时间平移 deltaMin 分钟；时 / 分没填、不是整数、或平移后跨日，给 null */
export function shiftClock(t: ClockTime, deltaMin: number): ClockTime | null {
  if (t.clockHour === '' || t.clockMinute === '') return null;
  const h = Number(t.clockHour); const m = Number(t.clockMinute);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  if (!Number.isInteger(deltaMin) || deltaMin === 0) return null;
  const total = h * 60 + m + deltaMin;
  if (total < 0 || total >= 24 * 60) return null;
  return { clockHour: String(Math.floor(total / 60)), clockMinute: String(total % 60) };
}

/** 「HH:MM」两位补零 */
export function formatClock(t: ClockTime): string {
  return `${t.clockHour.padStart(2, '0')}:${t.clockMinute.padStart(2, '0')}`;
}
