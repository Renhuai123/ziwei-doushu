/**
 * 防再犯：同宫两颗本命四化星 ≠ bug。
 * 戊年（默认四化表）：贪狼禄、太阴权、右弼科、天机忌 —— 可落在同一宫。
 * 金标准 case：1988-10-08 未时男 → 命宫 天机忌+太阴权；父母 贪狼禄+右弼科。
 */
import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { SCHOOL_SIHUA_DEFAULT, SCHOOL_STAR_ID_TO_NAME } from '../../lib/ziwei/school-data';

// 戊 = index 5 in SCHOOL_SIHUA_DEFAULT rows (row0 pad, 甲..癸 = 1..10)
const wu = SCHOOL_SIHUA_DEFAULT[5];
assert.deepEqual(wu, [0, 9, 8, 18, 2], '默认戊年四化表被改动');
assert.equal(SCHOOL_STAR_ID_TO_NAME[9], '贪狼');
assert.equal(SCHOOL_STAR_ID_TO_NAME[8], '太阴');
assert.equal(SCHOOL_STAR_ID_TO_NAME[18], '右弼');
assert.equal(SCHOOL_STAR_ID_TO_NAME[2], '天机');

const chart = generateChart({ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' });
const byPalace = new Map<string, string[]>();
for (const p of chart.palaces) {
  const hits = p.stars.filter(s => s.siHua).map(s => `${s.name}:${s.siHua}`);
  if (hits.length) byPalace.set(p.name, hits);
}

assert.deepEqual(byPalace.get('命宫')?.sort(), ['天机:忌', '太阴:权'].sort());
assert.deepEqual(byPalace.get('父母')?.sort(), ['贪狼:禄', '右弼:科'].sort());
assert.equal(
  [...byPalace.values()].filter(v => v.length >= 2).length,
  2,
  '戊年此盘应有两宫各含两颗本命四化星',
);

console.log('✓ natal dual-sihua same palace (戊年·默认四化表) is valid, not a display bug');
