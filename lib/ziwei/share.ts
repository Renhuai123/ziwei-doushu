import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import {
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  shiftGregorianDate,
  type GregorianDate,
} from './true-solar-time';
import { birthUtcOffsetMinutes, calendarZoneInfo, type CalendarZone, type VietnamRegion } from './calendar-zone';
import { findProvince } from './cities';

/**
 * Canh giờ (0-11) theo giờ mặt trời thật tại nơi sinh.
 *
 * ★ 2026-11: thêm `utcOffsetMinutes` (độ lệch chuẩn tại nơi sinh, đông dương tây âm) —
 *   hiệu chỉnh kinh độ thành (kinh độ − utcOffsetMinutes/4) × 4, tức Việt Nam lấy 105°Đ.
 *   Không truyền thì vẫn là múi 120°Đ như cũ.
 *
 * ★ 2026-11 (lần 2): nhận thêm `date`. Khi có ngày, đi qua `calculateTrueSolarTime()`
 *   để cộng cả **phương trình thời gian** (均时差, ±16 phút) — đúng như README mô tả
 *   "真太阳时校正（经度差 + 均时差）". Nhờ vậy canh giờ hiển thị trên form khớp tuyệt đối
 *   với canh giờ dùng để an lá số.
 *
 * Không có kinh độ (chưa chọn nơi sinh) → không hiệu chỉnh gì, giữ đúng quy ước
 * "không chọn nơi sinh thì kết quả không đổi".
 */
export function calcTrueSolarBranch(
  clockHour: number,
  clockMinute: number,
  longitude?: number,
  utcOffsetMinutes = 480,
  date?: GregorianDate,
): number {
  if (date) {
    return calculateTrueSolarTime({ ...date, clockHour, clockMinute, longitude, utcOffsetMinutes }).branch;
  }
  const clockMins = clockHour * 60 + clockMinute;
  const hasLongitude = longitude !== undefined && Number.isFinite(longitude);
  const meridian = Number.isFinite(utcOffsetMinutes) ? utcOffsetMinutes / 4 : 120;
  const offset = hasLongitude ? (longitude! - meridian) * 4 : 0;
  const solar = ((clockMins + offset) % 1440 + 1440) % 1440;
  if (solar >= 1380 || solar < 60) return 0;
  return Math.floor((solar - 60) / 120) + 1;
}

/** BirthFormState → BirthInfo
 *
 * 子时规则（倪海厦体系/三合派标准）：
 * · 23:00-23:59 = 晚子时，**按次日**排盘（日期 +1）
 * · 00:00-00:59 = 早子时，按本日排盘
 * 这与「时辰支同为子(0)」并不冲突——子时分早晚两段，需要在日期上区分。
 */
export function formToBirthInfo(form: BirthFormState): BirthInfo {
  let y = parseInt(form.year) || 0;
  let m = parseInt(form.month) || 0;
  let d = parseInt(form.day) || 0;
  let hour = 0;

  // 出生地时区：越南 UTC+7（含 1975 年前 miền Nam UTC+8 的历史时段），
  // 未选出生地时按当前日历分区（默认中国 UTC+8，与旧行为一致）。
  const provinceInfo = form.province ? findProvince(form.province) : undefined;
  const zone: CalendarZone = form.calendarZone ?? provinceInfo?.calendarZone ?? 'cn';
  const region: VietnamRegion | undefined = zone === 'vn'
    ? (form.vnRegion ?? provinceInfo?.region)
    : undefined;
  const utcOffsetMinutes = form.province
    ? birthUtcOffsetMinutes(zone, y, m, d, region)
    : calendarZoneInfo(zone).utcOffsetMinutes;

  // 晚子时换日按真太阳时判定，与时辰支同一口径（见 true-solar-time.ts 的 resolveZiweiDayOffset）。
  // 只看钟表 23 点会和经度校正后的时辰错位：东经 100° 钟表 23:30 是真太阳时 22:10 亥时，不该换日。
  if (!form.unknownTime) {
    // Giờ mặt trời thật = giờ đồng hồ + hiệu chỉnh kinh độ + phương trình thời gian (均时差).
    // Dùng chung một hàm với `true-solar-time.ts` để canh giờ và ngày đổi Tý luôn cùng một quy ước.
    const solar = calculateTrueSolarTime({
      year: y,
      month: m,
      day: d,
      clockHour: parseInt(form.clockHour) || 0,
      clockMinute: parseInt(form.clockMinute) || 0,
      // Chưa chọn nơi sinh → không hiệu chỉnh (đúng quy ước cũ), chỉ dùng giờ đồng hồ.
      longitude: form.province ? form.longitude : undefined,
      utcOffsetMinutes,
    });
    hour = solar.branch;
    const dayOffset = resolveZiweiDayOffset(solar);
    if (dayOffset !== 0 && y > 0 && m > 0 && d > 0) {
      ({ year: y, month: m, day: d } = shiftGregorianDate({ year: y, month: m, day: d }, dayOffset));
    }
  }

  return {
    year: y, month: m, day: d,
    hour,
    gender: form.gender,
    name: form.name || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    longitude: form.province ? form.longitude : undefined,
    calendarZone: zone,
    utcOffsetMinutes,
  };
}

/** BirthFormState → URLSearchParams（用于分享链接） */
export function formToSearchParams(form: BirthFormState): URLSearchParams {
  const p = new URLSearchParams();
  if (form.name) p.set('n', form.name);
  p.set('y', form.year);
  p.set('m', form.month);
  p.set('d', form.day);
  if (form.unknownTime) {
    p.set('u', '1');
  } else {
    p.set('h', form.clockHour);
    p.set('mi', form.clockMinute);
  }
  if (form.province) p.set('p', form.province);
  if (form.city) p.set('c', form.city);
  if (form.longitude && form.longitude !== 120) p.set('lo', String(form.longitude));
  if (form.calendarZone && form.calendarZone !== 'cn') p.set('z', form.calendarZone);
  if (form.vnRegion) p.set('rg', form.vnRegion);
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整时返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
  const zoneParam = params.get('z');
  const regionParam = params.get('rg');
  return {
    name: params.get('n') || '',
    year,
    month,
    day,
    unknownTime: params.get('u') === '1',
    clockHour: params.get('h') || '8',
    clockMinute: params.get('mi') || '0',
    province: params.get('p') || '',
    city: params.get('c') || '',
    longitude: parseFloat(params.get('lo') || '120'),
    calendarZone: zoneParam === 'vn' || zoneParam === 'cn' ? zoneParam : undefined,
    vnRegion: regionParam === 'north' || regionParam === 'south' ? regionParam : undefined,
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
