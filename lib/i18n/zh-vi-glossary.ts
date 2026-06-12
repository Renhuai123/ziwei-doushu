/**
 * Glossary Hán-Việt cho Tử Vi Đẩu Số
 * Mapping thuật ngữ Trung → Việt chuẩn Hán Việt
 */

export interface GlossaryEntry {
  zh: string;
  vi: string;
  category?: string;
}

// 14 Chính tinh
export const MAIN_STARS: GlossaryEntry[] = [
  { zh: '紫微', vi: 'Tử Vi', category: 'main_star' },
  { zh: '天机', vi: 'Thiên Cơ', category: 'main_star' },
  { zh: '太阳', vi: 'Thái Dương', category: 'main_star' },
  { zh: '武曲', vi: 'Vũ Khúc', category: 'main_star' },
  { zh: '天同', vi: 'Thiên Đồng', category: 'main_star' },
  { zh: '廉贞', vi: 'Liêm Trinh', category: 'main_star' },
  { zh: '天府', vi: 'Thiên Phủ', category: 'main_star' },
  { zh: '太阴', vi: 'Thái Âm', category: 'main_star' },
  { zh: '贪狼', vi: 'Tham Lang', category: 'main_star' },
  { zh: '巨门', vi: 'Cự Môn', category: 'main_star' },
  { zh: '天相', vi: 'Thiên Tướng', category: 'main_star' },
  { zh: '天梁', vi: 'Thiên Lương', category: 'main_star' },
  { zh: '七杀', vi: 'Thất Sát', category: 'main_star' },
  { zh: '破军', vi: 'Phá Quân', category: 'main_star' },
];

// Phụ tinh - cát tinh
export const LUCKY_STARS: GlossaryEntry[] = [
  { zh: '左辅', vi: 'Tả Phù', category: 'lucky_star' },
  { zh: '右弼', vi: 'Hữu Bật', category: 'lucky_star' },
  { zh: '文昌', vi: 'Văn Xương', category: 'lucky_star' },
  { zh: '文曲', vi: 'Văn Khúc', category: 'lucky_star' },
  { zh: '天魁', vi: 'Thiên Khôi', category: 'lucky_star' },
  { zh: '天钺', vi: 'Thiên Việt', category: 'lucky_star' },
  { zh: '禄存', vi: 'Lộc Tồn', category: 'lucky_star' },
  { zh: '天马', vi: 'Thiên Mã', category: 'lucky_star' },
];

// Phụ tinh - sát tinh
export const SHA_STARS: GlossaryEntry[] = [
  { zh: '擎羊', vi: 'Kình Dương', category: 'sha_star' },
  { zh: '陀罗', vi: 'Đà La', category: 'sha_star' },
  { zh: '火星', vi: 'Hỏa Tinh', category: 'sha_star' },
  { zh: '铃星', vi: 'Linh Tinh', category: 'sha_star' },
  { zh: '地空', vi: 'Địa Không', category: 'sha_star' },
  { zh: '地劫', vi: 'Địa Kiếp', category: 'sha_star' },
];

// 12 Cung
export const PALACES: GlossaryEntry[] = [
  { zh: '命宫', vi: 'Cung Mệnh', category: 'palace' },
  { zh: '兄弟宫', vi: 'Cung Huynh Đệ', category: 'palace' },
  { zh: '夫妻宫', vi: 'Cung Phu Thê', category: 'palace' },
  { zh: '子女宫', vi: 'Cung Tử Tức', category: 'palace' },
  { zh: '财帛宫', vi: 'Cung Tài Bạch', category: 'palace' },
  { zh: '疾厄宫', vi: 'Cung Tật Ách', category: 'palace' },
  { zh: '迁移宫', vi: 'Cung Thiên Di', category: 'palace' },
  { zh: '仆役宫', vi: 'Cung Nô Bộc', category: 'palace' },
  { zh: '交友宫', vi: 'Cung Giao Hữu', category: 'palace' },
  { zh: '官禄宫', vi: 'Cung Quan Lộc', category: 'palace' },
  { zh: '田宅宫', vi: 'Cung Điền Trạch', category: 'palace' },
  { zh: '福德宫', vi: 'Cung Phúc Đức', category: 'palace' },
  { zh: '父母宫', vi: 'Cung Phụ Mẫu', category: 'palace' },
];

// Tứ hóa
export const SI_HUA: GlossaryEntry[] = [
  { zh: '化禄', vi: 'Hóa Lộc', category: 'si_hua' },
  { zh: '化权', vi: 'Hóa Quyền', category: 'si_hua' },
  { zh: '化科', vi: 'Hóa Khoa', category: 'si_hua' },
  { zh: '化忌', vi: 'Hóa Kỵ', category: 'si_hua' },
  // Đơn ký tự tứ hóa
  { zh: '禄', vi: 'Lộc', category: 'si_hua' },
  { zh: '权', vi: 'Quyền', category: 'si_hua' },
  { zh: '科', vi: 'Khoa', category: 'si_hua' },
  { zh: '忌', vi: 'Kỵ', category: 'si_hua' },
];

// Can Chi - Thiên can
export const HEAVENLY_STEMS: GlossaryEntry[] = [
  { zh: '甲', vi: 'Giáp', category: 'stem' },
  { zh: '乙', vi: 'Ất', category: 'stem' },
  { zh: '丙', vi: 'Bính', category: 'stem' },
  { zh: '丁', vi: 'Đinh', category: 'stem' },
  { zh: '戊', vi: 'Mậu', category: 'stem' },
  { zh: '己', vi: 'Kỷ', category: 'stem' },
  { zh: '庚', vi: 'Canh', category: 'stem' },
  { zh: '辛', vi: 'Tân', category: 'stem' },
  { zh: '壬', vi: 'Nhâm', category: 'stem' },
  { zh: '癸', vi: 'Quý', category: 'stem' },
];

// Địa chi
export const EARTHLY_BRANCHES: GlossaryEntry[] = [
  { zh: '子', vi: 'Tý', category: 'branch' },
  { zh: '丑', vi: 'Sửu', category: 'branch' },
  { zh: '寅', vi: 'Dần', category: 'branch' },
  { zh: '卯', vi: 'Mão', category: 'branch' },
  { zh: '辰', vi: 'Thìn', category: 'branch' },
  { zh: '巳', vi: 'Tỵ', category: 'branch' },
  { zh: '午', vi: 'Ngọ', category: 'branch' },
  { zh: '未', vi: 'Mùi', category: 'branch' },
  { zh: '申', vi: 'Thân', category: 'branch' },
  { zh: '酉', vi: 'Dậu', category: 'branch' },
  { zh: '戌', vi: 'Tuất', category: 'branch' },
  { zh: '亥', vi: 'Hợi', category: 'branch' },
];

// Trạng thái sao (Miếu/Vượng/Đắc/Hãm)
export const STAR_BRIGHTNESS: GlossaryEntry[] = [
  { zh: '庙', vi: 'Miếu', category: 'brightness' },
  { zh: '旺', vi: 'Vượng', category: 'brightness' },
  { zh: '得', vi: 'Đắc', category: 'brightness' },
  { zh: '利', vi: 'Lợi', category: 'brightness' },
  { zh: '平', vi: 'Bình', category: 'brightness' },
  { zh: '不', vi: 'Bất', category: 'brightness' },
  { zh: '陷', vi: 'Hãm', category: 'brightness' },
];

// Giới tính
export const GENDER: GlossaryEntry[] = [
  { zh: '男', vi: 'Nam', category: 'gender' },
  { zh: '女', vi: 'Nữ', category: 'gender' },
];

// Âm dương
export const YIN_YANG: GlossaryEntry[] = [
  { zh: '阳', vi: 'Dương', category: 'yin_yang' },
  { zh: '阴', vi: 'Âm', category: 'yin_yang' },
];

// Ngũ hành
export const FIVE_ELEMENTS: GlossaryEntry[] = [
  { zh: '木', vi: 'Mộc', category: 'element' },
  { zh: '火', vi: 'Hỏa', category: 'element' },
  { zh: '土', vi: 'Thổ', category: 'element' },
  { zh: '金', vi: 'Kim', category: 'element' },
  { zh: '水', vi: 'Thủy', category: 'element' },
];

// Ngũ âm cục
export const NAYIN_JU: GlossaryEntry[] = [
  { zh: '水二局', vi: 'Thủy Nhị Cục', category: 'nayin_ju' },
  { zh: '木三局', vi: 'Mộc Tam Cục', category: 'nayin_ju' },
  { zh: '金四局', vi: 'Kim Tứ Cục', category: 'nayin_ju' },
  { zh: '土五局', vi: 'Thổ Ngũ Cục', category: 'nayin_ju' },
  { zh: '火六局', vi: 'Hỏa Lục Cục', category: 'nayin_ju' },
];

// Giờ (Thập nhị thần)
export const SHICHEN: GlossaryEntry[] = [
  { zh: '子时', vi: 'Giờ Tý', category: 'shichen' },
  { zh: '丑时', vi: 'Giờ Sửu', category: 'shichen' },
  { zh: '寅时', vi: 'Giờ Dần', category: 'shichen' },
  { zh: '卯时', vi: 'Giờ Mão', category: 'shichen' },
  { zh: '辰时', vi: 'Giờ Thìn', category: 'shichen' },
  { zh: '巳时', vi: 'Giờ Tỵ', category: 'shichen' },
  { zh: '午时', vi: 'Giờ Ngọ', category: 'shichen' },
  { zh: '未时', vi: 'Giờ Mùi', category: 'shichen' },
  { zh: '申时', vi: 'Giờ Thân', category: 'shichen' },
  { zh: '酉时', vi: 'Giờ Dậu', category: 'shichen' },
  { zh: '戌时', vi: 'Giờ Tuất', category: 'shichen' },
  { zh: '亥时', vi: 'Giờ Hợi', category: 'shichen' },
];

// Thuật ngữ khác
export const OTHER_TERMS: GlossaryEntry[] = [
  { zh: '大限', vi: 'Đại Hạn', category: 'term' },
  { zh: '流年', vi: 'Lưu Niên', category: 'term' },
  { zh: '流月', vi: 'Lưu Nguyệt', category: 'term' },
  { zh: '命盘', vi: 'Lá Số', category: 'term' },
  { zh: '格局', vi: 'Cách Cục', category: 'term' },
  { zh: '三方四正', vi: 'Tam Phương Tứ Chính', category: 'term' },
  { zh: '对宫', vi: 'Đối Cung', category: 'term' },
  { zh: '空宫', vi: 'Không Cung', category: 'term' },
  { zh: '借星', vi: 'Tá Tinh', category: 'term' },
  { zh: '自化', vi: 'Tự Hóa', category: 'term' },
  { zh: '来因宫', vi: 'Lai Nhân Cung', category: 'term' },
  { zh: '身宫', vi: 'Thân Cung', category: 'term' },
  { zh: '本命', vi: 'Bản Mệnh', category: 'term' },
  { zh: '纳音', vi: 'Nạp Âm', category: 'term' },
  { zh: '五行', vi: 'Ngũ Hành', category: 'term' },
];

// Export gộp tất cả
export const ZH_VI_GLOSSARY: GlossaryEntry[] = [
  ...MAIN_STARS,
  ...LUCKY_STARS,
  ...SHA_STARS,
  ...PALACES,
  ...SI_HUA,
  ...HEAVENLY_STEMS,
  ...EARTHLY_BRANCHES,
  ...STAR_BRIGHTNESS,
  ...GENDER,
  ...YIN_YANG,
  ...FIVE_ELEMENTS,
  ...NAYIN_JU,
  ...SHICHEN,
  ...OTHER_TERMS,
];

// Tạo map tra cứu nhanh
export const ZH_TO_VI_MAP: Record<string, string> = Object.fromEntries(
  ZH_VI_GLOSSARY.map(entry => [entry.zh, entry.vi])
);
