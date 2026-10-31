import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import { calculateTrueSolarTime, resolveZiweiDayOffset, shiftGregorianDate, type GregorianDate, type TrueSolarTimeResult } from './true-solar-time';

/** 统一表单预览和排盘的日期、时辰与真太阳时口径。 */
export function resolveBirthTime(form: BirthFormState): {
  date: GregorianDate;
  branch: number;
  dayOffset: number;
  solar: TrueSolarTimeResult | null;
} {
  const date = { year: Number(form.year), month: Number(form.month), day: Number(form.day) };
  if (form.unknownTime) return { date, branch: 0, dayOffset: 0, solar: null };
  const solar = calculateTrueSolarTime({
    ...date,
    clockHour: Number(form.clockHour),
    clockMinute: Number(form.clockMinute),
    longitude: form.province ? form.longitude : undefined,
  });
  const dayOffset = resolveZiweiDayOffset(solar, 'next-day');
  return { date: dayOffset && solar.dateValid ? shiftGregorianDate(date, dayOffset) : date, branch: solar.branch, dayOffset, solar };
}

/** 描述太阳时跨日与晚子时造成的排盘日变化。 */
export function birthDateChangeNotice(result: ReturnType<typeof resolveBirthTime>): string | null {
  if (!result.dayOffset || !result.solar?.dateValid) return null;
  const { date, solar } = result;
  const label = solar.corrected ? '真太阳时' : '北京时间';
  const reason = solar.branch === 0 && solar.normalizedMinutes >= 1380
    ? `${label}已过 23 点，按晚子时换日`
    : `${label}跨到${solar.dayOffset < 0 ? '前一天' : '后一天'}`;
  return `${reason}，按 ${date.year} 年 ${date.month} 月 ${date.day} 日排盘。`;
}

/** BirthFormState → BirthInfo */
export function formToBirthInfo(form: BirthFormState): BirthInfo {
  const resolved = resolveBirthTime(form);
  return {
    ...resolved.date,
    hour: resolved.branch,
    gender: form.gender,
    name: form.name || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    longitude: form.province ? form.longitude : undefined,
    origInput: form.unknownTime ? undefined : {
      year: Number(form.year), month: Number(form.month), day: Number(form.day),
      clockHour: Number(form.clockHour), clockMinute: Number(form.clockMinute),
    },
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
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整时返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
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
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
