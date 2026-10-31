import assert from 'node:assert/strict';
import type { BirthFormState } from '../../components/BirthForm';
import { formToBirthInfo, resolveBirthTime } from '../../lib/ziwei/share';
import { formatTrueSolarClock } from '../../lib/ziwei/true-solar-time';
import { generateChart } from '../../lib/ziwei/algorithm';

const base: BirthFormState = {
  name: '', year: '1990', month: '6', day: '15', clockHour: '23', clockMinute: '10',
  unknownTime: false, province: '测试', city: '', longitude: 87.62, gender: 'male',
};
const cases: { name: string; input: Partial<BirthFormState>; expected: [number, number, number, number]; clock: string | null; offset: number }[] = [
  { name: '乌鲁木齐', input: {}, expected: [1990, 6, 15, 11], clock: '21:00', offset: 0 },
  { name: '佳木斯', input: { clockHour: '22', clockMinute: '50', longitude: 130.32 }, expected: [1990, 6, 16, 0], clock: '23:31', offset: 1 },
  { name: '喀什', input: { clockHour: '1', clockMinute: '30', longitude: 75.99 }, expected: [1990, 6, 14, 11], clock: '22:34', offset: -1 },
  { name: '北京', input: { longitude: 116.41 }, expected: [1990, 6, 15, 11], clock: '22:55', offset: 0 },
  { name: '未填出生地', input: { province: '', clockMinute: '30' }, expected: [1990, 6, 16, 0], clock: '23:30', offset: 1 },
  { name: '上海跨年', input: { year: '1999', month: '12', day: '31', clockMinute: '40', longitude: 121.47 }, expected: [2000, 1, 1, 0], clock: '23:43', offset: 1 },
  { name: '北京均时差', input: { month: '2', day: '11', clockHour: '1', clockMinute: '25', longitude: 116.41 }, expected: [1990, 2, 11, 0], clock: '00:56', offset: 0 },
  { name: '时辰不详', input: { unknownTime: true }, expected: [1990, 6, 15, 0], clock: null, offset: 0 },
];
for (const { name, input, expected, clock, offset } of cases) {
  const form = { ...base, ...input };
  const result = formToBirthInfo(form);
  const resolved = resolveBirthTime(form);
  assert.deepEqual([result.year, result.month, result.day, result.hour], expected, name);
  assert.equal(resolved.solar ? formatTrueSolarClock(resolved.solar) : null, clock, `${name} 真太阳时`);
  assert.equal(resolved.dayOffset, offset, `${name} 排盘日偏移`);
  assert.equal(resolved.solar?.corrected ?? false, !form.unknownTime && !!form.province, `${name} 校正状态`);
  assert.deepEqual(result.origInput, form.unknownTime ? undefined : {
    year: Number(form.year), month: Number(form.month), day: Number(form.day),
    clockHour: Number(form.clockHour), clockMinute: Number(form.clockMinute),
  }, `${name} 原始输入`);
}
// 合盘的两个输入也通过 formToBirthInfo 后调用同一排盘引擎。
const pair = [base, { ...base, year: '1992', month: '3', day: '8', clockHour: '2', clockMinute: '0', gender: 'female' as const }];
for (const form of pair) {
  const chart = generateChart(formToBirthInfo(form));
  assert.equal(chart.palaces.length, 12, '合盘输入能够生成完整命盘');
  assert.deepEqual(chart.birthInfo.origInput, {
    year: Number(form.year), month: Number(form.month), day: Number(form.day),
    clockHour: Number(form.clockHour), clockMinute: Number(form.clockMinute),
  });
}
console.log('birth time regression: passed');
