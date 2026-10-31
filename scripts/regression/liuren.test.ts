import assert from 'node:assert/strict';
import { Lunar, Solar } from 'lunar-javascript';
import { calculateLiuren, countLiurenSteps } from '../../lib/liuren';

function lunarDate(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const solar = Lunar.fromYmd(year, month, day).getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), hour, minute);
}

const example = calculateLiuren(lunarDate(2026, 9, 22, 0, 30));
assert.deepEqual([example.monthPalace, example.dayPalace, example.hourPalace], [2, 5, 5]);
assert.equal(example.result.name, '空亡');
const late = lunarDate(2026, 9, 22, 23, 30);
const next = new Date(late.getFullYear(), late.getMonth(), late.getDate() + 1, 0, 30);
const beforeMidnight = calculateLiuren(late);
const afterMidnight = calculateLiuren(next);
assert.equal(beforeMidnight.hourBranch, 0);
assert.equal(afterMidnight.hourBranch, 0);
assert.equal(beforeMidnight.lunarDay, Number(Solar.fromYmd(late.getFullYear(), late.getMonth() + 1, late.getDate()).getLunar().getDay()));
assert.equal(afterMidnight.lunarDay, Number(Solar.fromYmd(next.getFullYear(), next.getMonth() + 1, next.getDate()).getLunar().getDay()));
assert.equal(beforeMidnight.lunarDay, 22);
assert.equal(afterMidnight.lunarDay, 23);
const leap = calculateLiuren(lunarDate(2023, -2, 4, 12));
assert.equal(leap.isLeapMonth, true);
assert.equal(leap.lunarMonth, 2);
assert.equal(leap.monthPalace, 1);
for (let month = 1; month <= 12; month++) {
  for (let day = 1; day <= 30; day++) {
    for (let hour = 0; hour < 12; hour++) {
      const steps = countLiurenSteps(month, day, hour);
      assert.deepEqual(steps, { monthPalace: (month - 1) % 6, dayPalace: (month + day - 2) % 6, hourPalace: (month + day + hour - 2) % 6 });
      assert.ok(Object.values(steps).every(value => value >= 0 && value <= 5));
    }
  }
}
for (let hour = 0; hour < 24; hour++) {
  const result = calculateLiuren(new Date(2026, 10, 1, hour));
  assert.equal(result.hourBranch, Math.floor(((hour + 1) % 24) / 2));
}
console.log('liuren regression: passed');
