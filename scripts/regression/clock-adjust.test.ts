/**
 * 回归：出生钟表时间平移（lib/ziwei/clock-adjust.ts）与海外时区的真太阳时（true-solar-time.ts 的 utcOffsetMinutes）。
 *
 *   · 平移方向：标准时间 = 钟表读数 −（当年实际偏移 − 标准偏移）；跨日不改（给 null）。
 *   · 国内不传 utcOffsetMinutes 与传 480 逐日结果一致；海外按出生地时区的中央经线做经度修正。
 */
import { clockToStandardDelta, formatClock, shiftClock } from '../../lib/ziwei/clock-adjust';
import { calculateTrueSolarTime } from '../../lib/ziwei/true-solar-time';

let fails = 0;
function ok(name: string, cond: boolean) {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) fails++;
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

ok('中国大陆夏令时（+9:00 对 +8:00）→ 减 60', clockToStandardDelta(540, 480) === -60);
ok('美东夏令时（-4:00 对 -5:00）→ 减 60', clockToStandardDelta(-240, -300) === -60);
ok('马来西亚 1982 年前（+7:30 对 +8:00）→ 加 30', clockToStandardDelta(450, 480) === 30);

ok('14:30 减 60 → 13:30', eq(shiftClock({ clockHour: '14', clockMinute: '30' }, -60), { clockHour: '13', clockMinute: '30' }));
ok('1:05 减 60 → 0:05', eq(shiftClock({ clockHour: '1', clockMinute: '5' }, -60), { clockHour: '0', clockMinute: '5' }));
ok('0:30 减 60 跨到前一天 → null', shiftClock({ clockHour: '0', clockMinute: '30' }, -60) === null);
ok('8:15 加 30 → 8:45', eq(shiftClock({ clockHour: '8', clockMinute: '15' }, 30), { clockHour: '8', clockMinute: '45' }));
ok('23:45 加 30 跨到后一天 → null', shiftClock({ clockHour: '23', clockMinute: '45' }, 30) === null);
ok('时没填 → null', shiftClock({ clockHour: '', clockMinute: '0' }, -60) === null);
ok('平移 0 分钟 → null', shiftClock({ clockHour: '9', clockMinute: '0' }, 0) === null);
ok('formatClock 补零', formatClock({ clockHour: '7', clockMinute: '5' }) === '07:05');

// 国内：不传偏移 = 传 480，逐日抽查结果完全一致
let same = true;
for (let m = 1; m <= 12; m++) {
  for (const d of [1, 15, 28]) {
    const base = { year: 1990, month: m, day: d, clockHour: 9, clockMinute: 16, longitude: 116.4 };
    if (!eq(calculateTrueSolarTime(base), calculateTrueSolarTime({ ...base, utcOffsetMinutes: 480 }))) same = false;
  }
}
ok('国内不传 utcOffsetMinutes 与传 480 结果一致', same);

// 海外：纽约（经度 -74.0，美东标准 -5:00，中央经线 -75°）→ 经度修正 (-74 − (-75)) × 4 = +4 分钟
const ny = calculateTrueSolarTime({ year: 1995, month: 1, day: 15, clockHour: 14, clockMinute: 0, longitude: -74, utcOffsetMinutes: -300 });
ok('纽约经度修正 +4 分钟', Math.abs(ny.longitudeCorrectionMinutes - 4) < 1e-9);

if (fails) { console.error(`\n✗ 钟表时间平移回归 ${fails} 项未过`); process.exit(1); }
console.log('\n✓ 钟表时间平移回归全部通过');
