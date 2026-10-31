import assert from 'node:assert/strict';
import { parseChartForm } from '../../app/chart/chart-form';
import { formToBirthInfo } from '../../lib/ziwei/share';

const form = parseChartForm(new URLSearchParams('y=1990&m=6&d=15&h=23&mi=0&g=m'));
assert.ok(form, 'valid shared birth form is accepted');
assert.deepEqual(
  (({ year, month, day, hour }) => ({ year, month, day, hour }))(formToBirthInfo(form)),
  { year: 1990, month: 6, day: 16, hour: 0 },
  'late Zi hour uses the next date',
);
for (const query of [
  'y=1990&m=2&d=30&h=12&mi=0&g=m',
  'y=1990&m=6&d=15&h=24&mi=0&g=m',
  'y=1990&m=6&d=15&h=12&mi=0&g=m&lo=NaN',
  'y=1990&m=6&d=15&h=12&mi=0&g=x',
]) {
  assert.equal(parseChartForm(new URLSearchParams(query)), null, `invalid link is rejected: ${query}`);
}
console.log('chart share form: passed');
