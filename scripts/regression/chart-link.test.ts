/** 命盘链接（地址 # 里的出生信息）：往返一致、合盘双方、被手改或截断的链接一律拒绝。 */
import assert from 'node:assert/strict';
import type { BirthFormState } from '../../components/BirthForm';
import { chartHash, formFromHash, formsFromHemingHash, hemingHash, maxBirthYear } from '../../lib/ziwei/chart-link';

const a: BirthFormState = {
  name: '小明', year: '1990', month: '6', day: '15', clockHour: '23', clockMinute: '30', unknownTime: false,
  province: '上海市', city: '上海', longitude: 121.5, gender: 'male',
};
const b: BirthFormState = { ...a, name: '', year: '1992', month: '2', day: '29', unknownTime: true, province: '', city: '', longitude: 120, gender: 'female' };

assert.deepEqual(formFromHash(chartHash(a)), a, 'chart link round-trips every field');
assert.equal(formFromHash(chartHash(b))?.unknownTime, true);
assert.deepEqual(formsFromHemingHash(hemingHash(a, b)), { a, b: { ...b, clockHour: '8', clockMinute: '0' } },
  'heming link round-trips both parties (unknown time keeps the form default hour)');

const bad = [
  '', '#', '#y=1990&m=6', // 截断
  '#y=1990&m=2&d=30&h=8&mi=0&g=m', // 不存在的日期
  '#y=1899&m=6&d=15&h=8&mi=0&g=m', `#y=${maxBirthYear() + 1}&m=1&d=1&h=8&mi=0&g=m`, // 年份越界
  '#y=1990&m=6&d=15&h=24&mi=0&g=m', '#y=1990&m=6&d=15&h=8&mi=60&g=m', // 时间越界
  '#y=1990&m=6&d=15&h=8&mi=0', '#y=1990&m=6&d=15&h=8&mi=0&g=x', // 性别缺失或非法
  '#y=19a0&m=6&d=15&h=8&mi=0&g=m', '#y=1990.5&m=6&d=15&h=8&mi=0&g=m', '#y=-1990&m=6&d=15&h=8&mi=0&g=m',
];
for (const h of bad) assert.equal(formFromHash(h), null, `rejects ${h || '(empty)'}`);
assert.equal(formsFromHemingHash(`#a=${encodeURIComponent('y=1990&m=6&d=15&h=8&mi=0&g=m')}`), null, 'heming needs both parties');
assert.equal(formFromHash(`#y=1990&m=6&d=15&h=8&mi=0&g=m&n=${'名'.repeat(100)}`)?.name.length, 40, 'name is clipped');
assert.equal(formFromHash(`#y=${maxBirthYear()}&m=1&d=1&h=8&mi=0&g=f`)?.year, String(maxBirthYear()), 'this year is allowed');

console.log(`✓ chart links: round-trip, heming pair, ${bad.length} malformed links rejected`);
