/**
 * Âm lịch Việt Nam (Vietnamese lunisolar calendar) — thuật toán thiên văn, múi giờ UTC+7.
 *
 * ── Vì sao phải có module này ─────────────────────────────────────────────
 * `lunar-javascript` (và do đó iztro) tính âm lịch theo **giờ Bắc Kinh UTC+8, kinh tuyến 120°Đ**.
 * Âm lịch Việt Nam tính theo **UTC+7, kinh tuyến 105°Đ**. Chênh nhau 1 giờ nên:
 *   · điểm Sóc (new moon) rơi vào 23:00–24:00 giờ Việt Nam = 00:00–01:00 hôm sau giờ Bắc Kinh
 *     → mùng 1 âm lịch Việt Nam sớm hơn Trung Quốc đúng 1 ngày (≈ 4% số tháng);
 *   · Tết hai nước lệch nhau ở một số năm (1985, 2030, 2053…);
 *   · tháng nhuận có thể đặt khác tháng (ví dụ 1984: Trung Quốc nhuận tháng 10, Việt Nam không nhuận).
 * Với tử vi, lệch 1 ngày âm lịch là đổi vị trí Tử Vi cả lá số, lệch 1 tháng là đổi toàn bộ 12 cung.
 *
 * ── Quy tắc (theo Hồ Ngọc Đức, "Thuật toán tính âm lịch") ─────────────────
 *   1. Ngày mùng 1 là ngày chứa điểm Sóc;
 *   2. Đông chí luôn rơi vào tháng 11 âm lịch;
 *   3. Năm nhuận có 13 tháng; tháng đầu tiên sau Đông chí không chứa Trung khí là tháng nhuận;
 *   4. Tính theo kinh tuyến 105°Đ (UTC+7).
 * Tham chiếu: https://www.xemamlich.uhm.vn/calrules.html
 *
 * Ngoài phạm vi file này: không đụng tới an sao, tứ hoá, giờ — chỉ đổi lịch.
 */

export interface SolarDateParts {
  year: number;
  month: number;
  day: number;
}

export interface VietnameseLunarDate {
  lunarYear: number;
  /** 1–12, luôn dương; tháng nhuận đánh dấu bằng isLeapMonth */
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
}

/** Kinh tuyến chuẩn của giờ Việt Nam: 105°Đ → UTC+7 */
export const VN_TIMEZONE = 7;
/** Kinh tuyến chuẩn của giờ Bắc Kinh: 120°Đ → UTC+8 (dùng khi đối chiếu) */
export const CN_TIMEZONE = 8;

const INT = (value: number) => Math.floor(value);

/** Ngày Julius của một ngày dương lịch (0h). */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = INT((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = day + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

/** Ngày dương lịch từ ngày Julius. */
export function jdToDate(jd: number): SolarDateParts {
  let a: number;
  let b: number;
  let c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  return {
    day: e - INT((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * INT(m / 10),
    year: b * 100 + d - 4800 + INT(m / 10),
  };
}

/**
 * Ngày Julius của ngày chứa điểm Sóc thứ k tính từ Sóc 1900-01-01 (giờ địa phương theo timeZone).
 * Công thức Meeus (Astronomical Algorithms, ch. 49) — bản rút gọn của Hồ Ngọc Đức.
 */
export function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr);
  C1 += 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltaT: number;
  if (T < -11) {
    deltaT = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltaT = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return INT(Jd1 + C1 - deltaT + 0.5 + timeZone / 24);
}

/**
 * Cung hoàng đạo của Mặt Trời (0–11) tại 0h giờ địa phương của ngày Julius `jdn`.
 * 0 = Xuân phân → Cốc vũ, …, 9 = sau Đông chí (Tiểu hàn), …
 */
export function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= Math.PI * 2 * INT(L / (Math.PI * 2));
  return INT((L / Math.PI) * 6);
}

/** Ngày Julius bắt đầu tháng 11 âm lịch của năm dương lịch `year` (tháng chứa Đông chí). */
export function getLunarMonth11(year: number, timeZone: number): number {
  const off = jdFromDate(31, 12, year) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  if (getSunLongitude(nm, timeZone) >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

/** Vị trí tháng nhuận tính từ tháng 11 âm lịch (a11): 1 = tháng ngay sau tháng 11 là nhuận. */
export function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

function isValidSolarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

/** Dương → âm Việt Nam. `timeZone` mặc định 7 (UTC+7, kinh tuyến 105°Đ). */
export function solarToLunarVN(
  year: number,
  month: number,
  day: number,
  timeZone: number = VN_TIMEZONE,
): VietnameseLunarDate {
  if (!isValidSolarDate(year, month, day)) {
    throw new RangeError(`solar date does not exist: ${year}-${month}-${day}`);
  }
  const dayNumber = jdFromDate(day, month, year);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);

  let a11 = getLunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { lunarYear, lunarMonth, lunarDay, isLeapMonth: lunarLeap };
}

/** Âm Việt Nam → dương. `timeZone` mặc định 7. */
export function lunarToSolarVN(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeapMonth = false,
  timeZone: number = VN_TIMEZONE,
): SolarDateParts {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError(`lunar month must be 1-12; received ${lunarMonth}`);
  }
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
    throw new RangeError(`lunar day must be 1-30; received ${lunarDay}`);
  }
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 1) leapMonth += 12;
    if (isLeapMonth && lunarMonth !== leapMonth) {
      throw new RangeError(`lunar year ${lunarYear} has no leap month ${lunarMonth}`);
    }
    if (isLeapMonth || off >= leapOff) off += 1;
  } else if (isLeapMonth) {
    throw new RangeError(`lunar year ${lunarYear} is not a leap year`);
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/**
 * Tên tháng nhuận trong một cửa sổ 12/13 tháng bắt đầu từ tháng 11 (a11). 0 = không nhuận.
 * Tháng nhuận mang tên tháng ngay trước nó → tên = vị trí − 2 (vị trí 1 → tên 11).
 */
function leapMonthNameInWindow(a11: number, b11: number, timeZone: number): number {
  if (b11 - a11 <= 365) return 0;
  const leapOff = getLeapMonthOffset(a11, timeZone);
  const name = leapOff - 2;
  return name < 1 ? name + 12 : name;
}

/**
 * Tháng nhuận của năm âm `lunarYear` (1–12); 0 = không nhuận.
 *
 * Một năm âm trải trên HAI cửa sổ tháng 11: tháng 1–10 nằm trong cửa sổ
 * [tháng 11 năm trước, tháng 11 năm nay), còn tháng 11–12 nằm trong cửa sổ
 * [tháng 11 năm nay, tháng 11 năm sau) — vì tháng nhuận mang tên tháng đứng trước nó.
 * Nếu chỉ xét một cửa sổ sẽ lệch đúng một năm ở các năm nhuận tháng 11/12 (vd. 2033 nhuận tháng 11).
 */
export function leapMonthOfLunarYearVN(lunarYear: number, timeZone: number = VN_TIMEZONE): number {
  const m11Prev = getLunarMonth11(lunarYear - 1, timeZone);
  const m11This = getLunarMonth11(lunarYear, timeZone);
  const m11Next = getLunarMonth11(lunarYear + 1, timeZone);
  const firstHalf = leapMonthNameInWindow(m11Prev, m11This, timeZone);
  if (firstHalf >= 1 && firstHalf <= 10) return firstHalf;
  const secondHalf = leapMonthNameInWindow(m11This, m11Next, timeZone);
  if (secondHalf >= 11) return secondHalf;
  return 0;
}

/** Số ngày của một tháng âm (29 hoặc 30). Tháng không tồn tại trả 0. */
export function lunarMonthDayCountVN(
  lunarYear: number,
  lunarMonth: number,
  isLeapMonth = false,
  timeZone: number = VN_TIMEZONE,
): number {
  const leap = leapMonthOfLunarYearVN(lunarYear, timeZone);
  if (isLeapMonth && leap !== lunarMonth) return 0;
  const start = lunarToSolarVN(1, lunarMonth, lunarYear, isLeapMonth, timeZone);
  // Tháng nhuận mang tên tháng ngay trước nó → sau tháng thường L là tháng nhuận L.
  const nextIsLeap = !isLeapMonth && leap === lunarMonth;
  const nextMonth = nextIsLeap ? lunarMonth : lunarMonth === 12 ? 1 : lunarMonth + 1;
  const nextYear = !nextIsLeap && lunarMonth === 12 ? lunarYear + 1 : lunarYear;
  const next = lunarToSolarVN(1, nextMonth, nextYear, nextIsLeap, timeZone);
  return jdFromDate(next.day, next.month, next.year) - jdFromDate(start.day, start.month, start.year);
}
