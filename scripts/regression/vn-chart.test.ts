/**
 * Regression: lá số theo âm lịch Việt Nam — `generateChart({ calendarZone: 'vn' })`.
 *
 * Bối cảnh: engine an sao (iztro) chỉ biết lịch Trung Quốc. Lá số Việt Nam được lập bằng cách
 * an **lá số nền theo mùng 1** của tháng âm Việt Nam rồi dời các sao phụ thuộc ngày sang đúng ngày
 * âm Việt Nam (`relocateLunarDayStars`). Test này khoá ba tính chất:
 *
 *   ① Dời sao phải cho **đúng y** lá số mà iztro tự an cho ngày đó (so với ảnh gốc của engine);
 *   ② Khi hai lịch cùng ngày, lá số Việt Nam và Trung Quốc phải **trùng khít** — không được
 *      lệch vì đường đi khác nhau;
 *   ③ Các ngày mà hai lịch lệch nhau (Tết lệch tháng, Sóc lệch ngày, ngày 30 không tồn tại ở
 *      lịch Trung Quốc) phải cho tháng/ngày/năm âm **đúng theo lịch Việt Nam**.
 */
import { generateChart } from '../../lib/ziwei/algorithm';
import { relocateLunarDayStars, ziweiPalaceIndex, palaceIndexToBranch } from '../../lib/ziwei/lunar-day-shift';
import { solarToLunarVN } from '../../lib/ziwei/vn-lunar';
import { Lunar, LunarMonth, Solar } from 'lunar-javascript';

let failures = 0;
const fail = (msg: string) => { failures++; console.log(`  ✗ ${msg}`); };

type Chart = ReturnType<typeof generateChart>;
const layoutOf = (palaces: Chart['palaces']) => {
  const map = new Map<string, string>();
  for (const p of palaces) for (const s of p.stars) map.set(s.name, `${p.branch}:${s.brightnessRaw ?? ''}:${s.siHua ?? ''}`);
  return map;
};
const diffLayout = (a: Map<string, string>, b: Map<string, string>): string | null => {
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    if (a.get(key) !== b.get(key)) return `${key}: ${a.get(key)} ≠ ${b.get(key)}`;
  }
  return null;
};
const mainStarCount = (chart: Chart) =>
  chart.palaces.reduce((n, p) => n + p.stars.filter((s) => s.type === 'major').length, 0);

/* ── ① Dời sao = đúng ảnh gốc của iztro cho cùng ngày âm ─────────────── */
{
  let checked = 0;
  const months: Array<[number, number]> = [];
  for (let y = 1952; y <= 2024; y += 6) for (const m of [2, 6, 10]) months.push([y, m]);

  for (const [ly, lm] of months) {
    const firstSolar = Lunar.fromYmd(ly, lm, 1).getSolar();
    const baseDate = { year: firstSolar.getYear(), month: firstSolar.getMonth(), day: firstSolar.getDay() };
    const base = generateChart({ ...baseDate, hour: 4, gender: 'male' });
    const daysInMonth = LunarMonth.fromYm(ly, lm)?.getDayCount() ?? 29;

    for (const targetDay of [2, 10, 16, 23, 29, 30]) {
      if (targetDay > daysInMonth) continue;
      const shifted = new Date(Date.UTC(baseDate.year, baseDate.month - 1, baseDate.day + targetDay - 1));
      const native = generateChart({
        year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(),
        hour: 4, gender: 'male',
      });
      if (native.lunarInfo.lunarDay !== targetDay || native.lunarInfo.lunarMonth !== lm) {
        fail(`nền ${ly}-${lm}: ngày ${targetDay} không rơi đúng tháng âm (${native.lunarInfo.lunarDay}/${native.lunarInfo.lunarMonth})`);
        continue;
      }
      const moved = base.palaces.map((p) => ({ ...p, stars: p.stars.map((s) => ({ ...s })) }));
      relocateLunarDayStars(moved, 1, targetDay, base.wuxingJu, 'QS');
      checked++;
      const bad = diffLayout(layoutOf(moved), layoutOf(native.palaces));
      if (bad) fail(`dời sao mùng 1 → ${targetDay} (${ly}-${lm}) lệch ảnh gốc: ${bad}`);
    }
  }
  if (!failures) console.log(`  ✅ dời sao khớp ảnh gốc iztro: ${checked} trường hợp`);
}

/* ── ② Cùng ngày âm → lá số Việt Nam trùng khít lá số Trung Quốc ─────── */
{
  let same = 0;
  for (let y = 1950; y <= 2020; y += 2) {
    for (const m of [2, 6, 10]) {
      for (const d of [3, 14, 25]) {
        const vn = solarToLunarVN(y, m, d);
        const cn = Solar.fromYmd(y, m, d).getLunar();
        const sameCalendar = vn.lunarDay === Number(cn.getDay())
          && vn.lunarMonth === Math.abs(Number(cn.getMonth()))
          && vn.isLeapMonth === (Number(cn.getMonth()) < 0);
        if (!sameCalendar) continue;
        same++;
        const a = generateChart({ year: y, month: m, day: d, hour: 6, gender: 'female', calendarZone: 'vn' });
        const b = generateChart({ year: y, month: m, day: d, hour: 6, gender: 'female', calendarZone: 'cn' });
        const bad = diffLayout(layoutOf(a.palaces), layoutOf(b.palaces));
        if (bad) fail(`hai lịch cùng ngày ${y}-${m}-${d} nhưng lá số khác nhau: ${bad}`);
      }
    }
  }
  if (!failures) console.log(`  ✅ cùng ngày âm → hai lịch cho cùng lá số: ${same} trường hợp`);
}

/* ── ③ Ngày hai lịch lệch nhau → phải theo lịch Việt Nam ─────────────── */
{
  // 1985: Tết Việt Nam 21/1, Tết Trung Quốc 20/2 → lá số phải là năm âm 1985 (Ất Sửu).
  const tet = generateChart({ year: 1985, month: 2, day: 1, hour: 4, gender: 'male', calendarZone: 'vn' });
  if (tet.lunarInfo.lunarYear !== 1985 || tet.lunarInfo.lunarMonth !== 1 || tet.lunarInfo.lunarDay !== 12) {
    fail(`1985-02-01 phải là 12/1/1985 âm lịch Việt Nam, nhận ${tet.lunarInfo.lunarDay}/${tet.lunarInfo.lunarMonth}/${tet.lunarInfo.lunarYear}`);
  }
  // Ất Sửu: can index 1 (Ất), chi index 1 (Sửu).
  if (tet.lunarInfo.yearStem !== 1 || tet.lunarInfo.yearBranch !== 1) {
    fail(`1985-02-01 phải là năm Ất Sửu (can 1, chi 1), nhận ${tet.lunarInfo.yearStem}/${tet.lunarInfo.yearBranch}`);
  }
  const tetCn = generateChart({ year: 1985, month: 2, day: 1, hour: 4, gender: 'male', calendarZone: 'cn' });
  if (tet.mingGongBranch === tetCn.mingGongBranch && tet.ziweiPos === tetCn.ziweiPos) {
    fail('1985-02-01: lịch Việt Nam và Trung Quốc khác tháng/năm âm mà lá số lại giống nhau');
  }

  // 1908-06-28: Việt Nam mùng 1 tháng 6, Trung Quốc 30 tháng 5 → phải an theo tháng 6.
  const soc = generateChart({ year: 1908, month: 6, day: 28, hour: 4, gender: 'male', calendarZone: 'vn' });
  if (soc.lunarInfo.lunarMonth !== 6 || soc.lunarInfo.lunarDay !== 1) {
    fail(`1908-06-28 phải là 1/6 âm lịch Việt Nam, nhận ${soc.lunarInfo.lunarDay}/${soc.lunarInfo.lunarMonth}`);
  }

  // 1933-08-20: Việt Nam 30 tháng 6 — ngày 30 KHÔNG tồn tại trong tháng 6 lịch Trung Quốc (29 ngày).
  const day30 = generateChart({ year: 1933, month: 8, day: 20, hour: 4, gender: 'male', calendarZone: 'vn' });
  if (day30.lunarInfo.lunarDay !== 30 || day30.lunarInfo.lunarMonth !== 6) {
    fail(`1933-08-20 phải là 30/6 âm lịch Việt Nam, nhận ${day30.lunarInfo.lunarDay}/${day30.lunarInfo.lunarMonth}`);
  }
  const expectedZiwei = palaceIndexToBranch(ziweiPalaceIndex(day30.wuxingJu, 30));
  if (day30.ziweiPos !== expectedZiwei) {
    fail(`1933-08-20: Tử Vi phải ở chi ${expectedZiwei} (ngày 30, cục ${day30.wuxingJu}), nhận ${day30.ziweiPos}`);
  }
  if (mainStarCount(day30) !== 14) fail(`1933-08-20: phải đủ 14 chính tinh, nhận ${mainStarCount(day30)}`);
  if (!failures) console.log('  ✅ Tết lệch tháng, Sóc lệch ngày, ngày 30 đều theo lịch Việt Nam');
}

/* ── ④ Tháng nhuận Việt Nam: bốn quy ước vẫn đúng như bản Trung Quốc ── */
{
  // 2025-08-10 = 17 tháng 6 nhuận âm lịch Việt Nam (tháng 6 nhuận, nửa sau).
  const vn = solarToLunarVN(2025, 8, 10);
  if (!vn.isLeapMonth || vn.lunarMonth !== 6) fail(`2025-08-10 phải là tháng 6 nhuận, nhận ${vn.lunarMonth}${vn.isLeapMonth ? ' nhuận' : ''}`);

  const expectations: Record<string, { month: number; leap: boolean }> = {
    'prev-month': { month: 6, leap: false },
    'next-month': { month: 7, leap: false },
    'split': { month: 7, leap: false },       // ngày 17 > 15 → nửa sau về tháng 7
    'origin-month': { month: 6, leap: true },
  };
  for (const [policy, want] of Object.entries(expectations)) {
    const chart = generateChart(
      { year: 2025, month: 8, day: 10, hour: 5, gender: 'female', calendarZone: 'vn' },
      { leapMonth: policy as never },
    );
    if (chart.lunarInfo.lunarMonth !== want.month || chart.lunarInfo.isLeapMonth !== want.leap) {
      fail(`quy ước ${policy}: nhận (tháng ${chart.lunarInfo.lunarMonth}, nhuận=${chart.lunarInfo.isLeapMonth}), mong đợi (tháng ${want.month}, nhuận=${want.leap})`);
    }
  }
  if (!failures) console.log('  ✅ tháng nhuận Việt Nam × bốn quy ước đều đúng');
}

/* ── ⑤ Lá số Việt Nam phải giữ nguyên 12 cung, 14 chính tinh, 12 đại hạn ── */
{
  for (const [y, m, d] of [[1990, 5, 20], [1968, 12, 31], [2001, 1, 24], [2020, 2, 29]] as const) {
    const chart = generateChart({ year: y, month: m, day: d, hour: 8, gender: 'female', calendarZone: 'vn' });
    if (chart.palaces.length !== 12) fail(`${y}-${m}-${d}: phải có 12 cung`);
    if (mainStarCount(chart) !== 14) fail(`${y}-${m}-${d}: phải có 14 chính tinh, nhận ${mainStarCount(chart)}`);
    if (chart.daXians.length !== 12) fail(`${y}-${m}-${d}: phải có 12 đại hạn, nhận ${chart.daXians.length}`);
  }
  if (!failures) console.log('  ✅ 12 cung · 14 chính tinh · 12 đại hạn đầy đủ');
}

if (failures > 0) {
  console.error(`\n❌ vn-chart: ${failures} kiểm tra hỏng`);
  process.exit(1);
}
console.log('✅ vn-chart: lá số Việt Nam khớp engine gốc khi cùng lịch, đúng lịch Việt Nam khi lệch');
