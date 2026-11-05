import assert from 'node:assert/strict';
import starNames from 'iztro/lib/i18n/locales/zh-CN/star';
import { generateChart } from '../../lib/ziwei/algorithm';
import { PROVINCES } from '../../lib/ziwei/cities';
import { BRANCHES, STEMS } from '../../lib/ziwei/constants';
import { SCHOOL_STAR_ID_TO_NAME } from '../../lib/ziwei/school-data';
import { viTerm } from '../../lib/i18n/vi';
import { VI_LOCATIONS } from '../../lib/i18n/locations.vi';
import { classicsSearchQuery } from '../../app/library/searchTerms';
import { searchClassics } from '../../lib/classics';

const han = /\p{Script=Han}/u;
assert.equal(viTerm('紫微'), 'Tử Vi');
assert.equal(viTerm('甲子'), 'Giáp Tý');
assert.equal(viTerm('水二局'), 'Thủy nhị cục');
for (const name of new Set([...Object.values(starNames), ...Object.values(SCHOOL_STAR_ID_TO_NAME), ...BRANCHES, ...STEMS])) {
  assert.ok(!han.test(viTerm(name)), `Chưa có tên hiển thị tiếng Việt: ${name} → ${viTerm(name)}`);
}
const locations = new Set(PROVINCES.flatMap(p => [p.name, ...p.cities.map(c => c.name)]));
for (const name of locations) {
  assert.ok(VI_LOCATIONS[name], `Chưa có tên địa danh: ${name}`);
  assert.ok(!han.test(viTerm(name)), `Địa danh còn chữ Hán: ${name}`);
}

for (const birth of [
  { year: 1990, month: 1, day: 1, hour: 4, gender: 'male' as const },
  { year: 1988, month: 10, day: 8, hour: 7, gender: 'female' as const },
]) {
  const chart = generateChart(birth);
  const original = JSON.stringify(chart);
  assert.equal(chart.palaces.length, 12);
  assert.ok(chart.palaces.some(p => p.stars.some(s => s.name === '紫微')));
  for (const palace of chart.palaces) {
    assert.ok(!han.test(viTerm(palace.name)), `Cung chưa dịch: ${palace.name}`);
    for (const star of palace.stars) {
      assert.ok(!han.test(viTerm(star.name)), `Sao chưa dịch: ${star.name}`);
      if (star.brightnessRaw) assert.ok(!han.test(viTerm(star.brightnessRaw)));
      if (star.siHua) assert.ok(!han.test(viTerm(star.siHua)));
    }
  }
  assert.equal(JSON.stringify(chart), original, 'Định dạng tiếng Việt không được sửa dữ liệu tính toán');
}
for (const query of ['Tử Vi', 'tu vi', 'HÓA KỴ', 'Thất Sát triều đẩu']) {
  const translated = classicsSearchQuery(query);
  assert.ok(han.test(translated), `Từ khóa chưa được ánh xạ: ${query}`);
  assert.ok(searchClassics(translated).length > 0, `Không tìm thấy cổ thư: ${query}`);
}
console.log(`Vietnamese display passed: all astrology names, ${locations.size} locations, two complete charts and Vietnamese search; canonical data preserved.`);
