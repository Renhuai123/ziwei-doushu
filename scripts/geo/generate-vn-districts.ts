/**
 * Sinh `lib/ziwei/vn-districts.generated.ts` từ bộ dữ liệu mở có toạ độ.
 *
 * Nguồn: zoo-vietnamadminunits — data/raw/63_provinces_location_district_2025-07-25.csv
 * (toạ độ tâm đơn vị hành chính cấp huyện, WGS84, 63 tỉnh thành trước 2025).
 *
 * Chạy: npx tsx scripts/geo/generate-vn-districts.ts
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/hoangnguyen307/zoo-vietnamadminunits/main/data/raw/63_provinces_location_district_2025-07-25.csv';

/** Tên tỉnh đang dùng trong app (`VN_PROVINCES`) — cũng là khoá của bảng sinh ra. */
const APP_PROVINCES = [
  'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Hải Dương', 'Hưng Yên', 'Bắc Ninh', 'Bắc Giang',
  'Vĩnh Phúc', 'Thái Nguyên', 'Lạng Sơn', 'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang', 'Hà Giang',
  'Lào Cai', 'Yên Bái', 'Phú Thọ', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Hà Nam',
  'Thái Bình', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình',
  'Quảng Trị', 'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên',
  'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông',
  'Lâm Đồng', 'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu',
  'TP. Hồ Chí Minh', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp',
  'An Giang', 'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau',
];

/** Tên tỉnh trong nguồn khác cách viết / đã đổi tên so với app. */
const ALIASES: Record<string, string> = {
  'Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Huế': 'Thừa Thiên Huế', // 2025: Thừa Thiên Huế → TP. Huế
  'Khánh Hoà': 'Khánh Hòa',
  'Hoà Bình': 'Hòa Bình',
  'Đắc Lắk': 'Đắk Lắk',
  'Đắc Nông': 'Đắk Nông',
  'Bà Rịa-Vũng Tàu': 'Bà Rịa - Vũng Tàu',
  'Thừa Thiên-Huế': 'Thừa Thiên Huế',
};

/** Bỏ tiền tố loại đơn vị ("Tỉnh ", "Thành phố "…) để so khớp với tên tỉnh của app. */
const stripProvincePrefix = (name: string) =>
  name.normalize('NFC').replace(/^(Thành phố|Tỉnh|TP\.?)\s+/u, '').trim();

interface DistrictRow {
  province: string;
  name: string;
  longitude: number;
}

/** Parse các dòng `"Quận Ba Đình, Thành phố Hà Nội",21.03,105.82,...` */
function parseCsv(csv: string): DistrictRow[] {
  const rows: DistrictRow[] = [];
  for (const line of csv.split('\n').slice(1)) {
    const match = line.match(/^"([^"]+)",[\d.]+,([\d.]+),/);
    if (!match) continue;
    const address = match[1];
    const split = address.lastIndexOf(', ');
    if (split < 0) continue;
    let province = stripProvincePrefix(address.slice(split + 2));
    province = ALIASES[province] ?? province;
    rows.push({ province, name: address.slice(0, split).trim(), longitude: Number(match[2]) });
  }
  return rows;
}

const groupRank = (name: string) =>
  /^Quận /.test(name) ? 0 : /^Thành phố /.test(name) ? 1 : /^Thị xã /.test(name) ? 2 : 3;

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Không tải được dữ liệu nguồn: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());

  const byProvince = new Map<string, { name: string; longitude: number }[]>();
  for (const row of rows) {
    if (!APP_PROVINCES.includes(row.province)) continue; // tỉnh đã sáp nhập / ngoài phạm vi
    const list = byProvince.get(row.province) ?? [];
    list.push({ name: row.name, longitude: Math.round(row.longitude * 100) / 100 });
    byProvince.set(row.province, list);
  }

  const missing = APP_PROVINCES.filter((p) => !byProvince.has(p));
  if (missing.length) throw new Error(`Thiếu dữ liệu cho tỉnh: ${missing.join(', ')}`);

  let total = 0;
  const body = APP_PROVINCES.map((province) => {
    const list = (byProvince.get(province) ?? []).sort(
      (a, b) => groupRank(a.name) - groupRank(b.name) || a.name.localeCompare(b.name, 'vi'),
    );
    total += list.length;
    const items = list
      .map((d) => `    { name: ${JSON.stringify(d.name)}, longitude: ${d.longitude.toFixed(2)} },`)
      .join('\n');
    return `  ${JSON.stringify(province)}: [\n${items}\n  ],`;
  }).join('\n');

  const file = `/**
 * Quận / huyện / thị xã / thành phố thuộc tỉnh của 63 tỉnh thành Việt Nam (đơn vị hành chính trước 2025).
 *
 * Nguồn: bộ dữ liệu mở zoo-vietnamadminunits (data/raw/63_provinces_location_district_2025-07-25.csv),
 * toạ độ tâm đơn vị hành chính theo WGS84. Sinh tự động — đừng sửa tay; chạy lại
 * \`npx tsx scripts/geo/generate-vn-districts.ts\` nếu cần cập nhật.
 *
 * Vì sao cần: kinh độ quyết định giờ mặt trời thật, tức canh giờ của lá số. Chênh lệch giữa
 * tâm tỉnh và một huyện xa có thể tới ~20 phút — đủ để đổi canh giờ khi sinh sát ranh giới.
 */
export interface VnDistrict {
  name: string;
  longitude: number;
}

export const VN_DISTRICTS: Record<string, readonly VnDistrict[]> = {
${body}
};
`;

  writeFileSync(new URL('../../lib/ziwei/vn-districts.generated.ts', import.meta.url), file);
  console.log(`✅ vn-districts: ${byProvince.size} tỉnh, ${total} quận/huyện`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
