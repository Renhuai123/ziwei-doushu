import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import { calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate } from './true-solar-time';

function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180;
}

/** 表单预览和提交共用：北京时间 + 经度修正 + 出生日期对应的均时差。 */
export function formToTrueSolarTime(form: Pick<BirthFormState, 'year' | 'month' | 'day' | 'clockHour' | 'clockMinute' | 'province' | 'longitude'>) {
  return calculateTrueSolarTime({
    year: parseInt(form.year) || 0,
    month: parseInt(form.month) || 0,
    day: parseInt(form.day) || 0,
    clockHour: parseInt(form.clockHour) || 0,
    clockMinute: parseInt(form.clockMinute) || 0,
    longitude: form.province ? form.longitude : undefined,
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

  // 晚子时换日按真太阳时判定，与时辰支同一口径（见 true-solar-time.ts 的 resolveZiweiDayOffset）。
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
    longitude: isValidLongitude(longitude) ? longitude : 120,
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
