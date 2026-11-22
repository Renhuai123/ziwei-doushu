import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import { calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate } from './true-solar-time';

/** Kinh tuyến trung tâm của múi giờ đồng hồ (độ). UTC+8 → 120°, UTC+7 → 105°. */
function clockMeridian(utcOffsetMinutes?: number): number {
  return utcOffsetMinutes !== undefined && Number.isFinite(utcOffsetMinutes) ? utcOffsetMinutes / 4 : 120;
}

/** Số phút hiệu chỉnh kinh độ: (kinh độ nơi sinh − kinh tuyến múi giờ) × 4 */
export function longitudeOffsetMinutes(longitude: number, utcOffsetMinutes?: number): number {
  return (longitude - clockMeridian(utcOffsetMinutes)) * 4;
}

function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180;
}

/** Giờ mặt trời thực của form — dùng chung cho cả preview và submit, bao gồm phương trình thời gian. */
export function formToTrueSolarTime(form: Pick<BirthFormState, 'year' | 'month' | 'day' | 'clockHour' | 'clockMinute' | 'province' | 'longitude' | 'utcOffsetMinutes'>) {
  return calculateTrueSolarTime({
    year: parseInt(form.year) || 0,
    month: parseInt(form.month) || 0,
    day: parseInt(form.day) || 0,
    clockHour: parseInt(form.clockHour) || 0,
    clockMinute: parseInt(form.clockMinute) || 0,
    longitude: form.province ? form.longitude : undefined,
    utcOffsetMinutes: form.utcOffsetMinutes,
  });
}

/** BirthFormState → BirthInfo
 *
 * 子时规则（倪海厦体系/三合派标准，以下均按真太阳时）：
 * · 23:00-23:59 = 晚子时，**按次日**排盘（日期 +1）
 * · 00:00-00:59 = 早子时，按本日排盘
 * 这与「时辰支同为子(0)」并不冲突——子时分早晚两段，需要在日期上区分。
 */
export function formToBirthInfo(form: BirthFormState): BirthInfo {
  let y = parseInt(form.year) || 0;
  let m = parseInt(form.month) || 0;
  let d = parseInt(form.day) || 0;
  let hour = 0;

  // Đổi ngày giờ Tý muộn theo giờ mặt trời thực (cùng khẩu kính với chi giờ).
  if (!form.unknownTime) {
    const solar = formToTrueSolarTime(form);
    hour = solar.branch;
    const dayOffset = resolveZiweiDayOffset(solar);
    if (dayOffset !== 0 && solar.dateValid) {
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
  if (form.longitude !== 120 && isValidLongitude(form.longitude)) p.set('lo', String(form.longitude));
  if (form.utcOffsetMinutes !== undefined && form.utcOffsetMinutes !== 480) p.set('tz', String(form.utcOffsetMinutes));
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整时返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
  const rawLongitude = params.get('lo')?.trim();
  const longitude = rawLongitude ? Number(rawLongitude) : 120;
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
    longitude: (() => { const rawLo = params.get('lo')?.trim(); const lo = rawLo ? Number(rawLo) : 120; return isValidLongitude(lo) ? lo : 120; })(),
    utcOffsetMinutes: params.get('tz') !== null ? parseInt(params.get('tz')!, 10) : undefined,
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
