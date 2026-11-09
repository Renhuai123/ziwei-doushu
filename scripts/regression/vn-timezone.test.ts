/**
 * Regression: múi giờ & kinh tuyến của nơi sinh — `lib/ziwei/calendar-zone.ts`, `share.ts`.
 *
 * Trước đây toàn bộ hiệu chỉnh kinh độ lấy kinh tuyến 120°Đ (giờ Bắc Kinh). Người sinh ở
 * Việt Nam nhập giờ đồng hồ Việt Nam (UTC+7, kinh tuyến 105°Đ) nên bị lệch ~1 giờ — đủ để
 * sang canh giờ khác, tức đổi cả 命宫/身宫/đại hạn. Test này khoá:
 *   ① độ lệch giờ chuẩn của Việt Nam và các giai đoạn lịch sử trước 1975-06-13;
 *   ② canh giờ tính theo đúng kinh tuyến của nơi sinh;
 *   ③ form → BirthInfo mang theo `calendarZone` và độ lệch giờ đã dùng.
 */
import {
  vietnamUtcOffsetMinutes,
  meridianForBirth,
  birthUtcOffsetMinutes,
  calendarZoneInfo,
} from '../../lib/ziwei/calendar-zone';
import { calcTrueSolarBranch, formToBirthInfo } from '../../lib/ziwei/share';
import { VN_PROVINCES } from '../../lib/ziwei/cities';
import type { BirthFormState } from '../../components/BirthForm';

let failures = 0;
const check = (name: string, actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures++;
    console.log(`  ✗ ${name}: nhận ${JSON.stringify(actual)}, mong đợi ${JSON.stringify(expected)}`);
  }
};

/* ── ① Độ lệch giờ Việt Nam ─────────────────────────────────────────── */
check('hiện hành UTC+7', vietnamUtcOffsetMinutes(2020, 1, 1), 7 * 60);
check('1943–1945-03-14: UTC+8', vietnamUtcOffsetMinutes(1944, 6, 1), 8 * 60);
check('1945-03-15 → 1945-09: UTC+9 (giờ Nhật)', vietnamUtcOffsetMinutes(1945, 6, 1), 9 * 60);
check('1968 miền Nam: giờ Sài Gòn UTC+8', vietnamUtcOffsetMinutes(1968, 3, 10, 'south'), 8 * 60);
check('1968 miền Bắc: UTC+7', vietnamUtcOffsetMinutes(1968, 3, 10, 'north'), 7 * 60);
check('1958-03-01 miền Nam: UTC+7 (trước 1960)', vietnamUtcOffsetMinutes(1958, 3, 1, 'south'), 7 * 60);
check('1975-06-13: cả nước UTC+7', vietnamUtcOffsetMinutes(1975, 6, 13, 'south'), 7 * 60);
check('1975-06-12: miền Nam vẫn UTC+8', vietnamUtcOffsetMinutes(1975, 6, 12, 'south'), 8 * 60);
check('không rõ vùng: không áp dụng mốc riêng của miền Nam', vietnamUtcOffsetMinutes(1968, 3, 10), 7 * 60);

/* ── ② Kinh tuyến / độ lệch giờ cho hiệu chỉnh chân thái dương thời ─── */
check('kinh tuyến Việt Nam', meridianForBirth('vn', 2020, 1, 1), 105);
check('kinh tuyến Trung Quốc', meridianForBirth('cn', 2020, 1, 1), 120);
check('kinh tuyến Việt Nam 1968 miền Nam', meridianForBirth('vn', 1968, 3, 10, 'south'), 120);
check('birthUtcOffsetMinutes mặc định (không truyền zone) = 480', birthUtcOffsetMinutes(undefined, 2020, 1, 1), 480);
check('calendarZoneInfo vn', calendarZoneInfo('vn'), { utcOffsetMinutes: 420, meridian: 105, label: 'Việt Nam (UTC+7)' });

/* ── ③ Canh giờ theo kinh tuyến nơi sinh ────────────────────────────── */
// 10:57 tại Hà Nội (105,85°Đ): hiệu chỉnh +3,4 phút → 11:00 (Ngọ).
// Nếu lấy kinh tuyến 120°Đ như trước: −56,6 phút → 10:00 (Tỵ) — lệch hẳn một canh giờ.
check('Hà Nội 10:57 theo UTC+7 → Ngọ (6)', calcTrueSolarBranch(10, 57, 105.85, 420), 6);
check('Hà Nội 10:57 theo UTC+8 (cách tính cũ) → Tỵ (5)', calcTrueSolarBranch(10, 57, 105.85), 5);
// Sài Gòn 1968 (giờ đồng hồ UTC+8): 23:30 → 22:36 Hợi, không phải Tý.
check('Sài Gòn 1968 23:30 theo UTC+8 → Hợi (11)', calcTrueSolarBranch(23, 30, 106.70, 480), 11);
check('Sài Gòn 1968 23:30 nếu lấy UTC+7 → Tý (0)', calcTrueSolarBranch(23, 30, 106.70, 420), 0);

/* ── ③b Phương trình thời gian (均时差) ──────────────────────────────
 * 03/11 phương trình thời gian ≈ +16,4 phút: 10:42 tại Hà Nội (hiệu chỉnh kinh độ +3,4)
 * · chỉ hiệu chỉnh kinh độ → 10:45 = Tỵ (5);
 * · cộng thêm phương trình thời gian → 11:01 = Ngọ (6).
 * Đây chính là lý do form và bước an lá số phải dùng chung một hàm. */
check('Hà Nội 10:42 ngày 3/11, chỉ hiệu chỉnh kinh độ → Tỵ (5)', calcTrueSolarBranch(10, 42, 105.85, 420), 5);
check(
  'Hà Nội 10:42 ngày 3/11, có phương trình thời gian → Ngọ (6)',
  calcTrueSolarBranch(10, 42, 105.85, 420, { year: 2020, month: 11, day: 3 }),
  6,
);

/* ── ③c Dữ liệu quận/huyện của 63 tỉnh ─────────────────────────────── */
const placeIssues: string[] = [];
let placeCount = 0;
for (const province of VN_PROVINCES) {
  if (province.calendarZone !== 'vn') placeIssues.push(`${province.name}: calendarZone`);
  if (province.cities.length < 5) placeIssues.push(`${province.name}: chỉ ${province.cities.length} địa danh`);
  const seen = new Set<string>();
  for (const city of province.cities) {
    placeCount++;
    if (!(city.longitude >= 102 && city.longitude <= 110.6)) {
      placeIssues.push(`${province.name}/${city.name}: kinh độ ${city.longitude}`);
    }
    if (seen.has(city.name)) placeIssues.push(`${province.name}: trùng tên ${city.name}`);
    seen.add(city.name);
  }
}
check('63 tỉnh: mỗi tỉnh ≥ 5 địa danh, kinh độ 102–110,6°Đ, không trùng tên', placeIssues, []);
check('tổng số địa danh Việt Nam chọn được ≥ 650', placeCount >= 650, true);
check(
  'Hà Nội chọn được Quận Hoàn Kiếm (105,86°Đ)',
  VN_PROVINCES.find((p) => p.name === 'Hà Nội')?.cities.find((c) => c.name === 'Quận Hoàn Kiếm')?.longitude,
  105.86,
);

/* ── ④ form → BirthInfo mang theo calendarZone / độ lệch giờ / canh giờ ── */
const baseForm: BirthFormState = {
  name: '', year: '2020', month: '5', day: '20',
  clockHour: '10', clockMinute: '57', unknownTime: false,
  province: 'Hà Nội', city: 'Hà Nội', longitude: 105.85,
  calendarZone: 'vn', vnRegion: 'north', gender: 'male',
};
{
  const info = formToBirthInfo(baseForm);
  check('form Hà Nội 2020: calendarZone', info.calendarZone, 'vn');
  check('form Hà Nội 2020: độ lệch giờ', info.utcOffsetMinutes, 420);
  check('form Hà Nội 2020: canh giờ', info.hour, 6);
  check('form Hà Nội 2020: giữ ngày', [info.year, info.month, info.day], [2020, 5, 20]);
}
{
  // 3/11 10:42 tại Hà Nội: phương trình thời gian đẩy qua ranh giới Tỵ → Ngọ.
  const info = formToBirthInfo({ ...baseForm, month: '11', day: '3', clockHour: '10', clockMinute: '42' });
  check('form Hà Nội 3/11 10:42: canh giờ Ngọ (6)', info.hour, 6);
}
{
  // Sinh tại Sài Gòn 1968-03-10 23:30 (giờ đồng hồ UTC+8) → Hợi, vẫn trong ngày 10.
  const info = formToBirthInfo({
    ...baseForm,
    year: '1968', month: '3', day: '10', clockHour: '23', clockMinute: '30',
    province: 'TP. Hồ Chí Minh', city: 'TP. Hồ Chí Minh', longitude: 106.70,
    calendarZone: 'vn', vnRegion: 'south',
  });
  check('Sài Gòn 1968: độ lệch giờ lịch sử', info.utcOffsetMinutes, 480);
  check('Sài Gòn 1968: canh giờ Hợi', info.hour, 11);
  check('Sài Gòn 1968: không nhảy sang ngày 11', [info.year, info.month, info.day], [1968, 3, 10]);
}
{
  // Không chọn nơi sinh và không khai báo zone → giữ nguyên hành vi cũ (Trung Quốc, 120°Đ).
  const info = formToBirthInfo({
    ...baseForm, province: '', city: '', longitude: 120,
    calendarZone: undefined, vnRegion: undefined,
  });
  check('không chọn nơi sinh: zone mặc định', info.calendarZone, 'cn');
  check('không chọn nơi sinh: độ lệch giờ mặc định', info.utcOffsetMinutes, 480);
}

if (failures > 0) {
  console.error(`\n❌ vn-timezone: ${failures} kiểm tra hỏng`);
  process.exit(1);
}
console.log('✅ vn-timezone: múi giờ hiện hành + lịch sử, kinh tuyến 105°Đ và form → BirthInfo đều khớp');
