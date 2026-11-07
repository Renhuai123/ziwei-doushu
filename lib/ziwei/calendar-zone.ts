/**
 * Múi giờ & kinh tuyến chuẩn dùng cho lá số — Việt Nam (UTC+7 / 105°Đ) và Trung Quốc (UTC+8 / 120°Đ).
 *
 * ── Vì sao cần tách khỏi phần lịch ───────────────────────────────────────
 * Một lá số phụ thuộc hai thứ khác nhau:
 *   1. **Lịch âm** (tháng/ngày/năm âm) → xem `vn-lunar.ts` (Việt Nam) và lunar-javascript (Trung Quốc);
 *   2. **Giờ** (giờ đồng hồ địa phương + kinh độ nơi sinh) → xem `true-solar-time.ts` + file này.
 * Trước đây cả hai đều ngầm định giờ Bắc Kinh, nên người sinh ở Việt Nam bị lệch:
 * giờ đồng hồ Việt Nam chậm hơn Bắc Kinh 1 giờ, nhưng hiệu chỉnh kinh độ lại so với 120°Đ
 * → giờ mặt trời thật lệch ~1 giờ, đủ để sang một trong 12 canh giờ khác (mỗi canh 2 giờ).
 *
 * ── Kinh tuyến và múi giờ ───────────────────────────────────────────────
 * Việt Nam dùng UTC+7, kinh tuyến chuẩn 105°Đ (Quyết định 134/2002/QĐ-TTg; trước 1968 miền Bắc
 * và sau 1975-06-13 cả nước). Trung Quốc dùng UTC+8, kinh tuyến chuẩn 120°Đ.
 *
 * ── Lịch sử múi giờ Việt Nam (chỉ ảnh hưởng người sinh trước 1975) ──────
 * Nguồn: Wikipedia "Giờ ở Việt Nam" / "Time in Vietnam" (IANA tzdata Asia/Ho_Chi_Minh).
 *   · 1911-05-01 → 1942-12-31  UTC+7  (Giờ Đông Dương)
 *   · 1943-01-01 → 1945-03-14  UTC+8  (chính quyền Vichy đổi giờ)
 *   · 1945-03-15 → 1945-09-01  UTC+9  (quân Nhật, giờ Tokyo)
 *   · 1945-09-02 → 1947-03-31  UTC+7  (Việt Nam Dân chủ Cộng hoà công bố)
 *   · 1947-04-01 → 1954         miền Bắc UTC+7, vùng chiến sự (miền Nam) UTC+8
 *   · 1955-07-01 → 1959-12-31   miền Nam UTC+7
 *   · 1960-01-01 → 1975-06-12   miền Nam UTC+8 (giờ Sài Gòn)
 *   · 1968-01-01 → 1975-06-12   miền Bắc UTC+7
 *   · 1975-06-13 → nay         cả nước UTC+7
 * Việt Nam không có giờ mùa hè (DST) — khác Trung Quốc 1986–1991 (xem `dst-cn.ts`).
 *
 * Lưu ý: người sinh ở miền Nam trước 1975-06-13 báo "giờ trên đồng hồ" thường là giờ Sài Gòn UTC+8.
 * Ta hiểu giờ đồng hồ là giờ pháp định tại nơi sinh, nên dùng đúng độ lệch lịch sử để tính giờ mặt trời thật
 * — đây là cách hiểu đúng bản chất múi giờ, không phải "tự ý trừ 1 giờ" như chuyện DST.
 */

/** Vùng địa lý dùng để tra độ lệch giờ lịch sử (chia theo vĩ tuyến 17 thời kỳ 1954–1975). */
export type VietnamRegion = 'north' | 'south';

export type CalendarZone = 'vn' | 'cn';

export interface CalendarZoneInfo {
  /** Độ lệch chuẩn hiện hành (phút, đông dương) */
  utcOffsetMinutes: number;
  /** Kinh tuyến chuẩn hiện hành (độ đông) = utcOffsetMinutes / 4 */
  meridian: number;
  label: string;
}

export const CALENDAR_ZONES: Record<CalendarZone, CalendarZoneInfo> = {
  vn: { utcOffsetMinutes: 7 * 60, meridian: 105, label: 'Việt Nam (UTC+7)' },
  cn: { utcOffsetMinutes: 8 * 60, meridian: 120, label: 'Trung Quốc (UTC+8)' },
};

export const DEFAULT_CALENDAR_ZONE: CalendarZone = 'cn';

export function calendarZoneInfo(zone: CalendarZone | undefined): CalendarZoneInfo {
  return CALENDAR_ZONES[zone ?? DEFAULT_CALENDAR_ZONE];
}

interface VnOffsetSpan {
  startYear: number;
  startMonth: number;
  startDay: number;
  endYear: number;
  endMonth: number;
  endDay: number;
  offsetMinutes: number;
  region: VietnamRegion | 'all';
}

/** Các giai đoạn múi giờ Việt Nam khác UTC+7 (ngày bắt đầu/kết thúc đều tính). */
const VN_OFFSET_SPANS: readonly VnOffsetSpan[] = [
  { startYear: 1943, startMonth: 1, startDay: 1, endYear: 1945, endMonth: 3, endDay: 14, offsetMinutes: 8 * 60, region: 'all' },
  { startYear: 1945, startMonth: 3, startDay: 15, endYear: 1945, endMonth: 9, endDay: 1, offsetMinutes: 9 * 60, region: 'all' },
  { startYear: 1947, startMonth: 4, startDay: 1, endYear: 1955, endMonth: 6, endDay: 30, offsetMinutes: 8 * 60, region: 'south' },
  { startYear: 1960, startMonth: 1, startDay: 1, endYear: 1975, endMonth: 6, endDay: 12, offsetMinutes: 8 * 60, region: 'south' },
];

function numberOf(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

/**
 * Độ lệch giờ pháp định của Việt Nam tại một ngày (phút).
 * `region` không truyền = chỉ xét các giai đoạn áp dụng cho cả nước.
 */
export function vietnamUtcOffsetMinutes(
  year: number,
  month: number,
  day: number,
  region?: VietnamRegion,
): number {
  const date = numberOf(year, month, day);
  for (const span of VN_OFFSET_SPANS) {
    if (span.region !== 'all' && span.region !== region) continue;
    if (date >= numberOf(span.startYear, span.startMonth, span.startDay)
      && date <= numberOf(span.endYear, span.endMonth, span.endDay)) {
      return span.offsetMinutes;
    }
  }
  return 7 * 60;
}

/**
 * Kinh tuyến chuẩn của giờ đồng hồ tại nơi sinh (độ đông) — dùng cho hiệu chỉnh kinh độ
 * trong `true-solar-time.ts`: (kinh độ nơi sinh − kinh tuyến chuẩn) × 4 phút.
 */
export function meridianForBirth(
  zone: CalendarZone | undefined,
  year: number,
  month: number,
  day: number,
  region?: VietnamRegion,
): number {
  if (zone === 'vn') return vietnamUtcOffsetMinutes(year, month, day, region) / 4;
  return calendarZoneInfo(zone).meridian;
}

/** Độ lệch giờ pháp định tại nơi sinh (phút) — dùng làm `utcOffsetMinutes` cho hiệu chỉnh kinh độ. */
export function birthUtcOffsetMinutes(
  zone: CalendarZone | undefined,
  year: number,
  month: number,
  day: number,
  region?: VietnamRegion,
): number {
  return meridianForBirth(zone, year, month, day, region) * 4;
}
