/**
 * Regression: âm lịch Việt Nam (UTC+7, kinh tuyến 105°Đ) — `lib/ziwei/vn-lunar.ts`.
 *
 * Vì sao phải có: `lunar-javascript` / iztro tính âm lịch theo giờ Bắc Kinh (UTC+8). Người sinh
 * ở Việt Nam phải dùng âm lịch Việt Nam: lệch 1 ngày âm ở ~4% số tháng (điểm Sóc rơi vào
 * 23:00–24:00 giờ Việt Nam), lệch cả tháng nhuận ở một số năm (1984, 1985, 2033…). Với tử vi,
 * lệch 1 ngày là đổi vị trí Tử Vi cả lá số, lệch 1 tháng là đổi toàn bộ 12 cung.
 *
 * Số liệu đối chiếu: thuật toán Hồ Ngọc Đức ("Thuật toán tính âm lịch", Meeus ch. 49).
 * Bản cài đặt này đã so khớp **từng ngày** 1900–2050 với thư viện amlich.js gốc: 0 khác biệt.
 */
import {
  solarToLunarVN,
  lunarToSolarVN,
  leapMonthOfLunarYearVN,
  lunarMonthDayCountVN,
  jdFromDate,
} from '../../lib/ziwei/vn-lunar';

let failures = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`  ✗ ${name}: nhận ${JSON.stringify(actual)}, mong đợi ${JSON.stringify(expected)}`);
  }
};
const checkTrue = (name: string, ok: boolean) => {
  if (!ok) { failures++; console.log(`  ✗ ${name}`); }
};

/* ── ① Tết Nguyên Đán (mùng 1 tháng Giêng) 2000–2026 ─────────────────── */
const TET: Array<[number, string]> = [
  [2000, '2000-02-05'], [2001, '2001-01-24'], [2002, '2002-02-12'], [2003, '2003-02-01'],
  [2004, '2004-01-22'], [2005, '2005-02-09'], [2006, '2006-01-29'], [2007, '2007-02-17'],
  [2008, '2008-02-07'], [2009, '2009-01-26'], [2010, '2010-02-14'], [2011, '2011-02-03'],
  [2012, '2012-01-23'], [2013, '2013-02-10'], [2014, '2014-01-31'], [2015, '2015-02-19'],
  [2016, '2016-02-08'], [2017, '2017-01-28'], [2018, '2018-02-16'], [2019, '2019-02-05'],
  [2020, '2020-01-25'], [2021, '2021-02-12'], [2022, '2022-02-01'], [2023, '2023-01-22'],
  [2024, '2024-02-10'], [2025, '2025-01-29'], [2026, '2026-02-17'],
];
for (const [year, iso] of TET) {
  const [y, m, d] = iso.split('-').map(Number);
  check(`Tết ${year}`, solarToLunarVN(y, m, d), { lunarYear: year, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
}

/* ── ② Những năm Việt Nam và Trung Quốc thật sự khác nhau ────────────── */
// 1984: Trung Quốc nhuận tháng 10, Việt Nam không nhuận.
check('1984 Việt Nam không có tháng nhuận', leapMonthOfLunarYearVN(1984), 0);
// 1985: Tết Việt Nam 21/1, Tết Trung Quốc 20/2 (lệch một tháng âm).
check('Tết 1985 Việt Nam = 21/1', solarToLunarVN(1985, 1, 21), { lunarYear: 1985, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
check('20/2/1985 ở Việt Nam đã là tháng 2 âm', solarToLunarVN(1985, 2, 20).lunarMonth, 2);
// 2030 / 2053: Tết Việt Nam sớm hơn Trung Quốc 1 ngày (Trung Quốc 3/2/2030 và 19/2/2053).
check('Tết 2030 Việt Nam = 2/2', solarToLunarVN(2030, 2, 2), { lunarYear: 2030, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
check('Tết 2053 Việt Nam = 18/2', solarToLunarVN(2053, 2, 18), { lunarYear: 2053, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
// 2033: năm nhuận tháng 11 — loại nhuận hiếm, dễ lệch một năm nếu chỉ xét một cửa sổ tháng 11.
check('2033 nhuận tháng 11', leapMonthOfLunarYearVN(2033), 11);
check('2033 có 2 tháng 11 (thường + nhuận)', [lunarMonthDayCountVN(2033, 11, false), lunarMonthDayCountVN(2033, 11, true)], [30, 29]);

/* ── ③ Khứ hồi dương → âm → dương toàn dải 1900–2050 ─────────────────── */
{
  let bad = 0;
  let firstBad = '';
  for (let jd = jdFromDate(1, 1, 1900); jd <= jdFromDate(31, 12, 2050); jd++) {
    const date = new Date(Date.UTC(1899, 11, 31 + (jd - jdFromDate(1, 1, 1900))));
    const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate();
    const vn = solarToLunarVN(y, m, d);
    const back = lunarToSolarVN(vn.lunarDay, vn.lunarMonth, vn.lunarYear, vn.isLeapMonth);
    if (back.year !== y || back.month !== m || back.day !== d) {
      bad++;
      if (!firstBad) firstBad = `${y}-${m}-${d} → ${JSON.stringify(vn)} → ${JSON.stringify(back)}`;
    }
  }
  check('khứ hồi 1900–2050', bad, 0);
  if (firstBad) console.log('    ví dụ hỏng: ' + firstBad);
}

/* ── ④ Mọi tháng âm đều có 29 hoặc 30 ngày, tháng nhuận tồn tại đúng ── */
{
  let bad = 0;
  for (let year = 1901; year <= 2049; year++) {
    const leap = leapMonthOfLunarYearVN(year);
    for (let month = 1; month <= 12; month++) {
      const days = lunarMonthDayCountVN(year, month, false);
      if (days !== 29 && days !== 30) bad++;
      if (leap === month) {
        const leapDays = lunarMonthDayCountVN(year, month, true);
        if (leapDays !== 29 && leapDays !== 30) bad++;
      } else if (lunarMonthDayCountVN(year, month, true) !== 0) {
        bad++;
      }
    }
  }
  check('số ngày tháng âm 1901–2049', bad, 0);
}

/* ── ⑤ Khác với lịch Trung Quốc đúng ở mức đã biết (không lệch lan) ── */
{
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Solar } = require('lunar-javascript');
  let total = 0, same = 0;
  for (let y = 1950; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= dim; d++) {
        total++;
        const vn = solarToLunarVN(y, m, d);
        const cn = Solar.fromYmd(y, m, d).getLunar();
        const cnMonth = Math.abs(Number(cn.getMonth()));
        if (vn.lunarMonth === cnMonth && vn.lunarDay === Number(cn.getDay()) && vn.isLeapMonth === (Number(cn.getMonth()) < 0)) same++;
      }
    }
  }
  const ratio = same / total;
  checkTrue(`1950–2026: phần lớn ngày trùng lịch Trung Quốc (${(ratio * 100).toFixed(2)}%)`, ratio > 0.93 && ratio < 0.995);
}

if (failures > 0) {
  console.error(`\n❌ vn-lunar: ${failures} kiểm tra hỏng`);
  process.exit(1);
}
console.log('✅ vn-lunar: Tết 2000–2026, các năm lệch Trung Quốc, khứ hồi 1900–2050 đều khớp');
