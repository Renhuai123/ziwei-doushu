/**
 * formToBirthInfo：晚子时换日要按真太阳时判定，与时辰支同一口径。
 *
 * 换日曾只看钟表「23 点」，与校正后的时辰错位时排盘日差一天。
 * 以下 2000-01-31 样例计入经度修正和均时差（约 -13 分钟）。
 * 换日口径与 lib/ziwei/true-solar-time.ts 的 resolveZiweiDayOffset('next-day') 一致。
 */
import assert from 'node:assert/strict';
import { formToBirthInfo, formToSearchParams, searchParamsToForm } from '../../lib/ziwei/share';
import type { BirthFormState } from '../../components/BirthForm';

function formAt(clockHour: string, clockMinute: string, longitude: number): BirthFormState {
  return {
    name: '',
    year: '2000',
    month: '1',
    day: '31',
    clockHour,
    clockMinute,
    unknownTime: false,
    province: longitude === 120 ? '' : '测试',
    city: '',
    longitude,
    gender: 'male',
  };
}

const pick = (b: ReturnType<typeof formToBirthInfo>) => ({ year: b.year, month: b.month, day: b.day, hour: b.hour });

const cases: Array<[string, string, number, { year: number; month: number; day: number; hour: number }, string]> = [
  ['23', '30', 120, { year: 2000, month: 2, day: 1, hour: 0 }, '东经 120° 23:30 晚子时 → 次日子时'],
  ['0', '30', 120, { year: 2000, month: 1, day: 31, hour: 0 }, '东经 120° 00:30 早子时 → 本日子时'],
  ['23', '30', 100, { year: 2000, month: 1, day: 31, hour: 11 }, '东经 100° 23:30 → 本日亥时'],
  ['22', '30', 135, { year: 2000, month: 2, day: 1, hour: 0 }, '东经 135° 22:30 → 次日子时'],
  ['0', '30', 80, { year: 2000, month: 1, day: 30, hour: 11 }, '东经 80° 00:30 → 前一日亥时'],
  ['23', '50', 130, { year: 2000, month: 2, day: 1, hour: 0 }, '东经 130° 23:50 → 次日子时'],
];

for (const [h, mi, lon, expected, label] of cases) {
  assert.deepEqual(pick(formToBirthInfo(formAt(h, mi, lon))), expected, label);
}

const unknown = formToBirthInfo({ ...formAt('23', '30', 100), unknownTime: true });
assert.deepEqual(pick(unknown), { year: 2000, month: 1, day: 31, hour: 0 }, '时辰不详不换日');

for (const longitude of [0, -180, 180, 120, 116.4]) {
  const form = formAt('8', '0', longitude);
  assert.equal(searchParamsToForm(formToSearchParams(form))?.longitude, longitude, '分享链接保留有效经度');
}

for (const invalid of ['', ' ', 'Infinity', 'NaN', '116.4abc', '-181', '181']) {
  const params = new URLSearchParams({ y: '2000', m: '1', d: '31', lo: invalid });
  assert.equal(searchParamsToForm(params)?.longitude, 120, '无效经度使用分享链接的默认值');
}

assert.equal(formToSearchParams(formAt('8', '0', Number.NaN)).has('lo'), false);

console.log('form true-solar day rollover regression passed');
