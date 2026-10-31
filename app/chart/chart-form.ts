import type { BirthFormState } from '@/components/BirthForm';
import { searchParamsToForm } from '@/lib/ziwei/share';

export function parseChartForm(params: URLSearchParams): BirthFormState | null {
  const parsed = searchParamsToForm(params);
  if (!parsed) return null;
  const integer = (value: string | null, min: number, max: number) =>
    value !== null && /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
  const y = params.get('y');
  const m = params.get('m');
  const d = params.get('d');
  if (!integer(y, 1900, 2100) || !integer(m, 1, 12) || !integer(d, 1, 31)) return null;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  const gender = params.get('g');
  const unknown = params.get('u');
  if (gender !== null && gender !== 'm' && gender !== 'f') return null;
  if (unknown !== null && unknown !== '1') return null;
  if (params.has('h') && !integer(params.get('h'), 0, 23)) return null;
  if (params.has('mi') && !integer(params.get('mi'), 0, 59)) return null;
  const longitude = params.get('lo');
  if (longitude !== null && (longitude.trim() === '' || !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) return null;
  return {
    name: parsed.name ?? '', year: parsed.year!, month: parsed.month!, day: parsed.day!,
    clockHour: parsed.clockHour ?? '8', clockMinute: parsed.clockMinute ?? '0',
    unknownTime: parsed.unknownTime ?? false, province: parsed.province ?? '', city: parsed.city ?? '',
    longitude: longitude === null ? 120 : Number(longitude), gender: parsed.gender ?? 'male',
  };
}
