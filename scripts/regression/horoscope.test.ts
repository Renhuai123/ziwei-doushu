import assert from 'node:assert/strict';
import { astro } from 'iztro';
import { Lunar } from 'lunar-javascript';
import { generateChart } from '../../lib/ziwei/algorithm';
import { getHoroscope } from '../../lib/ziwei/horoscope';
import { BRANCHES, STEMS } from '../../lib/ziwei/constants';
import { getSiHuaByStem } from '../../lib/ziwei/sihua';
import { getChildhoodDaXianPalace } from '../../lib/ziwei/yunxian-context';

const birth = { year: 1990, month: 6, day: 15, hour: 6, gender: 'male' as const };
const chart = generateChart(birth);
const layers = getHoroscope(chart.birthInfo, { year: 2026, month: 11, day: 1, hour: 6 });
const expected = { daxian: ['卯', '己卯'], xiaoxian: ['辰', '庚辰'], liunian: ['午', '丙午'], liuyue: ['辰', '戊戌'], liuri: ['寅', '己卯'], liushi: ['申', '庚午'] } as const;
for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
  const layer = layers[key];
  assert.equal(BRANCHES[layer.mingBranch], expected[key][0], key);
  assert.equal(STEMS[layer.stem] + BRANCHES[layer.ganzhiBranch], expected[key][1], key);
  assert.equal(layer.palaceNames[layer.mingBranch], '命宫', key);
  assert.equal(layer.palaceNames.length, 12);
  assert.deepEqual(layer.siHua, getSiHuaByStem(layer.stem));
}
assert.equal(layers.xiaoxian.nominalAge, 37);
const natal = astro.bySolar('1990-6-15', 6, '男', true, 'zh-CN');
for (let year = 2017; year <= 2026; year++) {
  const h = getHoroscope(chart.birthInfo, { year, month: 11, day: 1, hour: 6 });
  assert.equal(h.liunian.mingBranch, ((year - 4) % 12 + 12) % 12);
  const palace = natal.palaces.find(p => p.ages.includes(h.xiaoxian.nominalAge));
  assert.equal(BRANCHES[h.xiaoxian.mingBranch], palace?.earthlyBranch);
}
for (const year of [1990, 1991, 1992, 1993, 1994]) {
  const h = getHoroscope(chart.birthInfo, { year, month: 11, day: 1, hour: 6 });
  assert.equal(h.daxian.mingBranch, getChildhoodDaXianPalace(chart, year)?.branch);
  assert.equal(h.daxian.palaceNames[h.daxian.mingBranch], '命宫');
  assert.equal(h.daxian.stem, getChildhoodDaXianPalace(chart, year)?.stem);
}
const converted = Lunar.fromYmd(2026, 9, 23).getSolar();
assert.deepEqual([converted.getYear(), converted.getMonth(), converted.getDay()], [2026, 11, 1]);
for (const policy of ['split', 'next-month', 'prev-month', 'origin-month'] as const) {
  const leapChart = generateChart({ year: 2023, month: 3, day: 25, hour: 6, gender: 'female' }, { leapMonth: policy });
  const h = getHoroscope(leapChart.birthInfo, { year: 2026, month: 11, day: 1, hour: 6 }, leapChart);
  const expectedAstrolabe = astro.byLunar('2023-2-4', 6, '女', true, false, 'zh-CN');
  if (policy === 'origin-month') assert.equal(h.liuyue.mingBranch, (expectedAstrolabe.horoscope('2026-11-1', 6).monthly.index + 2) % 12);
  assert.equal(h.daxian.palaceNames[h.daxian.mingBranch], '命宫');
}
console.log('horoscope regression: passed');
