/**
 * 命盘链接：把出生信息放在地址的 # 后面（浏览器不会把 # 之后的内容发给服务器），
 * 用于刷新后恢复命盘、把命盘发给别人。编码沿用 share.ts 的 formToSearchParams，
 * 解码时严格校验——链接可能被手改或截断，不合法就当作没有。
 */
import type { BirthFormState } from '@/components/BirthForm';
import { formToSearchParams, searchParamsToForm } from './share';

export const MIN_BIRTH_YEAR = 1900;
/** 可选的最晚出生年份：今年。 */
export const maxBirthYear = () => new Date().getFullYear();

const INT = /^\d{1,4}$/;

function isRealDate(y: number, m: number, d: number) {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** 校验并补全成完整表单；任何一项不合法都返回 null。 */
export function paramsToValidForm(params: URLSearchParams): BirthFormState | null {
  const f = searchParamsToForm(params);
  if (!f) return null;
  const { year = '', month = '', day = '', clockHour = '', clockMinute = '' } = f;
  if (![year, month, day, clockHour, clockMinute].every(v => INT.test(v))) return null;
  const [y, m, d, h, mi] = [year, month, day, clockHour, clockMinute].map(Number);
  if (y < MIN_BIRTH_YEAR || y > maxBirthYear() || !isRealDate(y, m, d)) return null;
  if (h > 23 || mi > 59) return null;
  const g = params.get('g');
  if (g !== 'm' && g !== 'f') return null;
  return {
    name: (f.name ?? '').slice(0, 40),
    year: String(y), month: String(m), day: String(d),
    clockHour: String(h), clockMinute: String(mi),
    unknownTime: !!f.unknownTime,
    province: f.province ?? '', city: f.city ?? '',
    longitude: f.longitude ?? 120,
    gender: f.gender ?? 'male',
  };
}

const hashParams = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''));

/** 单人命盘 /chart */
export const chartHash = (form: BirthFormState) => `#${formToSearchParams(form)}`;
export const formFromHash = (hash: string) => paramsToValidForm(hashParams(hash));

/** 合盘 /heming：两组参数分别嵌在 a= / b= 里 */
export function hemingHash(a: BirthFormState, b: BirthFormState) {
  const p = new URLSearchParams();
  p.set('a', formToSearchParams(a).toString());
  p.set('b', formToSearchParams(b).toString());
  return `#${p}`;
}
export function formsFromHemingHash(hash: string): { a: BirthFormState; b: BirthFormState } | null {
  const p = hashParams(hash);
  const a = paramsToValidForm(new URLSearchParams(p.get('a') ?? ''));
  const b = paramsToValidForm(new URLSearchParams(p.get('b') ?? ''));
  return a && b ? { a, b } : null;
}

/** 改地址栏但不新增历史记录、不触发滚动。 */
export function replaceHash(hash: string) {
  history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
}
